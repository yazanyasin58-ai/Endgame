from __future__ import annotations
import asyncio
import json
import time
from typing import Callable

import httpx
import websockets

from backend.brokers.base import BaseBroker, AccountSummary
from backend.config import settings

LIVE_BASE = "https://live.tradovateapi.com/v1"
DEMO_BASE = "https://demo.tradovateapi.com/v1"
MD_WS = "wss://md.tradovateapi.com/v1/websocket"


class TradovateBroker(BaseBroker):
    """
    Tradovate REST + WebSocket integration.
    Auth: username + password + appId + cid/sec
    """

    source = "api"
    platform = "tradovate"
    account_id = "tradovate_alpha"

    def __init__(self, use_demo: bool = False):
        self._base = DEMO_BASE if use_demo else LIVE_BASE
        self._token: str | None = None
        self._token_expiry: float = 0
        self._account_spec: str | None = None
        self._account_id_num: int | None = None
        self._fill_callbacks: list[Callable] = []
        self._ws_task: asyncio.Task | None = None

    def on_fill(self, callback: Callable):
        self._fill_callbacks.append(callback)

    async def authenticate(self) -> bool:
        payload = {
            "name": settings.tradovate_username,
            "password": settings.tradovate_password,
            "appId": "Jarvis",
            "appVersion": "1.0",
            "deviceId": "jarvis-backend-001",
            "cid": settings.tradovate_client_id,
            "sec": settings.tradovate_client_secret,
        }
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(f"{self._base}/auth/accesstokenrequest", json=payload)
            resp.raise_for_status()
            data = resp.json()
            self._token = data.get("accessToken")
            # Token valid for 24h
            self._token_expiry = time.time() + 86400
            print(f"[Tradovate] Authenticated. Token expires in 24h.")
            await self._fetch_account_info()
            return bool(self._token)

    async def _ensure_token(self):
        if not self._token or time.time() > self._token_expiry - 300:
            await self.authenticate()

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self._token}"}

    async def _fetch_account_info(self):
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{self._base}/account/list", headers=self._headers())
            resp.raise_for_status()
            accounts = resp.json()
            if accounts:
                acc = accounts[0]
                self._account_id_num = acc["id"]
                self._account_spec = acc.get("name", str(acc["id"]))
                print(f"[Tradovate] Account: {self._account_spec} (id={self._account_id_num})")

    async def get_daily_pnl(self) -> float:
        await self._ensure_token()
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{self._base}/cashBalance/getcashbalancesnapshot",
                params={"accountId": self._account_id_num},
                headers=self._headers(),
            )
            if resp.status_code == 200:
                data = resp.json()
                return float(data.get("openPnL", 0) + data.get("realizedPnL", 0))
        return 0.0

    async def get_open_positions(self) -> list[dict]:
        await self._ensure_token()
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{self._base}/position/list",
                headers=self._headers(),
            )
            if resp.status_code == 200:
                return resp.json()
        return []

    async def cancel_all_orders(self) -> bool:
        await self._ensure_token()
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{self._base}/order/list",
                headers=self._headers(),
            )
            if resp.status_code != 200:
                return False
            orders = resp.json()
            for order in orders:
                if order.get("ordStatus") in ("Working", "PendingNew"):
                    await client.post(
                        f"{self._base}/order/cancelorder",
                        json={"orderId": order["id"]},
                        headers=self._headers(),
                    )
        return True

    async def disable_trading(self) -> bool:
        """Set risk limits to zero — effectively prevents new orders."""
        await self._ensure_token()
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{self._base}/account/setrisklimits",
                json={
                    "accountId": self._account_id_num,
                    "maxDrawdown": 0,
                    "maxOrderQty": 0,
                    "maxPos": 0,
                },
                headers=self._headers(),
            )
            return resp.status_code == 200

    async def enable_trading(self) -> bool:
        """Restore risk limits to rule profile values."""
        from backend.rules.profiles import load_profile
        profile = load_profile(self.account_id)
        await self._ensure_token()
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{self._base}/account/setrisklimits",
                json={
                    "accountId": self._account_id_num,
                    "maxDrawdown": int(profile.max_daily_loss),
                    "maxOrderQty": profile.max_contracts,
                    "maxPos": profile.max_contracts,
                },
                headers=self._headers(),
            )
            return resp.status_code == 200

    async def start_live_feed(self):
        """Subscribe to real-time fills via Tradovate MD WebSocket."""
        self._ws_task = asyncio.create_task(self._ws_loop())

    async def _ws_loop(self):
        await self._ensure_token()
        while True:
            try:
                async with websockets.connect(MD_WS) as ws:
                    # Authenticate on WS
                    await ws.send(json.dumps({
                        "op": "authorize",
                        "args": [self._token],
                    }))
                    # Subscribe to account updates
                    await ws.send(json.dumps({
                        "op": "subscribe",
                        "args": ["user/syncrequest", {}],
                    }))
                    async for msg in ws:
                        await self._handle_ws_message(json.loads(msg))
            except Exception as e:
                print(f"[Tradovate WS] Error: {e}. Reconnecting in 5s...")
                await asyncio.sleep(5)

    async def _handle_ws_message(self, data: dict):
        event_type = data.get("e")
        if event_type == "fill":
            fill = data.get("d", {})
            for cb in self._fill_callbacks:
                asyncio.create_task(cb(fill))
