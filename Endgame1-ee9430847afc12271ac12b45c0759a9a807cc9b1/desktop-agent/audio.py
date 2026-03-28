from __future__ import annotations
import asyncio
import queue
import threading
from typing import Callable

import sounddevice as sd
import numpy as np

SAMPLE_RATE = 16000
CHANNELS = 1
DTYPE = "int16"
CHUNK_SIZE = 1024  # ~64ms at 16kHz


class AudioIO:
    """
    Handles local microphone capture and speaker playback on Mac.
    Mic audio is forwarded to a callback (→ backend WebSocket).
    Speaker receives audio chunks from backend TTS output.
    """

    def __init__(self, mic_callback: Callable[[bytes], None] = None):
        self._mic_callback = mic_callback
        self._play_queue: queue.Queue = queue.Queue()
        self._mic_stream = None
        self._play_stream = None
        self._running = False

    def set_mic_callback(self, callback: Callable[[bytes], None]):
        self._mic_callback = callback

    def start(self):
        self._running = True
        self._start_mic()
        self._start_speaker()

    def stop(self):
        self._running = False
        if self._mic_stream:
            self._mic_stream.stop()
            self._mic_stream.close()
        if self._play_stream:
            self._play_stream.stop()
            self._play_stream.close()

    def enqueue_audio(self, mp3_bytes: bytes):
        """
        Receive MP3 bytes from backend TTS and queue for playback.
        Decodes MP3 → PCM using pydub before enqueuing.
        """
        try:
            from pydub import AudioSegment
            seg = AudioSegment.from_mp3(__import__("io").BytesIO(mp3_bytes))
            seg = seg.set_frame_rate(SAMPLE_RATE).set_channels(CHANNELS).set_sample_width(2)
            raw = np.frombuffer(seg.raw_data, dtype=np.int16)
            self._play_queue.put(raw)
        except Exception as e:
            print(f"[Audio] Playback enqueue error: {e}")

    def _start_mic(self):
        def callback(indata, frames, time_info, status):
            if self._mic_callback and self._running:
                self._mic_callback(indata.tobytes())

        self._mic_stream = sd.InputStream(
            samplerate=SAMPLE_RATE,
            channels=CHANNELS,
            dtype=DTYPE,
            blocksize=CHUNK_SIZE,
            callback=callback,
        )
        self._mic_stream.start()

    def _start_speaker(self):
        accumulated = np.array([], dtype=np.int16)

        def callback(outdata, frames, time_info, status):
            nonlocal accumulated
            needed = frames

            while len(accumulated) < needed:
                try:
                    chunk = self._play_queue.get_nowait()
                    accumulated = np.concatenate([accumulated, chunk])
                except queue.Empty:
                    break

            if len(accumulated) >= needed:
                outdata[:, 0] = accumulated[:needed]
                accumulated = accumulated[needed:]
            else:
                outdata[:len(accumulated), 0] = accumulated
                outdata[len(accumulated):, 0] = 0
                accumulated = np.array([], dtype=np.int16)

        self._play_stream = sd.OutputStream(
            samplerate=SAMPLE_RATE,
            channels=CHANNELS,
            dtype=DTYPE,
            blocksize=CHUNK_SIZE,
            callback=callback,
        )
        self._play_stream.start()
