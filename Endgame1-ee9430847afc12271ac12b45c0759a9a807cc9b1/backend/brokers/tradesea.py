from backend.brokers.base import BaseBroker


class TradeseaBroker(BaseBroker):
    """
    Tradesea / Lucid — screen-only (no direct API).
    All monitoring is via Desktop Agent screen capture + Chrome Extension lockout.
    """

    source = "screen_only"
    platform = "tradesea"
    account_id = "tradesea_lucid"

    async def authenticate(self) -> bool:
        print("[Tradesea] Screen-only broker — no API auth required.")
        return True

    async def get_daily_pnl(self) -> float:
        return 0.0  # Sourced from screen analysis

    async def get_open_positions(self) -> list[dict]:
        return []  # Sourced from screen analysis

    async def cancel_all_orders(self) -> bool:
        print("[Tradesea] Cannot cancel orders via API — lockout via Chrome Extension only.")
        return False

    async def disable_trading(self) -> bool:
        print("[Tradesea] Cannot disable via API — Chrome Extension overlay active.")
        return False

    async def enable_trading(self) -> bool:
        return True
