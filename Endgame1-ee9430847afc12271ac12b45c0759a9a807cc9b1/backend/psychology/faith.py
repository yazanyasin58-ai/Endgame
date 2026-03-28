from __future__ import annotations
import random
from dataclasses import dataclass

# ── Message bank ──────────────────────────────────────────────────────────────
# Each message tagged by trigger context. Claude selects the most fitting one
# given current session state — these are inputs, not random picks.

FAITH_MESSAGES: dict[str, list[str]] = {
    "stress_biometric": [
        "Allah loves those who are patient. Your rizq is written — no trade will add or remove what is already yours. Trust your system. Trust Him. Wait for the setup.",
        "Tawakkul. You've done the preparation. Now let go of the outcome. What's meant for you will not pass you.",
        "Sabr. This discomfort you feel right now — this is where your character is built. Don't let a bad trade become a bad decision.",
        "Your heart is racing because you're attached to the outcome. Detach. The plan is the plan. Execute or don't trade.",
        "There is no rizq in a revenge trade. None. Allah is Al-Razzaq. Step back, breathe, and trust that.",
    ],
    "rule_violation": [
        "Stop. Before you do anything — one breath, one intention. Is this action aligned with the person you are trying to become?",
        "Sabr. This discomfort you feel right now — this is where your character is built. Don't let a bad trade become a bad decision.",
        "Al-Fatihah was revealed as a mercy. You are not alone in this. Come back to yourself.",
        "You made a rule for a reason. That reason doesn't expire because you're down. The rule holds.",
        "Hasab Allahu wa ni'mal wakeel. Allah is enough as a guardian. You don't need to force the market.",
    ],
    "losing_streak": [
        "Three losses does not mean the strategy is broken. It means you are being tested. Every trader who made it passed this test. You pass it by doing nothing.",
        "Tawakkul. You've done the preparation. Now let go of the outcome. What's meant for you will not pass you.",
        "Allah tests those He loves. Patience is not passive — it's disciplined action. Your disciplined action right now is to stop.",
        "This is the moment that separates traders. Not the winning. Right here. In the losing streak. How you respond here is who you are.",
        "Your rizq is not in the next trade. It is written. Breathe. Come back tomorrow with a clear mind.",
    ],
    "direct_request": [
        "Allah loves those who are patient. Your rizq is written — no trade will add or remove what is already yours.",
        "Tawakkul. You've done the preparation. Now let go of the outcome.",
        "Sabr. This discomfort you feel right now — this is where your character is built.",
        "Al-Fatihah was revealed as a mercy. You are not alone in this. Come back to yourself.",
        "In Allah we trust, and in your preparation you trust. Now execute the plan, not the emotion.",
    ],
    "session_end": [
        "Alhamdulillah for today — the wins and the lessons both. Rest well. Tomorrow is a new beginning.",
        "You showed up today. That's the work. Rest, recover, and come back stronger. Allah is with the patient.",
        "Alhamdulillah. The market will be here tomorrow. Rest your body, reset your mind.",
    ],
    "pre_session": [
        "Bismillah. You've done the preparation. The intent is set. Now let the work speak.",
        "Every session is a new opportunity. Begin with intention. Execute with discipline.",
        "Bismillah. Trust the process. Trust the preparation. Trust Allah.",
    ],
}


@dataclass
class FaithMessage:
    text: str
    tone: str = "faith"
    trigger: str = ""


def get_faith_message(trigger: str, session_context: dict | None = None) -> FaithMessage:
    """
    Select the most contextually appropriate faith message for the trigger.
    `session_context` can include consecutive_losses, biometric_state, etc.
    for future Claude-based selection. For now, picks from the bank.
    """
    messages = FAITH_MESSAGES.get(trigger, FAITH_MESSAGES["direct_request"])
    text = random.choice(messages)
    return FaithMessage(text=text, tone="faith", trigger=trigger)


def get_all_messages() -> dict[str, list[str]]:
    return FAITH_MESSAGES
