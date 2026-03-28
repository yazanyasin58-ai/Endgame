from __future__ import annotations
import asyncio
import time
from typing import Callable

import httpx

from backend.brokers.base import BaseBroker
from backend.config import settings

BASE = "https://app.tradelocker.com/backend-api"


class TradeLockerBroker(BaseBroker):
    """
    TradeLocker REST API integration (Hero FX live forex account).
    Auth: email + password + server → JWT access token
    No WebSocket — polls positions every 5 seconds during session.
    """

    source = "api"
    platform = "tradelocker"
    account_id = "tradelocker_herofx"

    def __init__(self):
        self._access_token: str | None = None
        self._refresh_token: str | None = None
        self._token_expiry: float = 0
        self._account_id: str | None = None
        self._fill_callbacks: list[Callable] = []
        self._poll_task: asyncio.Task | None = None
        self._last_positions: list[dict] = []

    def on_fill(self, callback: Callable):
        self._fill_callbacks.append(callback)

    async def authenticate(self) -> bool:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{BASE}/auth/jwt/token",
                json={
                    "email": settings.tradelocker_email,
                    "password": settings.tradelocker_password,
                    "server": settings.tradelocker_server,
                },
            )
            resp.raise_for_status()
            data = resp.json()
            self._access_token = data.get("accessToken")
            self._refresh_token = data.get("refreshToken")
            self._token_expiry = time.time() + data.get("accessTokenExpiry", 900)
            await self._fetch_account_id()
            print(f"[TradeLocker] Authenticated. Account: {self._account_id}")
            return bool(self._access_token)

    async def _refresh_auth(self):
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{BASE}/auth/jwt/refresh",
                json={"refreshToken": self._refresh_token},
            )
            if resp.status_code == 200:
                data = resp.json()
                self._access_token = data.get("accessToken")
                self._token_expiry = time.time() + data.get("accessTokenExpiry", 900)

    async def _ensure_token(self):
        if not self._access_token or time.time() > self._token_expiry - 60:
            if self._refresh_token:
                await self._refresh_auth()
            else:
                await self.authenticate()

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self._access_token}",
            "Content-Type": "application/json",
        }

    async def _fetch_account_id(self):
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{BASE}/trade/accounts", headers=self._headers())
            if resp.status_code == 200:
                accounts = resp.json().get("accounts", [])
                if accounts:
                    self._account_id = str(accounts[0].get("id", ""))

    async def get_daily_pnl(self) -> float:
        await self._ensure_token()
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{BASE}/trade/accounts/{self._account_id}",
                headers=self._headers(),
            )
            if resp.status_code == 200:
                data = resp.json()
                return float(data.get("dailyPnL", 0))
        return 0.0

    async def get_open_positions(self) -> list[dict]:
        await self._ensure_token()
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{BASE}/trade/positions",
                headers=self._headers(),
            )
            if resp.status_code == 200:
                return resp.json().get("positions", [])
        return []

    async def cancel_all_orders(self) -> bool:
        await self._ensure_token()
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{BASE}/trade/orders", headers=self._headers())
            if resp.status_code != 200:
                return False
            orders = resp.json().get("orders", [])
            for order in orders:
                order_id = order.get("id")
                if order_id:
                    await client.delete(
                        f"{BASE}/trade/orders/{order_id}",
                        headers=self._headers(),
                    )
        return True

    async def disable_trading(self) -> bool:
        await self._ensure_token()
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{BASE}/trade/accounts/{self._account_id}/disable",
                headers=self._headers(),
            )
            return resp.status_code in (200, 204)

    async def enable_trading(self) -> bool:
        await self._ensure_token()
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                f"{BASE}/trade/accounts/{self._account_id}/enable",
                headers=self._headers(),
            )
            return resp.status_code in (200, 204)

    async def start_poll(self):
        """Poll positions every 5s to detect fills."""
        self._poll_task = asyncio.create_task(self._poll_loop())

    async def _poll_loop(self):
        while True:
            try:
                current = await self.get_open_positions()
                closed = self._detect_closed_positions(self._last_positions, current)
                for pos in closed:
                    for cb in self._fill_callbacks:
                        asyncio.create_task(cb(pos))
                self._last_positions = current
            except Exception as e:
                print(f"[TradeLocker] Poll error: {e}")
            await asyncio.sleep(5)

    def _detect_closed_positions(self, prev: list[dict], current: list[dict]) -> list[dict]:
        """Return positions that were open before but are now closed."""
        current_ids = {p.get("id") for p in current}
        return [p for p in prev if p.get("id") not in current_ids]
