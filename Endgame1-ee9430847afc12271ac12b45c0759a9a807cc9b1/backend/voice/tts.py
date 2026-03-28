from __future__ import annotations
from typing import AsyncIterator
import httpx

# ElevenLabs voice_settings per tone preset (from design spec)
TONE_PRESETS: dict[str, dict] = {
    "calm_authority": {
        "stability": 0.75,
        "similarity_boost": 0.85,
        "style": 0.2,
        "use_speaker_boost": True,
        "speed": 1.0,
    },
    "hard_interrupt": {
        "stability": 0.55,
        "similarity_boost": 0.90,
        "style": 0.7,
        "use_speaker_boost": True,
        "speed": 1.15,
    },
    "faith": {
        "stability": 0.90,
        "similarity_boost": 0.80,
        "style": 0.1,
        "use_speaker_boost": False,
        "speed": 0.85,
    },
    "motivation": {
        "stability": 0.50,
        "similarity_boost": 0.88,
        "style": 0.9,
        "use_speaker_boost": True,
        "speed": 1.2,
    },
}


class ElevenLabsTTS:
    def __init__(self, api_key: str, voice_id: str):
        self._api_key = api_key
        self._voice_id = voice_id
        self._base = "https://api.elevenlabs.io/v1"

    async def stream(self, text: str, tone: str = "calm_authority") -> AsyncIterator[bytes]:
        if not text.strip():
            return

        settings = TONE_PRESETS.get(tone, TONE_PRESETS["calm_authority"]).copy()
        speed = settings.pop("speed", 1.0)

        url = f"{self._base}/text-to-speech/{self._voice_id}/stream"
        headers = {
            "xi-api-key": self._api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }
        payload = {
            "text": text,
            "model_id": "eleven_turbo_v2_5",
            "voice_settings": settings,
            "output_format": "mp3_44100_128",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream("POST", url, headers=headers, json=payload) as resp:
                resp.raise_for_status()
                async for chunk in resp.aiter_bytes(chunk_size=4096):
                    yield chunk

    async def speak(self, text: str, tone: str = "calm_authority") -> bytes:
        """Return complete audio as bytes (for short responses)."""
        chunks = []
        async for chunk in self.stream(text, tone):
            chunks.append(chunk)
        return b"".join(chunks)
