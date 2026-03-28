from __future__ import annotations
# Screen watcher receives frames from Desktop Agent via /ws/agent WebSocket.
# All processing happens in backend/api/ws.py → jarvis.process_screen_event()
# This module is kept for any future server-side screen processing logic.

from backend.screen.analyzer import screen_analyzer
from backend.rules.models import ScreenEvent


async def process_frame(frame_data: dict) -> list:
    """Process a raw frame dict received from the Desktop Agent."""
    event = ScreenEvent(
        platform=frame_data.get("platform", "default"),
        screenshot_b64=frame_data.get("image_b64", ""),
        timestamp=None,
    )
    return await screen_analyzer.analyze(event)
