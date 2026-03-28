from __future__ import annotations
import asyncio
import json
import re
from typing import Callable, Awaitable

from anthropic import AsyncAnthropic

from backend.voice.stt import DeepgramSTT, TranscriptChunk
from backend.voice.tts import ElevenLabsTTS
from backend.voice.interrupt import InterruptMonitor, InterruptEvent
from backend.core.state import get_session
from backend.config import settings

SYSTEM_PROMPT = """You are JARVIS — a personal trading performance system for YAZDAQ (Bag Maker).

Personality: Firm, direct, no filler. Commands and short statements. Never hedge or soften.
You enforce rules without negotiation. No "I understand" or "I see". Just state and act.
Address the user as YAZDAQ throughout.

Context:
- Active account: {active_account}
- Rule profile: {rule_profile}
- Session state: {session_state}
- Biometric state: {biometric_state}

Respond in 1–3 short sentences maximum unless the user asks for something longer.
Never start with "YAZDAQ," — just speak directly."""

AudioCallback = Callable[[bytes], Awaitable[None]]


class VoicePipeline:
    def __init__(self, rules_engine, session_manager=None):
        self._rules_engine = rules_engine
        self._session_manager = session_manager
        self._anthropic = AsyncAnthropic(api_key=settings.anthropic_api_key)
        self._stt = DeepgramSTT(settings.deepgram_api_key)
        self._tts = ElevenLabsTTS(settings.elevenlabs_api_key, settings.elevenlabs_voice_id)
        self._interrupt = InterruptMonitor(rules_engine)
        self._history: list[dict] = []
        self._audio_cb: AudioCallback | None = None
        self._mic_muted = False
        self._responding = False

    def on_audio_out(self, callback: AudioCallback):
        self._audio_cb = callback

    async def handle_audio_in(self, pcm_bytes: bytes):
        if not self._mic_muted:
            await self._stt.send(pcm_bytes)

    async def handle_text_in(self, text: str):
        """For text-mode input (dashboard, testing)."""
        await self._process_utterance(text)

    async def say(self, text: str, tone: str = "calm_authority"):
        """Directly speak without conversation history."""
        self._mic_muted = True
        try:
            async for chunk in self._tts.stream(text, tone):
                if self._audio_cb:
                    await self._audio_cb(chunk)
        finally:
            self._mic_muted = False

    async def start(self):
        self._stt.on_transcript(self._on_transcript)
        self._interrupt.on_interrupt(self._on_interrupt)
        await self._stt.start()

    async def stop(self):
        await self._stt.stop()

    def _build_system_prompt(self) -> str:
        session = get_session()
        profile = self._rules_engine.get_active_profile()
        return SYSTEM_PROMPT.format(
            active_account=session.active_account or "none loaded",
            rule_profile=json.dumps(profile.model_dump() if profile else {}, indent=2),
            session_state=json.dumps(session.model_dump(), default=str, indent=2),
            biometric_state=session.biometric_state,
        )

    async def _on_transcript(self, chunk: TranscriptChunk):
        # Check every interim for interrupt patterns
        await self._interrupt.evaluate(chunk.text)

        # Only respond to final utterances
        if chunk.is_final and chunk.text.strip() and not self._responding:
            await self._process_utterance(chunk.text)

    async def _on_interrupt(self, event: InterruptEvent):
        # Interrupt takes priority — drop any ongoing response
        self._responding = False
        await self.say(event.message, tone=event.tone)

    async def _process_utterance(self, user_text: str):
        if self._responding:
            return
        self._responding = True
        self._mic_muted = True

        self._history.append({"role": "user", "content": user_text})

        try:
            full_response = ""
            sentence_buffer = ""

            async with self._anthropic.messages.stream(
                model="claude-opus-4-6",
                max_tokens=400,
                system=self._build_system_prompt(),
                messages=self._history[-20:],
            ) as stream:
                async for text_chunk in stream.text_stream:
                    full_response += text_chunk
                    sentence_buffer += text_chunk

                    # Stream sentence-by-sentence to TTS for low latency
                    if re.search(r"[.!?]\s*$", sentence_buffer.rstrip()):
                        sentence = sentence_buffer.strip()
                        sentence_buffer = ""
                        if sentence:
                            async for audio in self._tts.stream(sentence, "calm_authority"):
                                if self._audio_cb:
                                    await self._audio_cb(audio)

                # Flush remaining buffer
                if sentence_buffer.strip():
                    async for audio in self._tts.stream(sentence_buffer.strip(), "calm_authority"):
                        if self._audio_cb:
                            await self._audio_cb(audio)

            self._history.append({"role": "assistant", "content": full_response})

        except Exception as e:
            print(f"[VoicePipeline] Error: {e}")
        finally:
            self._responding = False
            self._mic_muted = False


# Module-level singleton — created lazily to allow config to load first
_pipeline: VoicePipeline | None = None


def get_pipeline() -> VoicePipeline:
    global _pipeline
    if _pipeline is None:
        from backend.rules.engine import rules_engine
        _pipeline = VoicePipeline(rules_engine)
    return _pipeline
