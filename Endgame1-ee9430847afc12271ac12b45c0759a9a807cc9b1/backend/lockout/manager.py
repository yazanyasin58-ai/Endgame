from __future__ import annotations
import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum

from backend.core.state import get_session, update_session, LockoutStatus
from backend.rules.models import Violation, ViolationSeverity

# Desktop Agent WebSocket server reference — injected at startup
_agent_ws = None


def set_agent_ws(ws):
    global _agent_ws
    _agent_ws = ws


class LockLevel(str, Enum):
    SOFT = "SOFT_LOCK"
    HARD = "HARD_LOCK"
    UNLOCK = "UNLOCK"


@dataclass
class LockoutAction:
    level: LockLevel
    reason: str
    duration_min: int = 0  # 0 = permanent (until manual unlock or end of day)


# Severity matrix from design spec
SEVERITY_MATRIX = [
    # (condition_fn, LockoutAction)
]


class LockoutManager:
    def __init__(self):
        self._broker_clients: dict[str, any] = {}

    def register_broker(self, account_id: str, client):
        self._broker_clients[account_id] = client

    def evaluate_and_trigger(
        self,
        violation: Violation,
        session,
    ) -> LockoutAction | None:
        """
        Implements the lockout severity matrix from the design spec.
        Returns LockoutAction or None if only a voice warning is needed.
        """
        override_count = session.override_count
        current_lock = session.lockout_status

        # Daily loss limit → hard lock rest of day, no unlock
        if violation.type.value == "DAILY_LOSS_LIMIT_HIT":
            update_session(lockout_status=LockoutStatus.DAY_DONE, lockout_reason=violation.message)
            return LockoutAction(LockLevel.HARD, violation.message, duration_min=0)

        # Consecutive loss limit → hard lock 15 min min
        if violation.type.value == "CONSECUTIVE_LOSS_LIMIT":
            expiry = datetime.utcnow() + timedelta(minutes=15)
            update_session(
                lockout_status=LockoutStatus.HARD,
                lockout_expiry=expiry,
                lockout_reason=violation.message,
            )
            return LockoutAction(LockLevel.HARD, violation.message, duration_min=15)

        # Biometric RED + order → hard lock until baseline
        if violation.type.value == "BIOMETRIC_RED_WITH_ORDER" and violation.severity == ViolationSeverity.HARD_LOCK:
            expiry = datetime.utcnow() + timedelta(minutes=15)
            update_session(
                lockout_status=LockoutStatus.HARD,
                lockout_expiry=expiry,
                lockout_reason=violation.message,
            )
            return LockoutAction(LockLevel.HARD, violation.message, duration_min=15)

        # Repeated override (3x) → hard lock 30 min
        if override_count >= 3:
            expiry = datetime.utcnow() + timedelta(minutes=30)
            update_session(
                lockout_status=LockoutStatus.HARD,
                lockout_expiry=expiry,
                lockout_reason="Repeated override — 30 minute lockout.",
            )
            return LockoutAction(LockLevel.HARD, "Three overrides. You're locked for 30 minutes.", duration_min=30)

        # Second violation same session → soft lock + voice 5 min
        if current_lock == LockoutStatus.SOFT or violation.severity == ViolationSeverity.SOFT_LOCK:
            expiry = datetime.utcnow() + timedelta(minutes=5)
            update_session(
                lockout_status=LockoutStatus.SOFT,
                lockout_expiry=expiry,
                lockout_reason=violation.message,
            )
            return LockoutAction(LockLevel.SOFT, violation.message, duration_min=5)

        # First warning — voice only, no overlay
        return None

    async def execute(self, action: LockoutAction):
        """Send lockout command to Desktop Agent → Chrome Extension."""
        if _agent_ws:
            await _agent_ws.send_lockout(
                level=action.level.value,
                reason=action.reason,
                duration_sec=action.duration_min * 60,
            )

        # API-level broker lockout for accounts with direct API
        session = get_session()
        account_id = session.active_account
        if action.level in (LockLevel.HARD,):
            client = self._broker_clients.get(account_id)
            if client:
                try:
                    await client.cancel_all_orders()
                    if action.duration_min == 0:  # Day done
                        await client.disable_trading()
                except Exception as e:
                    print(f"[Lockout] Broker API lockout failed: {e}")

        # Push notification for hard locks
        if action.level == LockLevel.HARD:
            await self._push(
                title="Jarvis — Hard Lock",
                message=action.reason[:200],
            )

    async def unlock(self):
        """Send unlock command to Chrome Extension and re-enable trading."""
        session = get_session()
        if session.lockout_status == LockoutStatus.DAY_DONE:
            return  # No unlock for daily limit

        update_session(lockout_status=LockoutStatus.NONE, lockout_expiry=None, lockout_reason="")

        if _agent_ws:
            await _agent_ws.send_lockout(level="UNLOCK", reason="", duration_sec=0)

        # Re-enable broker
        account_id = session.active_account
        client = self._broker_clients.get(account_id)
        if client:
            try:
                await client.enable_trading()
            except Exception as e:
                print(f"[Lockout] Broker re-enable failed: {e}")

    async def _push(self, title: str, message: str):
        import httpx
        from backend.config import settings
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.post(
                    "https://api.pushover.net/1/messages.json",
                    data={
                        "token": settings.pushover_app_token,
                        "user": settings.pushover_user_key,
                        "title": title,
                        "message": message,
                        "priority": 1,
                    },
                )
        except Exception as e:
            print(f"[Lockout] Push notification failed: {e}")


# Module-level singleton
lockout_manager = LockoutManager()
