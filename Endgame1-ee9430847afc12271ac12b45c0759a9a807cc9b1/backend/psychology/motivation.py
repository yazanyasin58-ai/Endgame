from __future__ import annotations
import json
import random
from dataclasses import dataclass
from pathlib import Path

# ── Core message bank (from design spec + extensions) ─────────────────────────

CORE_MESSAGES: list[str] = [
    "Things will never change until you change. Period. Full stop.",
    "If you don't control your mind, your mind will control you — and right now it's winning. Lock in.",
    "You didn't come this far to cheat yourself. Do it right the first time or don't do it at all.",
    "You're a grown man. Stop letting fear make your decisions. You've done the work. Execute.",
    "Every trader who ever made it had the same doubts you have right now. The difference is they pushed through anyway.",
    "Hesitation is just fear wearing a disguise. You've done the analysis. You know the setup. Send it.",
    "The setup is valid. Your rules say enter. Your only job right now is to execute. Do it.",
    "Discipline is the bridge between goals and accomplishment. Cross it.",
    "Stop waiting for perfect. Perfect doesn't exist in trading. Execute the plan.",
    "Your future self is watching you right now. What decision are you making for him?",
    "Comfort zones don't produce funded traders. Get uncomfortable. Move.",
    "Consistent execution beats emotional genius every single time. Be consistent.",
    "You trained for this. Every screen hour, every journal entry, every loss you learned from — it was for this moment.",
]

# Quote bank file path (user adds personal quotes via onboarding/settings)
QUOTE_BANK_PATH = Path(__file__).parent.parent.parent / "data" / "quote_bank.json"


def load_quote_bank() -> list[str]:
    if QUOTE_BANK_PATH.exists():
        with open(QUOTE_BANK_PATH) as f:
            return json.load(f)
    return []


def save_quote_bank(quotes: list[str]):
    QUOTE_BANK_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(QUOTE_BANK_PATH, "w") as f:
        json.dump(quotes, f, indent=2)


def add_quote(quote: str):
    bank = load_quote_bank()
    bank.append(quote)
    save_quote_bank(bank)


@dataclass
class MotivationMessage:
    text: str
    tone: str = "motivation"
    trigger: str = ""


def get_motivation_message(trigger: str = "direct_request") -> MotivationMessage:
    """
    Pull from combined core + personal quote bank.
    Prioritises personal quotes when available (user has invested in them).
    """
    personal = load_quote_bank()
    pool = personal + CORE_MESSAGES if personal else CORE_MESSAGES
    text = random.choice(pool)
    return MotivationMessage(text=text, tone="motivation", trigger=trigger)


def get_hesitation_message() -> MotivationMessage:
    hesitation_specific = [
        "The setup is valid. Your rules say enter. Your only job right now is to execute. Do it.",
        "You've done the analysis. You know the setup. Hesitation is fear wearing a disguise. Send it.",
        "You've been watching this for 20 minutes. The setup hasn't changed. You know it's there. Now go.",
        "Every second you wait for certainty is a second you're not executing your edge. Take the trade.",
    ]
    return MotivationMessage(
        text=random.choice(hesitation_specific),
        tone="motivation",
        trigger="hesitation",
    )
