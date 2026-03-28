from __future__ import annotations
import re
import asyncio
from dataclasses import dataclass
from typing import Callable, Awaitable


# Patterns that trigger an immediate interrupt regardless of rule profile
HARD_INTERRUPT_PATTERNS = [
    (r"\ball\s*in\b", "That's all-in. That's not a trade, that's a coin flip. Close the ticket."),
    (r"\bdouble\s*down\b", "Doubling down on a loser is not a strategy. Step back."),
    (r"\bgive\s*it\s*back\b", "You're trying to give P&L back. Revenge trade. Stop now."),
    (r"\bget\s*it\s*back\b", "Chasing a loss. This is exactly how accounts blow up. Stand down."),
    (r"\bmake\s*it\s*back\b", "You can't make it back in one trade. You know this. Stand down."),
    (r"\bjust\s+one\s+more\b", "That's what they all say. You've hit your limit. Session is over."),
    (r"\bsize\s*up\b", "You're sizing up after a loss. That's the playbook for a blown account."),
    (r"\bmax\s*out\b", "Maxing out position. That's not in the plan. Reduce it."),
    (r"\bi\s+don'?t\s+care\b", "When you stop caring about risk, risk doesn't stop caring about you."),
    (r"\bfuck\s+it\b", "No. You know what that energy leads to. Close everything and breathe."),
]


@dataclass
class InterruptEvent:
    trigger: str
    message: str
    transcript_text: str
    tone: str = "hard_interrupt"


InterruptCallback = Callable[[InterruptEvent], Awaitable[None]]


class InterruptMonitor:
    def __init__(self, rules_engine=None):
        self._rules_engine = rules_engine
        self._callbacks: list[InterruptCallback] = []
        self._compiled = [
            (re.compile(pattern, re.IGNORECASE), message)
            for pattern, message in HARD_INTERRUPT_PATTERNS
        ]

    def on_interrupt(self, callback: InterruptCallback):
        self._callbacks.append(callback)

    async def evaluate(self, text: str):
        if not text.strip():
            return

        # Hard pattern check first (fastest)
        for pattern, message in self._compiled:
            if pattern.search(text):
                await self._fire(InterruptEvent(
                    trigger=pattern.pattern,
                    message=message,
                    transcript_text=text,
                    tone="hard_interrupt",
                ))
                return

        # Rules engine check (slower, requires context)
        if self._rules_engine:
            violations = self._rules_engine.evaluate_voice_transcript(text)
            for v in violations:
                await self._fire(InterruptEvent(
                    trigger=v.type,
                    message=v.message,
                    transcript_text=text,
                    tone=v.tone,
                ))
                return

    async def _fire(self, event: InterruptEvent):
        for cb in self._callbacks:
            asyncio.create_task(cb(event))
