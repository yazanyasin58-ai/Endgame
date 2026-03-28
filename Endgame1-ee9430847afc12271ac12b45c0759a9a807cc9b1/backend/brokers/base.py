from __future__ import annotations
from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class AccountSummary:
    account_id: str
    platform: str
    daily_pnl: float
    open_positions: int
    cash_balance: float
    source: str = "api"  # api | screen_only


class BaseBroker(ABC):
    """Abstract broker — all platforms implement this interface."""

    source: str = "api"  # override to "screen_only" for non-API platforms

    @abstractmethod
    async def authenticate(self) -> bool:
        """Authenticate and store credentials. Returns True on success."""

    @abstractmethod
    async def get_daily_pnl(self) -> float:
        """Return today's realized + unrealized P&L."""

    @abstractmethod
    async def get_open_positions(self) -> list[dict]:
        """Return list of open positions."""

    @abstractmethod
    async def cancel_all_orders(self) -> bool:
        """Cancel all pending orders. Used in lockout."""

    @abstractmethod
    async def disable_trading(self) -> bool:
        """Disable order entry at broker level. Used in hard lockout."""

    @abstractmethod
    async def enable_trading(self) -> bool:
        """Re-enable trading after lockout expires."""

    async def get_summary(self) -> AccountSummary:
        pnl = await self.get_daily_pnl()
        positions = await self.get_open_positions()
        return AccountSummary(
            account_id=getattr(self, "account_id", "unknown"),
            platform=getattr(self, "platform", "unknown"),
            daily_pnl=pnl,
            open_positions=len(positions),
            cash_balance=0.0,
            source=self.source,
        )
