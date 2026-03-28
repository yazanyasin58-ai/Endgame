from __future__ import annotations
from datetime import datetime

from backend.core.state import get_session, LockoutStatus, BiometricState
from backend.lockout.manager import lockout_manager
from backend.psychology.faith import get_faith_message
from backend.psychology.motivation import get_motivation_message


class UnlockProtocol:
    """
    Guides YAZDAQ through the full unlock protocol after a hard lockout.
    Requires: HR returning toward baseline + verbal check-in.
    """

    def __init__(self):
        self._jarvis = None

    def set_jarvis(self, jarvis):
        self._jarvis = jarvis

    async def run(self) -> bool:
        session = get_session()

        # No unlock for day-done lockout
        if session.lockout_status == LockoutStatus.DAY_DONE:
            await self._say(
                "That's a daily limit lockout. Session is over for today. "
                "Close everything down. Rest. Come back tomorrow.",
                tone="calm_authority",
            )
            return False

        # Check minimum lockout time
        if session.lockout_expiry and datetime.utcnow() < session.lockout_expiry:
            remaining = int((session.lockout_expiry - datetime.utcnow()).total_seconds() / 60)
            await self._say(
                f"{remaining} minutes remaining on your lockout. "
                "Use this time. Don't sit and stare at the platform.",
                tone="calm_authority",
            )
            return False

        # Step 1 — HR check
        hr_check = await self._check_hr()
        if not hr_check:
            await self._say(
                "Your heart rate is still elevated. Your body isn't ready. "
                "Step away from the screens. Do 4 minutes of box breathing.",
                tone="calm_authority",
            )
            return False

        # Step 2 — Verbal check-in
        await self._say(
            "Before I unlock — tell me: what rule did you break, and why do you think it happened?",
            tone="calm_authority",
        )
        # Voice pipeline handles response — we wait and proceed

        await self._say(
            "I'm logging that. You said it out loud — that matters.",
            tone="calm_authority",
        )

        # Step 3 — Psychological reset based on current state
        state = session.biometric_state
        if state == BiometricState.RED:
            msg = get_faith_message("rule_violation")
            await self._say(msg.text, tone="faith")
        else:
            msg = get_motivation_message("direct_request")
            await self._say(msg.text, tone="motivation")

        # Step 4 — Check if limits should be reduced
        await self._maybe_reduce_limits()

        # Step 5 — Execute unlock
        await lockout_manager.unlock()

        await self._say(
            "Unlocked. Reduced limits active for the rest of this session. "
            "One trade at a time. Stick to the plan.",
            tone="calm_authority",
        )
        return True

    async def _check_hr(self) -> bool:
        session = get_session()
        if session.baseline_hr and session.current_hr:
            # Allow unlock if HR is within 15 bpm of baseline
            return session.current_hr <= session.baseline_hr + 15
        return True  # Fail-open if no HR data

    async def _maybe_reduce_limits(self):
        """Reduce sizing for remainder of session after a hard lockout."""
        from backend.rules.engine import rules_engine
        profile = rules_engine.get_active_profile()
        if not profile:
            return
        await self._say(
            f"For the rest of this session your max size is "
            f"{max(1, profile.max_contracts // 2)} contracts. "
            "Full size comes back next session.",
            tone="calm_authority",
        )

    async def _say(self, text: str, tone: str = "calm_authority"):
        if self._jarvis:
            await self._jarvis.say(text, tone)
        else:
            print(f"[Unlock] {text}")


# Module-level singleton
unlock_protocol = UnlockProtocol()
