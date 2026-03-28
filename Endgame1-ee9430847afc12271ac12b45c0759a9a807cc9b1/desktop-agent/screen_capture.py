from __future__ import annotations
import base64
import io
import time
from dataclasses import dataclass

import mss
import mss.tools

# Platform window title keywords → account_id mapping
PLATFORM_KEYWORDS: dict[str, str] = {
    "tradovate": "tradovate_alpha",
    "tradelocker": "tradelocker_herofx",
    "herofx": "tradelocker_herofx",
    "hero fx": "tradelocker_herofx",
    "topstepx": "projectx_topstep",
    "topstep": "projectx_topstep",
    "projectx": "projectx_topstep",
    "project x": "projectx_topstep",
    "tradesea": "tradesea_lucid",
    "lucid": "tradesea_lucid",
}

# FPS when trading platform is active
CAPTURE_FPS = 2


@dataclass
class CaptureFrame:
    platform: str
    account_id: str
    image_b64: str
    timestamp: float


def get_active_window_title() -> str:
    """Returns the title of the frontmost window on macOS."""
    try:
        from AppKit import NSWorkspace
        app = NSWorkspace.sharedWorkspace().frontmostApplication()
        return app.localizedName() or ""
    except ImportError:
        # Fallback: use subprocess on macOS
        import subprocess
        result = subprocess.run(
            ["osascript", "-e",
             'tell application "System Events" to get name of first process whose frontmost is true'],
            capture_output=True, text=True, timeout=2
        )
        return result.stdout.strip()
    except Exception:
        return ""


def detect_trading_platform(window_title: str) -> tuple[str, str] | None:
    """Returns (platform_name, account_id) or None if not a trading platform."""
    title_lower = window_title.lower()
    for keyword, account_id in PLATFORM_KEYWORDS.items():
        if keyword in title_lower:
            return keyword, account_id
    return None


class ScreenCapture:
    def __init__(self):
        self._sct = mss.mss()
        self._last_platform: str | None = None

    def capture_active_window(self) -> bytes | None:
        """Capture the primary monitor as PNG bytes."""
        try:
            monitor = self._sct.monitors[1]  # Primary monitor
            screenshot = self._sct.grab(monitor)
            buf = io.BytesIO()
            mss.tools.to_png(screenshot.rgb, screenshot.size, output=buf)
            return buf.getvalue()
        except Exception as e:
            print(f"[Screen] Capture failed: {e}")
            return None

    def get_frame(self) -> CaptureFrame | None:
        """Get a frame if a trading platform is currently active."""
        title = get_active_window_title()
        result = detect_trading_platform(title)
        if not result:
            return None

        platform, account_id = result
        img_bytes = self.capture_active_window()
        if not img_bytes:
            return None

        return CaptureFrame(
            platform=platform,
            account_id=account_id,
            image_b64=base64.b64encode(img_bytes).decode(),
            timestamp=time.time(),
        )

    def close(self):
        self._sct.close()
