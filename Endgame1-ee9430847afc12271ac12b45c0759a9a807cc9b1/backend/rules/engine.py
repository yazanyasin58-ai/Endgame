from __future__ import annotations
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo

from backend.rules.models import (
    Violation, ViolationType, ViolationSeverity, RuleProfile, Trade, ScreenEvent,
)
from backend.rules.profiles import load_all_profiles
from backend.core.state import get_session, BiometricState

ET = ZoneInfo("America/New_York")

# Violation message templates keyed by type
MESSAGES: dict[ViolationType, str] = {
    ViolationType.POSITION_SIZE_EXCEEDED: (
        "That size is over your limit on this account. Resize before you send."
    ),
    ViolationType.DAILY_LOSS_LIMIT_HIT: (
        "You've hit your daily limit. Session is over. Close everything."
    ),
    ViolationType.CONSECUTIVE_LOSS_LIMIT: (
        "{count} losses back to back. Your rule says take {cooldown} minutes. Step away from the screen."
    ),
    ViolationType.RESTRICTED_HOURS_BREACH: (
        "You don't trade the first 15 minutes. Close the ticket."
    ),
    ViolationType.REVENGE_TRADE_DETECTED: (
        "That's revenge trading. {cooldown} minutes isn't up. You know this."
    ),
    ViolationType.ADDING_TO_LOSER: (
        "You're adding to a losing position. That's not in the plan. Close the add."
    ),
    ViolationType.BIOMETRIC_RED_WITH_ORDER: (
        "Your body is red-lining and you have an order open. Close the ticket. Breathe first."
    ),
    ViolationType.MAX_TRADES_EXCEEDED: (
        "You've hit your max trades for today. {count}/{max}. Session is over."
    ),
}


