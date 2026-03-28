"""
Jarvis Desktop Agent — Mac background process entry point.

Run with:
    python desktop-agent/agent.py

Or install as launchd daemon for auto-start on login.
Set JARVIS_BACKEND_URL env var to your Railway backend URL.
"""
from __future__ import annotations
import asyncio
import os
import sys

# Add desktop-agent directory to path (directory name has hyphen, can't be a package)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from screen_capture import ScreenCapture, CAPTURE_FPS
from ws_client import BackendClient, LocalWSServer
from audio import AudioIO


async def screen_capture_loop(capture: ScreenCapture, backend: BackendClient):
    interval = 1.0 / CAPTURE_FPS
    while True:
        frame = capture.get_frame()
        if frame:
            await backend.send_screenshot(
                platform=frame.platform,
                account_id=frame.account_id,
                image_b64=frame.image_b64,
            )
        await asyncio.sleep(interval)


async def main():
    print("[Jarvis Agent] Starting...")

    backend = BackendClient()
    local_ws = LocalWSServer()
    capture = ScreenCapture()

    # Wire lockout commands: backend → local WS server → Chrome extension
    async def on_lockout(data: dict):
        level = data.get("type", "UNLOCK")
        reason = data.get("reason", "")
        duration = data.get("duration_sec", 900)
        await local_ws.send_lockout(level, reason, duration)

    backend.on_lockout(on_lockout)

    # Wire mic → backend
    audio = AudioIO()

    async def send_mic_audio(pcm: bytes):
        # Send raw PCM to backend voice WebSocket
        # Note: the agent can optionally open /ws/voice for local mic
        # or rely on browser-based mic from PWA/dashboard
        pass

    audio.set_mic_callback(lambda pcm: asyncio.create_task(send_mic_audio(pcm)))
    audio.start()

    await asyncio.gather(
        local_ws.start(),
        backend.connect(),
        backend.heartbeat_loop(),
        screen_capture_loop(capture, backend),
    )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("[Jarvis Agent] Stopped.")
