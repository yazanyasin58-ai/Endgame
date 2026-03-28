from __future__ import annotations
from datetime import datetime
from enum import Enum
from pydantic import BaseModel


class LockoutStatus(str, Enum):
    NONE = "NONE"
    SOFT = "SOFT"
    HARD = "HARD"
    DAY_DONE = "DAY_DONE"


class BiometricState(str, Enum):
    GREEN = "GREEN"
    AMBER = "AMBER"
    RED = "RED"
    UNKNOWN = "UNKNOWN"


class SessionState(BaseModel):
    active_account: str = ""
    daily_pnl: float = 0.0
    trade_count: int = 0
    consecutive_losses: int = 0
    last_trade_timestamp: datetime | None = None
    lockout_status: LockoutStatus = LockoutStatus.NONE
    lockout_expiry: datetime | None = None
    lockout_reason: str = ""
    session_armed: bool = False
    ritual_complete: bool = False
    biometric_state: BiometricState = BiometricState.UNKNOWN
    override_count: int = 0

    # Live biometric snapshot (populated at ritual baseline capture)
    current_hr: int | None = None
    current_hrv: float | None = None
    baseline_hr: int | None = None
    baseline_hrv: float | None = None
    recovery_score: int | None = None
    sleep_performance: int | None = None


# Module-level shared state — single user system, singleton is correct
_state = SessionState()


def get_session() -> SessionState:
    return _state


def update_session(**kwargs) -> SessionState:
    global _state
    _state = _state.model_copy(update=kwargs)
    return _state


def reset_session(active_account: str = "") -> SessionState:
    global _state
    _state = SessionState(active_account=active_account)
    return _state