class RulesEngine:
    def __init__(self):
        self._profiles: dict[str, RuleProfile] = {}
        self._reload_profiles()

    def _reload_profiles(self):
        try:
            self._profiles = load_all_profiles()
        except Exception:
            self._profiles = {}

    def get_active_profile(self) -> RuleProfile | None:
        account_id = get_session().active_account
        return self._profiles.get(account_id)

    def get_profile(self, account_id: str) -> RuleProfile | None:
        return self._profiles.get(account_id)

    def set_active_account(self, account_id: str):
        from backend.core.state import update_session
        update_session(active_account=account_id)

    def evaluate_trade_close(self, trade: Trade) -> list[Violation]:
        profile = self.get_active_profile()
        if not profile:
            return []

        session = get_session()
        violations = []

        # Update session state
        from backend.core.state import update_session
        new_pnl = session.daily_pnl + trade.pnl
        new_count = session.trade_count + 1
        new_consec = session.consecutive_losses + 1 if trade.pnl < 0 else 0
        update_session(
            daily_pnl=new_pnl,
            trade_count=new_count,
            consecutive_losses=new_consec,
            last_trade_timestamp=trade.closed_at,
        )

        # Daily loss limit
        if abs(new_pnl) >= profile.max_daily_loss and new_pnl < 0:
            violations.append(Violation(
                type=ViolationType.DAILY_LOSS_LIMIT_HIT,
                severity=ViolationSeverity.HARD_LOCK,
                message=MESSAGES[ViolationType.DAILY_LOSS_LIMIT_HIT],
                tone="hard_interrupt",
                account_id=trade.account_id,
            ))

        # Consecutive loss limit
        if new_consec >= profile.max_consecutive_losses:
            msg = MESSAGES[ViolationType.CONSECUTIVE_LOSS_LIMIT].format(
                count=new_consec,
                cooldown=profile.revenge_trade_cooldown_min,
            )
            violations.append(Violation(
                type=ViolationType.CONSECUTIVE_LOSS_LIMIT,
                severity=ViolationSeverity.HARD_LOCK,
                message=msg,
                tone="hard_interrupt",
                account_id=trade.account_id,
            ))

        # Max trades
        if new_count >= profile.max_trades_per_day:
            msg = MESSAGES[ViolationType.MAX_TRADES_EXCEEDED].format(
                count=new_count, max=profile.max_trades_per_day
            )
            violations.append(Violation(
                type=ViolationType.MAX_TRADES_EXCEEDED,
                severity=ViolationSeverity.HARD_LOCK,
                message=msg,
                tone="hard_interrupt",
                account_id=trade.account_id,
            ))

        return violations

    def evaluate_screen_event(self, event: ScreenEvent) -> list[Violation]:
        profile = self.get_profile(event.platform) or self.get_active_profile()
        if not profile:
            return []

        session = get_session()
        violations = []
        now_et = datetime.now(ET)

        # Position size check
        if event.order_ticket_open and event.detected_order_size is not None:
            max_size = profile.max_contracts if profile.platform != "tradelocker" else profile.max_lot_size
            if event.detected_order_size > max_size > 0:
                violations.append(Violation(
                    type=ViolationType.POSITION_SIZE_EXCEEDED,
                    severity=ViolationSeverity.SOFT_LOCK,
                    message=MESSAGES[ViolationType.POSITION_SIZE_EXCEEDED],
                    tone="hard_interrupt",
                ))

        # Daily loss limit check (from screen P&L)
        if event.detected_pnl is not None and event.order_ticket_open:
            if abs(event.detected_pnl) >= profile.max_daily_loss and event.detected_pnl < 0:
                violations.append(Violation(
                    type=ViolationType.DAILY_LOSS_LIMIT_HIT,
                    severity=ViolationSeverity.HARD_LOCK,
                    message=MESSAGES[ViolationType.DAILY_LOSS_LIMIT_HIT],
                    tone="hard_interrupt",
                ))

        # Restricted hours
        if event.order_ticket_open and profile.restricted_hours:
            for window in _parse_restricted_windows(profile.restricted_hours):
                start, end = window
                trade_time = now_et.replace(hour=start[0], minute=start[1], second=0)
                trade_end = now_et.replace(hour=end[0], minute=end[1], second=0)
                if trade_time <= now_et <= trade_end:
                    violations.append(Violation(
                        type=ViolationType.RESTRICTED_HOURS_BREACH,
                        severity=ViolationSeverity.SOFT_LOCK,
                        message=MESSAGES[ViolationType.RESTRICTED_HOURS_BREACH],
                        tone="hard_interrupt",
                    ))
                    break

        # Revenge trade: order open within cooldown of last loss
        if event.order_ticket_open and session.last_trade_timestamp and session.consecutive_losses > 0:
            cooldown = timedelta(minutes=profile.revenge_trade_cooldown_min)
            since_last = datetime.utcnow() - session.last_trade_timestamp.replace(tzinfo=None)
            if since_last < cooldown:
                msg = MESSAGES[ViolationType.REVENGE_TRADE_DETECTED].format(
                    cooldown=profile.revenge_trade_cooldown_min
                )
                violations.append(Violation(
                    type=ViolationType.REVENGE_TRADE_DETECTED,
                    severity=ViolationSeverity.SOFT_LOCK,
                    message=msg,
                    tone="hard_interrupt",
                ))

        # Biometric red + order ticket
        if event.order_ticket_open and session.biometric_state == BiometricState.RED:
            violations.append(Violation(
                type=ViolationType.BIOMETRIC_RED_WITH_ORDER,
                severity=ViolationSeverity.HARD_LOCK,
                message=MESSAGES[ViolationType.BIOMETRIC_RED_WITH_ORDER],
                tone="hard_interrupt",
            ))

        return violations

    def evaluate_voice_transcript(self, text: str) -> list[Violation]:
        profile = self.get_active_profile()
        if not profile:
            return []

        text_lower = text.lower()
        violations = []

        # Detect sizing up language
        size_triggers = ["all in", "max size", "full size", "size up", "go big", "double down"]
        for trigger in size_triggers:
            if trigger in text_lower:
                violations.append(Violation(
                    type=ViolationType.POSITION_SIZE_EXCEEDED,
                    severity=ViolationSeverity.WARNING,
                    message="You just said something that sounds like you're about to oversize. Check the profile.",
                    tone="calm_authority",
                ))
                break

        # Revenge trade language
        revenge_triggers = ["give it back", "get it back", "make it back", "recover it", "just one more"]
        for trigger in revenge_triggers:
            if trigger in text_lower:
                violations.append(Violation(
                    type=ViolationType.REVENGE_TRADE_DETECTED,
                    severity=ViolationSeverity.WARNING,
                    message="That's revenge trading language. Stop. Breathe. Check the chart, not the P&L.",
                    tone="hard_interrupt",
                ))
                break

        return violations

    def evaluate_biometric(self, hr: int, hrv: float) -> list[Violation]:
        session = get_session()
        violations = []

        if hr > 95 and session.daily_pnl != 0:
            violations.append(Violation(
                type=ViolationType.BIOMETRIC_RED_WITH_ORDER,
                severity=ViolationSeverity.WARNING,
                message=f"Heart rate is {hr} bpm. Your body is telling you something. Slow down.",
                tone="calm_authority",
            ))

        if session.baseline_hrv and hrv < session.baseline_hrv * 0.8:
            violations.append(Violation(
                type=ViolationType.BIOMETRIC_RED_WITH_ORDER,
                severity=ViolationSeverity.WARNING,
                message="Your HRV has dropped significantly from your session baseline. Step back 60 seconds.",
                tone="faith",
            ))

        return violations


def _parse_restricted_windows(hours: list[list[int]]) -> list[tuple[tuple, tuple]]:
    """Pair up [h, m] entries as start/end windows."""
    windows = []
    for i in range(0, len(hours) - 1, 2):
        start = (hours[i][0], hours[i][1])
        end = (hours[i + 1][0], hours[i + 1][1])
        windows.append((start, end))
    return windows


# Module-level singleton
rules_engine = RulesEngine()
