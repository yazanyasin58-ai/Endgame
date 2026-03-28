from backend.brokers.base import BaseBroker


class ProjectXBroker(BaseBroker):
    """
    Project X / Topstep — screen-only (no direct API).
    All monitoring is via Desktop Agent screen capture + Chrome Extension lockout.
    """

    source = "screen_only"
    platform = "projectx"
    account_id = "projectx_topstep"

    async def authenticate(self) -> bool:
        print("[ProjectX] Screen-only broker — no API auth required.")
        return True

    async def get_daily_pnl(self) -> float:
        return 0.0  # Sourced from screen analysis

    async def get_open_positions(self) -> list[dict]:
        return []  # Sourced from screen analysis

    async def cancel_all_orders(self) -> bool:
        print("[ProjectX] Cannot cancel orders via API — lockout via Chrome Extension only.")
        return False

    async def disable_trading(self) -> bool:
        print("[ProjectX] Cannot disable via API — Chrome Extension overlay active.")
        return False

    async def enable_trading(self) -> bool:
        return True
