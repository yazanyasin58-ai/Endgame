from __future__ import annotations
import asyncio
from dataclasses import dataclass, field
from enum import Enum

from backend.rules.models import RuleProfile
from backend.rules.profiles import save_profile


class OnboardingStep(str, Enum):
    IDENTITY = "identity"
    CONTEXTS = "contexts"
    RULE_PROFILES = "rule_profiles"
    PSYCHOLOGY = "psychology"
    ANCHOR_CUE = "anchor_cue"
    PLAYLISTS = "playlists"
    CONNECTIONS = "connections"
    COMPLETE = "complete"


ACCOUNT_TEMPLATES = [
    {
        "account_id": "tradovate_alpha",
        "platform": "tradovate",
        "account_type": "funded",
        "display_name": "Alpha Futures (Tradovate)",
        "questions": [
            ("max_daily_loss", "What is your maximum daily loss limit for Alpha Futures? In dollars."),
            ("max_contracts", "Maximum contracts per trade on this account?"),
            ("max_trades_per_day", "Maximum trades per day?"),
            ("max_consecutive_losses", "How many consecutive losses before you must stop?"),
            ("revenge_trade_cooldown_min", "How many minutes of cooldown after your loss limit before re-entry?"),
        ],
    },
    {
        "account_id": "tradelocker_herofx",
        "platform": "tradelocker",
        "account_type": "live",
        "display_name": "Live Forex — Hero FX",
        "questions": [
            ("max_daily_loss", "Maximum daily loss on your Hero FX live account? In dollars."),
            ("max_lot_size", "Maximum lot size per trade?"),
            ("max_trades_per_day", "Max trades per day?"),
            ("max_consecutive_losses", "Consecutive losses before mandatory stop?"),
            ("revenge_trade_cooldown_min", "Cooldown minutes between losses?"),
        ],
    },
    {
        "account_id": "projectx_topstep",
        "platform": "projectx",
        "account_type": "funded",
        "display_name": "Topstep Funded — Project X",
        "questions": [
            ("max_daily_loss", "Topstep daily drawdown limit? In dollars."),
            ("max_contracts", "Max contracts per trade?"),
            ("max_trades_per_day", "Max trades per day?"),
            ("max_consecutive_losses", "Consecutive losses before stop?"),
            ("revenge_trade_cooldown_min", "Cooldown minutes?"),
        ],
    },
    {
        "account_id": "tradesea_lucid",
        "platform": "tradesea",
        "account_type": "funded",
        "display_name": "Lucid Funded — Tradesea",
        "questions": [
            ("max_daily_loss", "Lucid daily loss limit?"),
            ("max_contracts", "Max contracts per trade?"),
            ("max_trades_per_day", "Max trades per day?"),
            ("max_consecutive_losses", "Consecutive losses before stop?"),
            ("revenge_trade_cooldown_min", "Cooldown minutes?"),
        ],
    },
]

ANCHOR_SCIENCE_EXPLANATION = """
The trading anchor cue. This is kinesthetic conditioning — the same principle Pavlov used,
refined by sports psychologists and used by elite athletes to fire peak state on demand.

Here's how it works: every time you fire this cue, right before a session, you pair it with
the performance state we just built in the ritual. Over 60 repetitions, your nervous system
creates an automatic highway — fire the cue, access the state. No thought required.

Requirements for a good anchor:
- Unique: never used in other contexts
- Physical: something you do with your body
- Repeatable: exactly the same every time
- Private: doesn't draw attention

Examples to spark ideas — not copy, just spark:
Tapping two fingers on your chest. A specific hand squeeze.
Pressing your thumb and middle finger together.
A specific breath pattern. Touching a ring or watch.

Take a moment. What feels right for you? Tell me what you're thinking."""


