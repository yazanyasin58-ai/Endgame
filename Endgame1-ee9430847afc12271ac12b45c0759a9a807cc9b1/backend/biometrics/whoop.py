from __future__ import annotations
import time
from dataclasses import dataclass

import httpx

from backend.config import settings

TOKEN_URL = "https://api.prod.whoop.com/oauth/token"
API_BASE = "https://api.prod.whoop.com/developer/v1"


@dataclass
class WhoopRecovery:
    score: int                  # 0–100
    hrv_rmssd_milli: float      # HRV in ms
    resting_heart_rate: int
    sleep_performance_pct: int  # 0–100
    date: str


@dataclass
class WhoopCycle:
    strain: float
    kilojoules: float
    average_heart_rate: int
    max_heart_rate: int


class WhoopClient:
    """
    WHOOP API v1 client.
    Uses OAuth2 refresh token flow — no browser redirect needed at runtime.
    Initial refresh token sourced from whoop_hr_gate/tokens.json → .env.
    """

    def __init__(self):
        self._access_token: str | None = None
        self._expiry: float = 0
        self._refresh_token: str = settings.whoop_refresh_token

    async def _ensure_token(self):
        if self._access_token and time.time() < self._expiry - 60:
            return
        await self._refresh()

    async def _refresh(self):
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                TOKEN_URL,
                data={
                    "grant_type": "refresh_token",
                    "refresh_token": self._refresh_token,
                    "client_id": settings.whoop_client_id,
                    "client_secret": settings.whoop_client_secret,
                    "scope": "offline read:recovery read:cycles read:sleep read:workout read:profile",
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )
            resp.raise_for_status()
            data = resp.json()
            self._access_token = data["access_token"]
            self._refresh_token = data.get("refresh_token", self._refresh_token)
            self._expiry = time.time() + data.get("expires_in", 3600)

    def _headers(self) -> dict:
        return {"Authorization": f"Bearer {self._access_token}"}

    async def get_latest_recovery(self) -> WhoopRecovery | None:
        await self._ensure_token()
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{API_BASE}/recovery/",
                params={"limit": 1},
                headers=self._headers(),
            )
            if resp.status_code != 200:
                return None
            records = resp.json().get("records", [])
            if not records:
                return None
            r = records[0]
            score_data = r.get("score", {})
            return WhoopRecovery(
                score=score_data.get("recovery_score", 0),
                hrv_rmssd_milli=score_data.get("hrv_rmssd_milli", 0.0),
                resting_heart_rate=score_data.get("resting_heart_rate", 0),
                sleep_performance_pct=score_data.get("sleep_performance_percentage", 0),
                date=r.get("created_at", ""),
            )

    async def get_current_cycle(self) -> WhoopCycle | None:
        await self._ensure_token()
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{API_BASE}/cycle/",
                params={"limit": 1},
                headers=self._headers(),
            )
            if resp.status_code != 200:
                return None
            records = resp.json().get("records", [])
            if not records:
                return None
            c = records[0].get("score", {})
            return WhoopCycle(
                strain=c.get("strain", 0.0),
                kilojoules=c.get("kilojoule", 0.0),
                average_heart_rate=c.get("average_heart_rate", 0),
                max_heart_rate=c.get("max_heart_rate", 0),
            )


# Module-level singleton
whoop_client = WhoopClient()
