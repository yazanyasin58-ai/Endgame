from __future__ import annotations
import asyncio
from datetime import datetime

from backend.core.state import get_session, update_session, reset_session, SessionState
from backend.rules.profiles import load_all_profiles, load_profile
from backend.rules.models import RuleProfile


class SessionManager:
    """Manages session lifecycle: arm, disarm, live P&L tracking."""

    def __init__(self):
        self._profiles: dict[str, RuleProfile] = {}
        self._broker_clients: dict[str, any] = {}

    async def initialize(self):
        """Load all rule profiles at startup."""
        self._profiles = load_all_profiles()
        print(f"[Session] Loaded {len(self._profiles)} rule profiles: {list(self._profiles.keys())}")

    def register_broker(self, account_id: str, client):
        self._broker_clients[account_id] = client

    def set_active_account(self, account_id: str):
        profile = self._profiles.get(account_id)
        if not profile:
            raise ValueError(f"No profile for account: {account_id}")
        from backend.rules.engine import rules_engine
        rules_engine.set_active_account(account_id)
        print(f"[Session] Active account: {profile.display_name}")

    def arm_session(self):
        """Called after ritual Phase 6 completion. Arms all monitoring."""
        update_session(session_armed=True, ritual_complete=True)
        print("[Session] ARMED. All monitoring active.")

    def disarm_session(self):
        update_session(session_armed=False)
        print("[Session] Disarmed.")

    def end_session(self, active_account: str = ""):
        reset_session(active_account=active_account)
        print("[Session] Session reset.")

    def get_state(self) -> SessionState:
        return get_session()

    def update_pnl(self, pnl: float):
        update_session(daily_pnl=pnl)

    def record_trade(self, pnl: float, timestamp: datetime):
        session = get_session()
        new_consec = session.consecutive_losses + 1 if pnl < 0 else 0
        update_session(
            daily_pnl=session.daily_pnl + pnl,
            trade_count=session.trade_count + 1,
            consecutive_losses=new_consec,
            last_trade_timestamp=timestamp,
        )

    async def poll_broker_pnl(self, account_id: str) -> float | None:
        """Poll broker for current daily P&L."""
        client = self._broker_clients.get(account_id)
        if not client:
            return None
        try:
            return await client.get_daily_pnl()
        except Exception as e:
            print(f"[Session] PnL poll failed for {account_id}: {e}")
            return None


# Module-level singleton
session_manager = SessionManager()