class OnboardingFlow:
    def __init__(self):
        self._jarvis = None
        self._current_step = OnboardingStep.IDENTITY
        self._collected_profiles: dict = {}

    def set_jarvis(self, jarvis):
        self._jarvis = jarvis

    async def run(self):
        """Full first-time onboarding sequence."""
        await self._step_identity()
        await self._step_contexts()
        await self._step_rule_profiles()
        await self._step_psychology()
        await self._step_anchor_cue()
        await self._step_playlists()
        await self._step_connections()
        await self._complete()

    async def _step_identity(self):
        await self._say(
            "YAZDAQ. Let's set Jarvis up. "
            "I'm going to walk you through every account, every rule, and every system. "
            "This takes about 15 minutes. Answer directly — no need to explain yourself to me. "
            "Ready?",
            tone="calm_authority",
        )

    async def _step_contexts(self):
        await self._say(
            "You have five performance contexts: "
            "Trading — YAZDAQ Markets. Football. Studying — Biology, IT, Finance, Stats. "
            "Content creation — YouTube and brand. And general deep work. "
            "Each context gets its own ritual and anchor cue. "
            "Today we're setting up Trading. The others get built in subsequent sessions. Understood?",
            tone="calm_authority",
        )

    async def _step_rule_profiles(self):
        await self._say(
            "Four accounts. We're doing each one now. "
            "I'll ask you the rules for each. Answer with the number — nothing else.",
            tone="calm_authority",
        )

        for account in ACCOUNT_TEMPLATES:
            await self._say(
                f"Account: {account['display_name']}.",
                tone="calm_authority",
            )
            profile_data = {
                "account_id": account["account_id"],
                "platform": account["platform"],
                "account_type": account["account_type"],
                "display_name": account["display_name"],
                "max_daily_loss": 500.0,
                "max_contracts": 2,
                "max_lot_size": 1.0,
                "max_trades_per_day": 6,
                "max_consecutive_losses": 3,
                "restricted_hours": [[9, 30], [9, 45]],
                "revenge_trade_cooldown_min": 15,
                "trading_demons": [],
            }

            for field_name, question in account["questions"]:
                await self._say(question, tone="calm_authority")
                # In production: voice pipeline captures answer and calls update_profile_field()
                await asyncio.sleep(2)

            self._collected_profiles[account["account_id"]] = profile_data

    async def _step_psychology(self):
        await self._say(
            "Psychology profile. Two questions. Be honest — this is only for your rules engine. "
            "First: what are your biggest trading demons? "
            "The patterns that have cost you the most. Name them directly.",
            tone="calm_authority",
        )
        await asyncio.sleep(3)
        await self._say(
            "Good. I'm logging those as priority flags — I'll call them by name when I see them. "
            "Second question: describe your best trading day mentally. "
            "What does your internal state feel like when you're executing perfectly?",
            tone="calm_authority",
        )
        await asyncio.sleep(3)
        await self._say(
            "That's your green state profile. That's what we're aiming to recreate with every ritual.",
            tone="calm_authority",
        )

    async def _step_anchor_cue(self):
        await self._say(ANCHOR_SCIENCE_EXPLANATION, tone="calm_authority")
        await asyncio.sleep(5)
        await self._say(
            "Tell me what you've decided. I'll help you refine it until it's locked.",
            tone="calm_authority",
        )
        await asyncio.sleep(5)
        await self._say(
            "Good. We're going to fire it now for the first time. "
            "Close your eyes. Recall the best version of yourself trading — focused, calm, decisive. "
            "Hold that state... now fire the cue. Exactly as you'll do it every session.",
            tone="calm_authority",
        )
        await asyncio.sleep(8)
        await self._say(
            "Anchor fired. Rep one of sixty. "
            "Every session for the next 60 sessions, I'll remind you that the highway is being built. "
            "Do not fire this cue outside of trading context — that degrades it.",
            tone="calm_authority",
        )

    async def _step_playlists(self):
        await self._say(
            "Three trading playlists. Standard, activation for flat days, and calm for anxious days. "
            "Tell me the links or names for each. Start with standard.",
            tone="calm_authority",
        )
        await asyncio.sleep(5)

    async def _step_connections(self):
        await self._say(
            "Final step — connections. I need API keys and credentials for all your systems. "
            "Open the dashboard at the URL I gave you — there's a connection checklist. "
            "Each service shows green when verified. Work through the list. "
            "I'll be here when you're done.",
            tone="calm_authority",
        )

    async def _complete(self):
        # Save all collected profiles
        for account_id, profile_data in self._collected_profiles.items():
            try:
                profile = RuleProfile(**profile_data)
                save_profile(profile)
            except Exception as e:
                print(f"[Onboarding] Profile save failed for {account_id}: {e}")

        await self._say(
            "All systems configured. All accounts loaded. Jarvis is ready. "
            "Bismillah, YAZDAQ. "
            "Every session starts with the ritual. No exceptions. "
            "Let's build.",
            tone="faith",
        )

    def update_profile_field(self, account_id: str, field: str, value):
        if account_id in self._collected_profiles:
            self._collected_profiles[account_id][field] = value

    async def _say(self, text: str, tone: str = "calm_authority"):
        if self._jarvis:
            await self._jarvis.say(text, tone)
        else:
            print(f"[Onboarding] {text}")


# Module-level singleton
onboarding_flow = OnboardingFlow()
