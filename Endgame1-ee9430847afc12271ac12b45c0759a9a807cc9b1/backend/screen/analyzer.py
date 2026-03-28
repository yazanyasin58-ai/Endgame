from __future__ import annotations
import json
import base64

from anthropic import AsyncAnthropic

from backend.config import settings
from backend.rules.models import ScreenEvent, Violation
from backend.rules.engine import rules_engine
from backend.screen.platforms import get_prompt


class ScreenAnalyzer:
    """
    Receives screenshot frames from Desktop Agent.
    Sends to Claude Vision with platform-specific prompt.
    Returns rule violations detected on screen.
    """

    def __init__(self):
        self._anthropic = AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def analyze(self, event: ScreenEvent) -> list[Violation]:
        if not event.image_b64:
            return []

        # Use Claude Vision to extract trading screen elements
        platform_prompt = get_prompt(event.platform)
        profile = rules_engine.get_active_profile()
        profile_context = ""
        if profile:
            profile_context = (
                f"\nActive rule profile: max_contracts={profile.max_contracts}, "
                f"max_daily_loss=${profile.max_daily_loss}, "
                f"max_lot_size={profile.max_lot_size}"
            )

        try:
            response = await self._anthropic.messages.create(
                model="claude-opus-4-6",
                max_tokens=256,
                messages=[{
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": "image/png",
                                "data": event.image_b64,
                            },
                        },
                        {
                            "type": "text",
                            "text": platform_prompt + profile_context,
                        },
                    ],
                }],
            )

            raw = response.content[0].text.strip()
            # Extract JSON from response
            start = raw.find("{")
            end = raw.rfind("}") + 1
            if start == -1 or end == 0:
                return []

            detected = json.loads(raw[start:end])

            # Enrich ScreenEvent with detected values
            enriched = ScreenEvent(
                platform=event.platform,
                screenshot_b64="",  # Don't store image in event
                order_ticket_open=detected.get("order_ticket_open", False),
                detected_order_size=detected.get("detected_order_size"),
                detected_pnl=detected.get("detected_pnl"),
                position_open=detected.get("position_open", False),
            )

            # Check adding to loser
            violations = rules_engine.evaluate_screen_event(enriched)

            if detected.get("adding_to_position") and enriched.position_open:
                from backend.rules.models import Violation, ViolationType, ViolationSeverity
                violations.append(Violation(
                    type=ViolationType.ADDING_TO_LOSER,
                    severity=ViolationSeverity.SOFT_LOCK,
                    message="You're adding to an existing position. Confirm this is in the plan.",
                    tone="hard_interrupt",
                ))

            return violations

        except json.JSONDecodeError:
            return []
        except Exception as e:
            print(f"[ScreenAnalyzer] Error: {e}")
            return []


# Module-level singleton
screen_analyzer = ScreenAnalyzer()
