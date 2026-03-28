from __future__ import annotations
from datetime import datetime
from notion_client import AsyncClient
from backend.config import settings

DATABASE_TITLE = "JARVIS Trading Journal"


class NotionJournal:
    def __init__(self):
        self._client = AsyncClient(auth=settings.notion_token)
        self._db_id: str = settings.notion_database_id

    async def setup_database(self, parent_page_id: str) -> str:
        """
        Create the JARVIS Trading Journal database in Notion.
        Call once during onboarding. Returns database_id to store in .env.
        """
        db = await self._client.databases.create(
            parent={"type": "page_id", "page_id": parent_page_id},
            title=[{"type": "text", "text": {"content": DATABASE_TITLE}}],
            properties={
                "Trade ID": {"title": {}},
                "Date": {"date": {}},
                "Instrument": {"select": {"options": []}},
                "Direction": {"select": {"options": [
                    {"name": "Long", "color": "green"},
                    {"name": "Short", "color": "red"},
                ]}},
                "Entry Price": {"number": {"format": "number"}},
                "Exit Price": {"number": {"format": "number"}},
                "Size / Lots": {"number": {"format": "number"}},
                "P&L": {"number": {"format": "dollar"}},
                "Account": {"select": {"options": [
                    {"name": "Alpha Futures (Tradovate)", "color": "blue"},
                    {"name": "Hero FX (TradeLocker)", "color": "orange"},
                    {"name": "Topstep (Project X)", "color": "purple"},
                    {"name": "Lucid (Tradesea)", "color": "pink"},
                ]}},
                "Platform": {"select": {"options": []}},
                "Recovery Score": {"number": {"format": "percent"}},
                "HR at Open": {"number": {"format": "number"}},
                "HRV at Open": {"number": {"format": "number"}},
                "Biometric State": {"select": {"options": [
                    {"name": "GREEN", "color": "green"},
                    {"name": "AMBER", "color": "yellow"},
                    {"name": "RED", "color": "red"},
                ]}},
                "Rule Adherence": {"select": {"options": [
                    {"name": "Followed", "color": "green"},
                    {"name": "Deviated", "color": "yellow"},
                    {"name": "Override", "color": "red"},
                ]}},
                "Emotional State": {"rich_text": {}},
                "Thesis": {"rich_text": {}},
                "Post-Trade Reflection": {"rich_text": {}},
                "Jarvis Interventions": {"rich_text": {}},
                "Override Count": {"number": {"format": "number"}},
            },
        )
        self._db_id = db["id"]
        print(f"[Notion] Database created: {self._db_id}")
        print(f"[Notion] Add NOTION_DATABASE_ID={self._db_id} to your .env")
        return self._db_id

    async def create_trade_entry(self, entry: dict) -> str:
        """Create a new page (trade entry) in the journal database. Returns page_id."""
        properties = self._build_properties(entry)
        page = await self._client.pages.create(
            parent={"database_id": self._db_id},
            properties=properties,
        )
        return page["id"]

    async def update_trade_entry(self, page_id: str, entry: dict):
        """Update an existing trade entry with new fields (e.g. reflection after debrief)."""
        properties = self._build_properties(entry)
        await self._client.pages.update(page_id=page_id, properties=properties)

    async def get_recent_entries(self, limit: int = 20) -> list[dict]:
        response = await self._client.databases.query(
            database_id=self._db_id,
            sorts=[{"property": "Date", "direction": "descending"}],
            page_size=limit,
        )
        return response.get("results", [])

    async def get_entries_since(self, since: datetime) -> list[dict]:
        response = await self._client.databases.query(
            database_id=self._db_id,
            filter={
                "property": "Date",
                "date": {"on_or_after": since.isoformat()},
            },
            sorts=[{"property": "Date", "direction": "ascending"}],
        )
        return response.get("results", [])

    def _build_properties(self, entry: dict) -> dict:
        props = {}

        if "trade_id" in entry:
            props["Trade ID"] = {"title": [{"text": {"content": str(entry["trade_id"])}}]}
        if "date" in entry:
            props["Date"] = {"date": {"start": entry["date"]}}
        if "instrument" in entry:
            props["Instrument"] = {"select": {"name": entry["instrument"]}}
        if "direction" in entry:
            props["Direction"] = {"select": {"name": entry["direction"].capitalize()}}
        if "entry_price" in entry:
            props["Entry Price"] = {"number": float(entry["entry_price"])}
        if "exit_price" in entry:
            props["Exit Price"] = {"number": float(entry["exit_price"])}
        if "size" in entry:
            props["Size / Lots"] = {"number": float(entry["size"])}
        if "pnl" in entry:
            props["P&L"] = {"number": float(entry["pnl"])}
        if "account_display" in entry:
            props["Account"] = {"select": {"name": entry["account_display"]}}
        if "platform" in entry:
            props["Platform"] = {"select": {"name": entry["platform"]}}
        if "recovery_score" in entry and entry["recovery_score"] is not None:
            props["Recovery Score"] = {"number": entry["recovery_score"] / 100}
        if "hr_at_open" in entry and entry["hr_at_open"] is not None:
            props["HR at Open"] = {"number": int(entry["hr_at_open"])}
        if "hrv_at_open" in entry and entry["hrv_at_open"] is not None:
            props["HRV at Open"] = {"number": float(entry["hrv_at_open"])}
        if "biometric_state" in entry:
            props["Biometric State"] = {"select": {"name": entry["biometric_state"]}}
        if "rule_adherence" in entry:
            props["Rule Adherence"] = {"select": {"name": entry["rule_adherence"]}}
        for text_field in ("emotional_state", "thesis", "post_trade_reflection", "jarvis_interventions"):
            notion_key = text_field.replace("_", " ").title()
            if text_field in entry and entry[text_field]:
                props[notion_key] = {"rich_text": [{"text": {"content": str(entry[text_field])[:2000]}}]}
        if "override_count" in entry:
            props["Override Count"] = {"number": int(entry["override_count"])}

        return props


# Module-level singleton
notion_journal = NotionJournal()
