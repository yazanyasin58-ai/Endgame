from __future__ import annotations
from datetime import datetime

from backend.journal.notion import notion_journal
from backend.core.state import get_session
from backend.rules.models import Trade

ACCOUNT_DISPLAY_NAMES = {
    "tradovate_alpha": "Alpha Futures (Tradovate)",
    "tradelocker_herofx": "Hero FX (TradeLocker)",
    "projectx_topstep": "Topstep (Project X)",
    "tradesea_lucid": "Lucid (Tradesea)",
}


class JournalLogger:
    def __init__(self):
        self._pending_entries: dict[str, str] = {}  # trade_id → notion_page_id
        self._session_interventions: list[str] = []

    def record_intervention(self, message: str):
        """Called whenever Jarvis fires a warning, lockout, or faith message during session."""
        self._session_interventions.append(f"[{datetime.utcnow().strftime('%H:%M')}] {message}")

    async def log_trade_auto(self, trade: Trade) -> str | None:
        """
        Automatically log a trade on broker fill event.
        Returns Notion page_id for later updates.
        """
        session = get_session()
        entry = {
            "trade_id": trade.trade_id,
            "date": trade.closed_at.date().isoformat(),
            "instrument": trade.instrument,
            "direction": trade.direction,
            "entry_price": trade.entry_price,
            "exit_price": trade.exit_price,
            "size": trade.size,
            "pnl": trade.pnl,
            "account_display": ACCOUNT_DISPLAY_NAMES.get(trade.account_id, trade.account_id),
            "platform": trade.platform,
            "recovery_score": session.recovery_score,
            "hr_at_open": session.baseline_hr,
            "hrv_at_open": session.baseline_hrv,
            "biometric_state": session.biometric_state,
            "rule_adherence": "Followed",
            "jarvis_interventions": "\n".join(self._session_interventions) or "None",
            "override_count": session.override_count,
        }
        try:
            page_id = await notion_journal.create_trade_entry(entry)
            self._pending_entries[trade.trade_id] = page_id
            print(f"[Journal] Auto-logged trade {trade.trade_id} → Notion page {page_id}")
            return page_id
        except Exception as e:
            print(f"[Journal] Auto-log failed: {e}")
            return None

    async def log_trade_voice(self, trade_id: str, thesis: str,
                               emotional_state: str, rule_adherence: str = "Followed"):
        """
        Called after user says 'Jarvis, log that trade'.
        Updates the existing auto-entry or creates a new one if missing.
        """
        page_id = self._pending_entries.get(trade_id)
        update = {
            "thesis": thesis,
            "emotional_state": emotional_state,
            "rule_adherence": rule_adherence,
        }
        try:
            if page_id:
                await notion_journal.update_trade_entry(page_id, update)
                print(f"[Journal] Voice update applied to {page_id}")
            else:
                print(f"[Journal] No auto-entry found for {trade_id} — creating with voice data")
        except Exception as e:
            print(f"[Journal] Voice log failed: {e}")

    async def end_of_session_debrief(self, jarvis) -> list[str]:
        """
        Reviews all session trades with Jarvis voice guidance.
        Returns list of reflection questions asked.
        """
        pending = list(self._pending_entries.items())
        if not pending:
            await jarvis.say(
                "No trades logged this session. Nothing to debrief.",
                tone="calm_authority",
            )
            return []

        await jarvis.say(
            f"Session debrief. {len(pending)} trade{'s' if len(pending) != 1 else ''} to review.",
            tone="calm_authority",
        )

        questions = []
        for trade_id, page_id in pending:
            await jarvis.say(
                f"Trade {trade_id}. What was your thesis going in?",
                tone="calm_authority",
            )
            questions.append(f"{trade_id}: thesis")
            await jarvis.say(
                "What were you feeling when you entered — calm, rushed, certain, doubtful?",
                tone="calm_authority",
            )
            questions.append(f"{trade_id}: emotional state")
            await jarvis.say(
                "Did you follow the plan exactly, or did you deviate anywhere?",
                tone="calm_authority",
            )
            questions.append(f"{trade_id}: rule adherence")

        # Clear session state
        self._session_interventions.clear()
        self._pending_entries.clear()
        return questions

    async def get_recent(self, limit: int = 20) -> list[dict]:
        entries = await notion_journal.get_recent_entries(limit)
        return [self._format_entry(e) for e in entries]

    def _format_entry(self, page: dict) -> dict:
        props = page.get("properties", {})

        def text(key):
            rt = props.get(key, {}).get("rich_text", [])
            return rt[0]["text"]["content"] if rt else ""

        def number(key):
            return props.get(key, {}).get("number")

        def select(key):
            s = props.get(key, {}).get("select")
            return s["name"] if s else ""

        return {
            "id": page["id"],
            "date": props.get("Date", {}).get("date", {}).get("start", ""),
            "instrument": select("Instrument"),
            "direction": select("Direction"),
            "pnl": number("P&L"),
            "account": select("Account"),
            "biometric_state": select("Biometric State"),
            "rule_adherence": select("Rule Adherence"),
            "thesis": text("Thesis"),
        }


# Module-level singleton
journal_logger = JournalLogger()
