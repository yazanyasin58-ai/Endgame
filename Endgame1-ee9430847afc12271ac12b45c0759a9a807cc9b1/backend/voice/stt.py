from __future__ import annotations
import asyncio
from dataclasses import dataclass
from typing import Callable, Awaitable

from deepgram import (
    DeepgramClient,
    LiveTranscriptionEvents,
    LiveOptions,
)


@dataclass
class TranscriptChunk:
    text: str
    is_final: bool
    confidence: float = 0.0


TranscriptCallback = Callable[[TranscriptChunk], Awaitable[None]]


class DeepgramSTT:
    def __init__(self, api_key: str):
        self._client = DeepgramClient(api_key)
        self._connection = None
        self._callbacks: list[TranscriptCallback] = []

    def on_transcript(self, callback: TranscriptCallback):
        self._callbacks.append(callback)

    async def start(self):
        options = LiveOptions(
            model="nova-2",
            encoding="linear16",
            sample_rate=16000,
            channels=1,
            interim_results=True,
            utterance_end_ms="1000",
            vad_events=True,
            smart_format=True,
        )
        self._connection = self._client.listen.asyncwebsocket.v("1")
        self._connection.on(LiveTranscriptionEvents.Transcript, self._handle_transcript)
        self._connection.on(LiveTranscriptionEvents.Error, self._handle_error)
        await self._connection.start(options)

    async def send(self, audio_bytes: bytes):
        if self._connection:
            await self._connection.send(audio_bytes)

    async def stop(self):
        if self._connection:
            await self._connection.finish()
            self._connection = None

    async def _handle_transcript(self, result, **kwargs):
        try:
            alt = result.channel.alternatives[0]
            text = alt.transcript
            if not text.strip():
                return
            chunk = TranscriptChunk(
                text=text,
                is_final=result.is_final,
                confidence=alt.confidence,
            )
            for cb in self._callbacks:
                asyncio.create_task(cb(chunk))
        except Exception as e:
            pass

    async def _handle_error(self, error, **kwargs):
        print(f"[Deepgram] Error: {error}")
