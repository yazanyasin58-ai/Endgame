from __future__ import annotations
from datetime import datetime
from enum import Enum
from pydantic import BaseModel


class ViolationType(str, Enum):
    POSITION_SIZE_EXCEEDED = "POSITION_SIZE_EXCEEDED"
    DAILY_LOSS_LIMIT_HIT = "DAILY_LOSS_LIMIT_HIT"
    CONSECUTIVE_LOSS_LIMIT = "CONSECUTIVE_LOSS_LIMIT"
    RESTRICTED_HOURS_BREACH = "RESTRICTED_HOURS_BREACH"
    REVENGE_TRADE_DETECTED = "REVENGE_TRADE_DETECTED"
    ADDING_TO_LOSER = "ADDING_TO_LOSER"
    BIOMETRIC_RED_WITH_ORDER = "BIOMETRIC_RED_WITH_ORDER"
    MAX_TRADES_EXCEEDED = "MAX_TRADES_EXCEEDED"


class ViolationSeverity(str, Enum):
    WARNING = "WARNING"
    SOFT_LOCK = "SOFT_LOCK"
    HARD_LOCK = "HARD_LOCK"


class Violation(BaseModel):
    type: ViolationType
    severity: ViolationSeverity
    message: str
    tone: str = "hard_interrupt"
    account_id: str = ""


class RuleProfile(BaseModel):
    account_id: str
    platform: str                      # tradovate | tradelocker | projectx | tradesea
    account_type: str                  # funded | live
    display_name: str
    max_daily_loss: float              # USD
    max_contracts: int                 # futures
    max_lot_size: float                # forex
    max_trades_per_day: int
    max_consecutive_losses: int
    restricted_hours: list[list[int]]  # [[9, 30], [9, 45]] = no trading 9:30–9:45 ET
    revenge_trade_cooldown_min: int
    trading_demons: list[str] = []


class Trade(BaseModel):
    trade_id: str
    account_id: str
    instrument: str
    direction: str                     # LONG | SHORT
    entry_price: float
    exit_price: float
    size: float
    pnl: float
    opened_at: datetime
    closed_at: datetime
    platform: str


class ScreenEvent(BaseModel):
    platform: str
    screenshot_b64: str
    detected_order_size: float | None = None
    detected_pnl: float | None = None
    order_ticket_open: bool = False
    position_open: bool = False
    timestamp: datetime = None

    def model_post_init(self, __context):
        if self.timestamp is None:
            self.timestamp = datetime.utcnow()
