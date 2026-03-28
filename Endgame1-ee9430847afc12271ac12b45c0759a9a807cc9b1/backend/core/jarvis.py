from __future__ import annotations
import asyncio
import json

from backend.core.session import session_manager
from backend.core.state import get_session, update_session
from backend.rules.engine import rules_engine


class JarvisCore:
    """
    Master orchestrator. Wires all subsystems together.
    Single-user system — singleton pattern is correct here.
    Initialised at app startup via lifespan handler in main.py.
    """

    def __init__(self):
        self._pipeline = None
        self._lockout_manager = None
        self._unlock_protocol = None
        self._biometric_monitor = None
        self._ritual_engine = None
        self._onboarding = None
        self._journal_logger = None
        self._dashboard_connections: list = []
        self._agent_ws = None

    # ── Startup / Shutdown ─────────────────────────────────────────────────────

    async def startup(self):
        """Called at FastAPI lifespan startup. Initialises all subsystems."""
        # Session
        await session_manager.initialize()

        # Voice pipeline (lazy — created on first use to avoid import cycles)
        from backend.voice.pipeline import get_pipeline
        self._pipeline = get_pipeline()

        # Lockout
        from backend.lockout.manager import lockout_manager
        self._lockout_manager = lockout_manager

        from backend.lockout.unlock import unlock_protocol
        self._unlock_protocol = unlock_protocol
        self._unlock_protocol.set_jarvis(self)

        # Biometrics
        from backend.biometrics.monitor import biometric_monitor
        self._biometric_monitor = biometric_monitor
        self._biometric_monitor.set_jarvis(self)
        await self._biometric_monitor.start()

        # Psychology
        from backend.psychology.ritual import ritual_engine
        self._ritual_engine = ritual_engine
        self._ritual_engine.set_jarvis(self, self._biometric_monitor)

        # Onboarding
        from backend.core.onboarding import onboarding_flow
        self._onboarding = onboarding_flow
        self._onboarding.set_jarvis(self)

        # Journal
        from backend.journal.logger import journal_logger
        self._journal_logger = journal_logger

        # Register brokers with lockout manager and session manager
        await self._register_brokers()

        print("[Jarvis] Online. All systems armed. Standing by, YAZDAQ.")

    async def shutdown(self):
        if self._biometric_monitor:
            await self._biometric_monitor.stop()
        if self._pipeline:
            await self._pipeline.stop()
        print("[Jarvis] Offline.")

    async def _register_brokers(self):
        from backend.brokers.tradovate import TradovateBroker
        from backend.brokers.tradelocker import TradeLockerBroker
        from backend.brokers.projectx import ProjectXBroker
        from backend.brokers.tradesea import TradeseaBroker
        from backend.config import settings

        brokers = {
            "tradovate_alpha": TradovateBroker(use_demo=settings.tradovate_use_demo),
            "tradelocker_herofx": TradeLockerBroker(),
            "projectx_topstep": ProjectXBroker(),
            "tradesea_lucid": TradeseaBroker(),
        }

        for account_id, broker in brokers.items():
            session_manager.register_broker(account_id, broker)
            if self._lockout_manager:
                self._lockout_manager.register_broker(account_id, broker)

        # Authenticate API-backed brokers in background (non-blocking)
        async def auth_brokers():
            for account_id, broker in brokers.items():
                if broker.source == "api":
                    try:
                        ok = await broker.authenticate()
                        print(f"[Broker] {account_id}: {'✓' if ok else '✗'}")
                        if ok and hasattr(broker, "start_live_feed"):
                            await broker.start_live_feed()
                        elif ok and hasattr(broker, "start_poll"):
                            await broker.start_poll()
                    except Exception as e:
                        print(f"[Broker] {account_id} auth failed: {e}")

        asyncio.create_task(auth_brokers())

    # ── Voice ──────────────────────────────────────────────────────────────────

    async def handle_audio(self, pcm_bytes: bytes):
        if self._pipeline:
            await self._pipeline.handle_audio_in(pcm_bytes)

    async def handle_text(self, text: str):
        """Handle text input — parses commands or passes to Claude."""
        text_lower = text.lower().strip()

        # Hard-coded command routing (before Claude gets it)
        if any(p in text_lower for p in ["start ritual", "begin ritual", "run ritual"]):
            asyncio.create_task(self._ritual_engine.start_ritual())
            return

        if any(p in text_lower for p in ["log that trade", "log the trade"]):
            await self.say("What was your thesis on that trade?", "calm_authority")
            return

        if any(p in text_lower for p in ["session's over", "session over", "end session"]):
            if self._journal_logger:
                asyncio.create_task(self._journal_logger.end_of_session_debrief(self))
            return

        if any(p in text_lower for p in ["unlock me", "unlock", "let me back in"]):
            asyncio.create_task(self._unlock_protocol.run())
            return

        if any(p in text_lower for p in ["i need a reminder", "faith reminder", "give me something faith"]):
            from backend.psychology.faith import get_faith_message
            msg = get_faith_message("direct_request")
            await self.say(msg.text, "faith")
            return

        if any(p in text_lower for p in ["motivation", "fire me up", "give me something"]):
            from backend.psychology.motivation import get_motivation_message
            msg = get_motivation_message("direct_request")
            await self.say(msg.text, "motivation")
            return

        if "weekly review" in text_lower:
            from backend.journal.review import weekly_review
            asyncio.create_task(weekly_review.generate())
            await self.say("Generating your weekly review. Give me a moment.", "calm_authority")
            return

        if any(p in text_lower for p in ["onboard", "set up", "first time"]):
            asyncio.create_task(self._onboarding.run())
            return

        # Pass to Claude via voice pipeline
        if self._pipeline:
            await self._pipeline.handle_text_in(text)

    async def say(self, text: str, tone: str = "calm_authority"):
        """Directly speak — bypasses conversation history."""
        if self._pipeline:
            await self._pipeline.say(text, tone)
        else:
            print(f"[Jarvis] {text}")

    def set_audio_callback(self, callback):
        if self._pipeline:
            self._pipeline.on_audio_out(callback)

    async def start_voice(self):
        if self._pipeline:
            await self._pipeline.start()

    # ── Screen ─────────────────────────────────────────────────────────────────

    async def process_screen_event(self, event_data: dict):
        session = get_session()
        if not session.session_armed:
            return

        from backend.screen.analyzer import screen_analyzer
        from backend.rules.models import ScreenEvent
        event = ScreenEvent(
            platform=event_data.get("platform", "default"),
            screenshot_b64=event_data.get("image_b64", ""),
        )
        violations = await screen_analyzer.analyze(event)
        for v in violations:
            await self._handle_violation(v)

    # ── Violation handling ─────────────────────────────────────────────────────

    async def _handle_violation(self, violation):
        from backend.rules.models import ViolationSeverity

        # Log intervention
        if self._journal_logger:
            self._journal_logger.record_intervention(violation.message)

        # Voice warning always fires
        await self.say(violation.message, tone=violation.tone)

        # Lockout action (may be None for voice-only warnings)
        if self._lockout_manager:
            action = self._lockout_manager.evaluate_and_trigger(violation, get_session())
            if action:
                await self._lockout_manager.execute(action)
                await self.broadcast_state()

    # ── Trade fill handling (called by broker clients) ─────────────────────────

    async def handle_trade_fill(self, trade_data: dict, account_id: str):
        """Called when Tradovate WS or TradeLocker poll detects a closed trade."""
        from backend.rules.models import Trade
        from datetime import datetime
        try:
            trade = Trade(
                trade_id=str(trade_data.get("id", "")),
                account_id=account_id,
                instrument=trade_data.get("contractId", trade_data.get("symbol", "?")),
                direction="LONG" if trade_data.get("side", "B") == "B" else "SHORT",
                entry_price=float(trade_data.get("entryPrice", 0)),
                exit_price=float(trade_data.get("exitPrice", trade_data.get("price", 0))),
                size=float(trade_data.get("qty", trade_data.get("volume", 1))),
                pnl=float(trade_data.get("realizedPnL", trade_data.get("pnl", 0))),
                opened_at=datetime.utcnow(),
                closed_at=datetime.utcnow(),
                platform=account_id.split("_")[0],
            )
            # Journal auto-log
            if self._journal_logger:
                await self._journal_logger.log_trade_auto(trade)
            # Rules evaluation
            violations = rules_engine.evaluate_trade_close(trade)
            for v in violations:
                await self._handle_violation(v)
        except Exception as e:
            print(f"[Jarvis] Trade fill handling error: {e}")

    # ── Agent WebSocket reference ──────────────────────────────────────────────

    def set_agent_ws(self, agent_ws):
        self._agent_ws = agent_ws
        from backend.lockout.manager import set_agent_ws
        set_agent_ws(agent_ws)

    # ── Dashboard broadcast ────────────────────────────────────────────────────

    def register_dashboard_ws(self, ws):
        self._dashboard_connections.append(ws)

    def unregister_dashboard_ws(self, ws):
        try:
            self._dashboard_connections.remove(ws)
        except ValueError:
            pass

    async def broadcast_state(self):
        session = get_session()
        payload = json.dumps({
            "type": "state_update",
            "session": session.model_dump(mode="json"),
        })
        dead = []
        for ws in self._dashboard_connections:
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.unregister_dashboard_ws(ws)


# Module-level singleton
jarvis = JarvisCore()
