from __future__ import annotations
import asyncio
import json
import os
import time
from typing import Callable

import websockets
from websockets.exceptions import ConnectionClosed

BACKEND_URL = os.getenv("JARVIS_BACKEND_URL", "wss://your-app.railway.app")
LOCAL_WS_PORT = 7979  # Chrome extension connects here
RECONNECT_DELAY = 5


class BackendClient:
    """WebSocket client connecting Desktop Agent to Jarvis backend."""

    def __init__(self):
        self._ws = None
        self._connected = False
        self._lockout_callbacks: list[Callable] = []

    def on_lockout(self, callback: Callable):
        self._lockout_callbacks.append(callback)

    async def connect(self):
        while True:
            try:
                print(f"[Agent] Connecting to backend: {BACKEND_URL}/ws/agent")
                async with websockets.connect(
                    f"{BACKEND_URL}/ws/agent",
                    ping_interval=20,
                    ping_timeout=10,
                ) as ws:
                    self._ws = ws
                    self._connected = True
                    print("[Agent] Connected to backend")
                    await self._receive_loop(ws)

            except (ConnectionClosed, OSError, Exception) as e:
                self._connected = False
                self._ws = None
                print(f"[Agent] Backend connection lost: {e}. Reconnecting in {RECONNECT_DELAY}s...")
                await asyncio.sleep(RECONNECT_DELAY)

    async def _receive_loop(self, ws):
        async for message in ws:
            try:
                data = json.loads(message)
                msg_type = data.get("type")

                if msg_type in ("SOFT_LOCK", "HARD_LOCK", "UNLOCK"):
                    for cb in self._lockout_callbacks:
                        asyncio.create_task(cb(data))

                elif msg_type == "pong":
                    pass

            except Exception as e:
                print(f"[Agent] Receive error: {e}")

    async def send(self, payload: dict):
        if self._ws and self._connected:
            try:
                await self._ws.send(json.dumps(payload))
            except Exception as e:
                print(f"[Agent] Send failed: {e}")
                self._connected = False

    async def send_screenshot(self, platform: str, account_id: str, image_b64: str):
        await self.send({
            "type": "screenshot",
            "platform": platform,
            "account_id": account_id,
            "image_b64": image_b64,
            "timestamp": time.time(),
        })

    async def send_biometric(self, hr: int, hrv: float, recovery: int = None,
                             sleep_performance: int = None):
        payload = {"type": "biometric", "hr": hr, "hrv": hrv}
        if recovery is not None:
            payload["recovery"] = recovery
        if sleep_performance is not None:
            payload["sleep_performance"] = sleep_performance
        await self.send(payload)

    async def heartbeat_loop(self):
        while True:
            await asyncio.sleep(10)
            await self.send({"type": "heartbeat"})


class LocalWSServer:
    """Local WebSocket server at ws://localhost:7979 — Chrome extensions connect here."""

    def __init__(self):
        self._clients: set = set()
        self._server = None

    async def start(self):
        self._server = await websockets.serve(
            self._handler, "127.0.0.1", LOCAL_WS_PORT
        )
        print(f"[Agent] Local WS server on ws://127.0.0.1:{LOCAL_WS_PORT}")

    async def _handler(self, ws):
        self._clients.add(ws)
        print(f"[Agent] Chrome extension connected. Total: {len(self._clients)}")
        try:
            async for message in ws:
                data = json.loads(message)
                print(f"[Agent] Extension msg: {data}")
        except ConnectionClosed:
            pass
        finally:
            self._clients.discard(ws)

    async def broadcast(self, payload: dict):
        if not self._clients:
            return
        message = json.dumps(payload)
        dead = set()
        for client in self._clients:
            try:
                await client.send(message)
            except Exception:
                dead.add(client)
        self._clients -= dead

    async def send_lockout(self, level: str, reason: str = "", duration_sec: int = 900):
        await self.broadcast({
            "type": level,  # SOFT_LOCK | HARD_LOCK | UNLOCK
            "reason": reason,
            "duration_sec": duration_sec,
        })
