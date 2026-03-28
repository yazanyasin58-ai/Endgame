from __future__ import annotations
from datetime import datetime, timedelta

from anthropic import AsyncAnthropic

from backend.journal.notion import notion_journal
from backend.config import settings

REVIEW_PROMPT = """You are JARVIS analysing YAZDAQ's trading week. Be direct, specific, and unfiltered.

Trading journal data for the past 7 days:
{journal_data}

Provide a structured weekly review covering:

1. **Performance Summary** — Total P&L, win rate, trades by account
2. **Biometric Correlation** — Any pattern between recovery/HRV state and trade outcomes
3. **Rule Adherence** — Most common deviations, override count, locked-out sessions
4. **Patterns YAZDAQ Likely Doesn't See** — Identify non-obvious patterns in the data
5. **Top 3 Actionable Changes** — Specific, concrete, no fluff

Be direct. Don't soften anything. If the week was bad, say why specifically.
Address YAZDAQ directly throughout."""


class WeeklyReview:
    def __init__(self):
        self._anthropic = AsyncAnthropic(api_key=settings.anthropic_api_key)

    async def generate(self) -> str:
        """
        Fetch last 7 days of trades from Notion, send to Claude, return review text.
        Also creates a Notion summary page and sends Pushover notification.
        """
        since = datetime.utcnow() - timedelta(days=7)
        entries = await notion_journal.get_entries_since(since)

        if not entries:
            return "No trades in the past 7 days. Nothing to review."

        journal_data = self._format_journal_data(entries)
        prompt = REVIEW_PROMPT.format(journal_data=journal_data)

        full_review = ""
        async with self._anthropic.messages.stream(
            model="claude-opus-4-6",
            max_tokens=1500,
            messages=[{"role": "user", "content": prompt}],
        ) as stream:
            async for chunk in stream.text_stream:
                full_review += chunk

        # Post review to Notion as a new page
        await self._post_to_notion(full_review, since)

        # Push notification
        await self._push_notification(len(entries))

        return full_review

    def _format_journal_data(self, entries: list[dict]) -> str:
        lines = []
        for page in entries:
            props = page.get("properties", {})

            def num(key):
                return props.get(key, {}).get("number", 0) or 0

            def sel(key):
                s = props.get(key, {}).get("select")
                return s["name"] if s else "?"

            def txt(key):
                rt = props.get(key, {}).get("rich_text", [])
                return rt[0]["text"]["content"] if rt else ""

            date = props.get("Date", {}).get("date", {}).get("start", "?")
            lines.append(
                f"Date: {date} | Instrument: {sel('Instrument')} | "
                f"Direction: {sel('Direction')} | P&L: ${num('P&L'):.2f} | "
                f"Account: {sel('Account')} | "
                f"Recovery: {int((num('Recovery Score') or 0) * 100)}% | "
                f"Biometric: {sel('Biometric State')} | "
                f"Rule Adherence: {sel('Rule Adherence')} | "
                f"Thesis: {txt('Thesis')[:100]}"
            )
        return "\n".join(lines)

    async def _post_to_notion(self, review_text: str, week_start: datetime):
        """Post weekly review as a rich text page in the journal database."""
        try:
            entry = {
                "trade_id": f"WEEKLY-REVIEW-{week_start.strftime('%Y-%W')}",
                "date": datetime.utcnow().date().isoformat(),
                "instrument": "REVIEW",
                "post_trade_reflection": review_text[:2000],
            }
            await notion_journal.create_trade_entry(entry)
        except Exception as e:
            print(f"[WeeklyReview] Notion post failed: {e}")

    async def _push_notification(self, trade_count: int):
        import httpx
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                await client.post(
                    "https://api.pushover.net/1/messages.json",
                    data={
                        "token": settings.pushover_app_token,
                        "user": settings.pushover_user_key,
                        "title": "Jarvis — Weekly Review Ready",
                        "message": f"Your weekly trading review is ready. {trade_count} trades analysed.",
                        "priority": 0,
                    },
                )
        except Exception as e:
            print(f"[WeeklyReview] Push notification failed: {e}")


# Module-level singleton
weekly_review = WeeklyReview()
