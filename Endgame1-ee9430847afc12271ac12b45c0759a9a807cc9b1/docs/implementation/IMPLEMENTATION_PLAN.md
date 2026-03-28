# Jarvis Trading Assistant — Implementation Plan
**Project:** Endgame1
**User:** YAZDAQ (Bag Maker)
**Date:** 2026-03-27
**Status:** Approved — Build Begins

---

## Critical Path Overview

```
M0: Scaffold           ← start here
  ↓
M1: Voice Layer        ← Jarvis can speak and listen
  ↓
M2: Rules Engine       ← Jarvis knows the rules
  ↓
M3: Desktop Agent      ← Jarvis can see the screen
  ↓
M4: Chrome Extension   ← Jarvis can lock the screen
  ↓
M5: Broker APIs        ← Jarvis has real trade data
  ↓
M6: WHOOP              ← Jarvis reads the body
  ↓
M7: Psych Engine       ← Jarvis has the full psychology toolkit
  ↓
M8: Notion Journal     ← Jarvis records everything
  ↓
M9: PWA Dashboard      ← Jarvis is visible on all devices
  ↓
M10: Onboarding        ← Jarvis can set itself up from scratch
  ↓
M11: Full Integration  ← All 4 layers fire together. Production.
```

---

## Repository Structure

```
endgame1/
├── backend/                    # Railway.app Python server
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Env vars, constants
│   ├── requirements.txt
│   ├── railway.toml
│   │
│   ├── core/
│   │   ├── jarvis.py           # Master Jarvis orchestrator
│   │   ├── session.py          # Session state manager
│   │   └── state.py            # Shared state (active account, locks, etc.)
│   │
│   ├── voice/
│   │   ├── stt.py              # Deepgram WebSocket STT
│   │   ├── tts.py              # ElevenLabs WebSocket TTS
│   │   ├── pipeline.py         # Full voice conversation loop
│   │   └── interrupt.py        # Interruption trigger logic
│   │
│   ├── rules/
│   │   ├── models.py           # RuleProfile, AccountConfig Pydantic models
│   │   ├── engine.py           # Rules enforcement + violation detection
│   │   └── profiles.py         # Profile store (JSON/SQLite)
│   │
│   ├── screen/
│   │   ├── watcher.py          # Receives screenshot data from Desktop Agent
│   │   ├── analyzer.py         # Claude Vision analysis
│   │   └── platforms.py        # Platform-specific detection logic
│   │
│   ├── brokers/
│   │   ├── base.py             # BaseBroker abstract class
│   │   ├── tradovate.py        # Tradovate REST + WebSocket
│   │   ├── tradelocker.py      # TradeLocker REST API
│   │   ├── projectx.py         # Project X (screen-only stub)
│   │   └── tradesea.py         # Tradesea (screen-only stub)
│   │
│   ├── biometrics/
│   │   ├── whoop.py            # WHOOP API client
│   │   ├── monitor.py          # Live session monitoring + triggers
│   │   └── classifier.py       # GREEN/AMBER/RED state classification
│   │
│   ├── psychology/
│   │   ├── faith.py            # Islamic message system
│   │   ├── motivation.py       # Raw motivation system + quote bank
│   │   └── ritual.py           # Pre-session ritual engine (6 phases)
│   │
│   ├── lockout/
│   │   ├── manager.py          # Lockout severity matrix + orchestrator
│   │   └── unlock.py           # Unlock protocol handler
│   │
│   ├── journal/
│   │   ├── notion.py           # Notion API client
│   │   ├── logger.py           # Trade entry builder
│   │   └── review.py           # Weekly AI review generator
│   │
│   └── api/
│       ├── ws.py               # WebSocket endpoints (voice, agent, dashboard)
│       └── routes.py           # REST endpoints (dashboard, journal, rules)
│
├── desktop-agent/              # Mac background process
│   ├── agent.py                # Entry point
│   ├── screen_capture.py       # mss capture + window detection
│   ├── ws_client.py            # WebSocket connection to backend
│   └── audio.py                # Local mic/speaker passthrough
│
├── chrome-extension/           # Manifest V3
│   ├── manifest.json
│   ├── background.js           # Service worker — WebSocket client
│   ├── content.js              # Tab injection — overlay rendering
│   ├── overlay-soft.html       # Soft lock UI
│   ├── overlay-hard.html       # Hard lock UI (imagery + timer)
│   └── assets/
│       └── hardlock-images/    # Gratitude reset imagery
│
├── dashboard/                  # PWA (React + Vite)
│   ├── index.html
│   ├── manifest.json
│   ├── src/
│   │   ├── App.jsx
│   │   ├── views/
│   │   │   ├── LiveSession.jsx
│   │   │   └── History.jsx
│   │   └── components/
│       └── ws.js               # WebSocket connection to backend
│
└── docs/
    ├── research/
    ├── superpowers/specs/
    └── implementation/         # ← you are here
```

---

## Milestone 0 — Project Scaffold & Dev Environment

**Goal:** Repo ready, backend boots on Railway, env vars wired.

### Tasks

- [ ] Create the directory structure above
- [ ] `backend/requirements.txt` — initial packages:
  ```
  fastapi
  uvicorn[standard]
  websockets
  httpx
  anthropic
  deepgram-sdk
  elevenlabs
  mss
  pydantic
  python-dotenv
  notion-client
  pushover (or httpx calls to Pushover API)
  ```
- [ ] `backend/main.py` — FastAPI app with `/health` endpoint
- [ ] `backend/config.py` — load all env vars from `.env`:
  ```
  ANTHROPIC_API_KEY
  DEEPGRAM_API_KEY
  ELEVENLABS_API_KEY
  ELEVENLABS_VOICE_ID
  WHOOP_CLIENT_ID / WHOOP_CLIENT_SECRET
  TRADOVATE_API_KEY / TRADOVATE_SECRET
  TRADELOCKER_API_KEY
  NOTION_TOKEN / NOTION_DATABASE_ID
  PUSHOVER_USER_KEY / PUSHOVER_APP_TOKEN
  ```
- [ ] `railway.toml` — Railway deployment config (start command, Python version)
- [ ] `.gitignore` — exclude `.env`, `__pycache__`, `*.pyc`
- [ ] Deploy bare backend to Railway — confirm `/health` returns 200

**Deliverable:** `GET /health` returns `{"status": "ok", "name": "Jarvis"}` from Railway URL.

---

## Milestone 1 — Voice Layer MVP

**Goal:** Speak to Jarvis, Jarvis speaks back. Interruption pipeline live.

### Architecture

```
Browser mic (getUserMedia)
  → WebSocket /ws/voice (FastAPI)
    → Deepgram Nova-2 WebSocket (streaming STT)
      → Rules Monitor + Interrupt check
        → Claude API (streaming)
          → ElevenLabs WebSocket (streaming TTS)
            → Audio chunks back to browser → speaker
```

### Key Files

**`backend/voice/stt.py`**
- `DeepgramSTT` class
- Opens WebSocket to `wss://api.deepgram.com/v1/listen?model=nova-2&encoding=linear16&sample_rate=16000&interim_results=true`
- Streams raw PCM from client mic
- Emits `TranscriptChunk` events (interim + final)

**`backend/voice/tts.py`**
- `ElevenLabsTTS` class
- Opens WebSocket to ElevenLabs streaming endpoint
- Accepts text chunks, streams MP3/PCM audio back
- `tone_settings` parameter: `calm_authority | hard_interrupt | faith | motivation`
- Tone maps to ElevenLabs `voice_settings` (stability, similarity_boost, style, speed)

**`backend/voice/interrupt.py`**
- `InterruptMonitor` class
- Subscribes to live `TranscriptChunk` stream
- Pattern-matches against active rule profile triggers
- Fires `INTERRUPT_EVENT` immediately when match found — does not wait for sentence end
- Mutes mic during TTS output

**`backend/voice/pipeline.py`**
- `VoicePipeline` class — orchestrates STT → interrupt check → Claude → TTS
- Maintains conversation history (rolling 20-turn context)
- Injects `system_prompt` with Jarvis personality + active rule profile + session state

**`backend/api/ws.py`**
- `WebSocket /ws/voice` — accepts mic audio stream from browser/PWA
- `WebSocket /ws/agent` — Desktop Agent connection (screen data, biometric data)
- `WebSocket /ws/dashboard` — Dashboard live feed (session state, P&L, WHOOP)

**Jarvis System Prompt (injected per conversation)**
```
You are JARVIS — a personal trading performance system for YAZDAQ (Bag Maker).
Firm, direct, no filler. You speak in commands and short statements.
You enforce trading rules without negotiation.
You address the user as YAZDAQ.
Active account: {active_account}
Active rule profile: {rule_profile_json}
Current session state: {session_state_json}
Current biometric state: {biometric_state}
```

### Tone Presets (ElevenLabs voice_settings)

| Mode | Stability | Similarity | Style | Speed |
|---|---|---|---|---|
| calm_authority | 0.75 | 0.85 | 0.2 | 1.0 |
| hard_interrupt | 0.55 | 0.90 | 0.7 | 1.15 |
| faith | 0.90 | 0.80 | 0.1 | 0.85 |
| motivation | 0.50 | 0.88 | 0.9 | 1.2 |

**Deliverable:** Open browser → speak to Jarvis → Jarvis responds in voice with correct tone.

---

## Milestone 2 — Rules Engine & Account Profiles

**Goal:** Jarvis knows every rule for every account and can evaluate any event against them.

### Data Models (`backend/rules/models.py`)

```python
class RuleProfile(BaseModel):
    account_id: str
    platform: str                    # tradovate | tradelocker | projectx | tradesea
    account_type: str                # funded | live
    max_daily_loss: float            # in dollars
    max_contracts: int               # per trade
    max_lot_size: float              # forex lot size
    max_trades_per_day: int
    max_consecutive_losses: int
    restricted_hours: list[tuple]    # [(9, 30), (9, 45)] = no trading 9:30–9:45
    revenge_trade_cooldown_min: int
    trading_demons: list[str]        # from onboarding psychology profile
```

```python
class SessionState(BaseModel):
    active_account: str
    daily_pnl: float
    trade_count: int
    consecutive_losses: int
    last_trade_timestamp: datetime | None
    lockout_status: LockoutStatus    # NONE | SOFT | HARD | DAY_DONE
    lockout_expiry: datetime | None
    session_armed: bool
    biometric_state: str             # GREEN | AMBER | RED
```

### Rules Engine (`backend/rules/engine.py`)

```python
class RulesEngine:
    def evaluate_screen_event(self, event: ScreenEvent) -> list[Violation]
    def evaluate_voice_transcript(self, text: str) -> list[Violation]
    def evaluate_trade_close(self, trade: Trade) -> list[Violation]
    def evaluate_biometric(self, metrics: WhoopMetrics) -> list[Violation]
```

`Violation` types:
- `POSITION_SIZE_EXCEEDED`
- `DAILY_LOSS_LIMIT_HIT`
- `CONSECUTIVE_LOSS_LIMIT`
- `RESTRICTED_HOURS_BREACH`
- `REVENGE_TRADE_DETECTED`
- `ADDING_TO_LOSER`
- `BIOMETRIC_RED_WITH_ORDER`

Each `Violation` carries: `severity` (WARNING | SOFT_LOCK | HARD_LOCK), `message` (Jarvis script), `tone` (voice tone preset).

**Profile Storage:** JSON files at `data/profiles/{account_id}.json` — simple, portable, editable.

**Deliverable:** Unit tests pass for all violation types against all four account profiles.

---

## Milestone 3 — Desktop Agent (Mac)

**Goal:** Python background process runs on Mac, watches active window, sends screenshot data to backend on violation potential.

### Key Files

**`desktop-agent/screen_capture.py`**
- `ScreenCapture` class using `mss`
- `get_active_window_title()` — uses `AppKit` (pyobjc) on Mac
- `is_trading_platform_active()` — checks window title against known platform names:
  - "Tradovate", "TradeLocker", "HeroFX", "TopstepX", "Tradesea", "Lucid"
- `capture_active_window()` → PNG bytes
- Screenshot cadence: 2 FPS when trading platform active, paused otherwise

**`desktop-agent/ws_client.py`**
- Connects to `wss://backend.railway.app/ws/agent`
- Sends: `{ type: "screenshot", platform: "tradovate", image_b64: "...", timestamp: "..." }`
- Sends: `{ type: "heartbeat" }` every 10s
- Receives: lockout commands from backend → forwards to Chrome Extension via local WebSocket

**`desktop-agent/agent.py`**
- Entry point — runs as `launchd` daemon on Mac
- Spawns: screen capture loop, local WebSocket server (for Chrome Extension), backend WebSocket client
- Local WebSocket server: `ws://localhost:7979` — Chrome Extension connects here

**`backend/screen/analyzer.py`**
- `ScreenAnalyzer` class
- Receives screenshot + platform + active rule profile
- Sends to Claude Vision API with structured prompt:
  ```
  Platform: {platform}
  Active rules: {rule_profile_json}
  Analyze this trading screen for rule violations.
  Return JSON: { violations: [...], confidence: float, detected_elements: [...] }
  ```
- Violation results fed into `RulesEngine.evaluate_screen_event()`

**Platform Detection Logic (`backend/screen/platforms.py`)**
- Platform-specific prompt templates for each trading interface
- Tradovate: look for order ticket, position size field, P&L widget
- TradeLocker: look for lot size, margin, open positions panel
- etc.

**Deliverable:** Desktop Agent running → open Tradovate → backend receives screenshots → Claude Vision logs detected violations to console.

---

## Milestone 4 — Chrome Extension

**Goal:** Jarvis can physically block access to trading platforms.

### Files

**`chrome-extension/manifest.json`**
```json
{
  "manifest_version": 3,
  "name": "Jarvis Lockout",
  "permissions": ["tabs", "activeTab", "storage"],
  "host_permissions": ["*://trader.tradovate.com/*", "*://tradelocker.com/*", ...],
  "background": { "service_worker": "background.js" },
  "content_scripts": [{ "matches": ["<all_urls>"], "js": ["content.js"] }]
}
```

**`chrome-extension/background.js`** (Service Worker)
- Connects to Desktop Agent local WebSocket: `ws://localhost:7979`
- Receives lockout commands: `{ type: "SOFT_LOCK" | "HARD_LOCK" | "UNLOCK", data: {...} }`
- Forwards to active trading tab content script via `chrome.tabs.sendMessage`

**`chrome-extension/content.js`**
- Listens for lockout messages from background
- **SOFT LOCK:** Injects full-viewport overlay div:
  - Shows violation message
  - Two buttons: "This was intentional (override)" / "Stand down"
  - 30-second countdown timer → auto-dismiss
  - Override click → sends `{ type: "OVERRIDE_LOGGED" }` back to backend
- **HARD LOCK:** Injects full-viewport overlay div:
  - `pointer-events: all` — nothing clickable underneath
  - Rotating gratitude images (from `assets/hardlock-images/`)
  - Message: *"Someone right now would trade everything they have just to be in your position."*
  - Minimum timer display (15 min default)
  - No dismiss until backend sends UNLOCK

**Lockout image set (`assets/hardlock-images/`):**
Add 5-10 images manually — people in hardship, poverty, struggle. These serve as a pattern interrupt / gratitude reset. User can customise.

**`backend/lockout/manager.py`**
- `LockoutManager` class
- `evaluate_and_trigger(violation: Violation, session: SessionState) → LockoutAction`
- Implements the full severity matrix (Section 6 of design spec)
- Sends lockout command to Desktop Agent via `/ws/agent` WebSocket
- Simultaneously calls broker API lockout if applicable (Tradovate / TradeLocker)

**Deliverable:** Trigger a test violation → Chrome Extension fires correct overlay → timer runs → dismiss/override works → event logged.

---

## Milestone 5 — Broker Integrations

**Goal:** Jarvis has real-time P&L, position data, and can execute lockouts at the broker level.

### Tradovate (`backend/brokers/tradovate.py`)

**Auth:** API key + secret → POST `/auth/accesstokenrequest` → bearer token (expires 24h, auto-refresh)

**REST endpoints used:**
- `GET /account/list` → account IDs
- `GET /position/list` → open positions (size, instrument, unrealised P&L)
- `GET /order/list` → pending orders
- `POST /order/cancelorder` → cancel pending orders (lockout)
- `POST /account/setrisklimits` → reduce position limits (lockout)

**WebSocket:** `wss://md.tradovate.com/v1/websocket`
- Subscribe to `user/syncrequest` → real-time account updates, fills, P&L changes
- On fill received → push to `RulesEngine.evaluate_trade_close()`

### TradeLocker (`backend/brokers/tradelocker.py`)

**Auth:** REST API key in header `Authorization: Bearer {key}`

**REST endpoints:**
- `GET /trade/accounts` → account list
- `GET /trade/positions` → open positions
- `GET /trade/orders` → pending orders
- `DELETE /trade/orders/{id}` → cancel order (lockout)
- `POST /trade/accounts/{id}/disable` → disable trading (hard lockout)

**Polling:** No WebSocket — poll `/trade/positions` every 5 seconds during session.

### Project X / Tradesea (Screen-only)

No direct API. These accounts are monitored exclusively via:
- Screen intelligence (Desktop Agent + Claude Vision)
- Chrome Extension lockout (blocks the web UI)

Create stub classes `ProjectXBroker` and `TradeseaBroker` with `source = "screen_only"` flag — rules engine uses screen data only for these.

**`backend/core/session.py`**
- `SessionManager` class
- On session start: polls all active broker APIs → builds initial `SessionState`
- Maintains live P&L by merging broker WebSocket + polling data
- Exposes `get_session_state() → SessionState`

**Deliverable:** Tradovate and TradeLocker accounts show live P&L in backend logs. Test lockout call executes successfully (sandbox accounts first).

---

## Milestone 6 — WHOOP Biometric Integration

**Goal:** Jarvis reads physical state and adjusts every decision to match it.

### WHOOP API (`backend/biometrics/whoop.py`)

**Auth:** OAuth2 (existing WHOOP integration — reuse tokens)

**Endpoints:**
- `GET /v1/recovery` → latest recovery score, HRV, resting HR, sleep performance
- `GET /v1/cycle` → current day strain
- `GET /v1/workout` (optional — may capture pre-session exertion)

**Polling during session:** Every 60 seconds for HR updates.
Note: WHOOP does not provide true live HR via API — best available is ~1-min polling. If user has WHOOP with live BLE: consider future BLE bridge; for v1, 60s polling is sufficient.

### State Classifier (`backend/biometrics/classifier.py`)

```python
def classify_state(recovery: WhoopRecovery) -> BiometricState:
    if recovery.score >= 67 and recovery.hrv_healthy and recovery.sleep_performance >= 70:
        return BiometricState.GREEN
    elif recovery.score >= 40:
        return BiometricState.AMBER
    else:
        return BiometricState.RED
```

### Session Baseline

On ritual completion (Phase 0), capture:
- `baseline_hr` = current HR at that moment
- `baseline_hrv` = current HRV

All during-session comparisons use these values, not WHOOP's historical averages.

### Live Monitor (`backend/biometrics/monitor.py`)

```python
class BiometricMonitor:
    async def monitor_loop(self):
        while session_active:
            metrics = await whoop.get_current()
            violations = rules_engine.evaluate_biometric(metrics, baseline)
            if violations:
                await jarvis.intervene(violations[0])
            await asyncio.sleep(60)
```

Trigger thresholds:
- HR > 95 bpm while in position → `calm_authority` intervention
- HRV drops >20% from session baseline → "Your body is stressed. Step back 60 seconds."
- Recovery <50% at session start → flag in morning briefing, reduced sizing recommendation

**Deliverable:** WHOOP state classification shown in backend logs at session start. HR spike triggers a console-logged intervention.

---

## Milestone 7 — Psychological Engine

**Goal:** Faith system, raw motivation system, and full pre-session ritual all functional.

### Faith System (`backend/psychology/faith.py`)

Message bank: 15-20 messages, tagged by trigger context:
- `stress_biometric` — HR spike or HRV drop
- `rule_violation` — any violation caught
- `losing_streak` — 2+ consecutive losses
- `direct_request` — user says "I need a reminder"
- `session_end` — closing encouragement

Message selection: Claude picks the most contextually appropriate message given current session state + trigger. Message bank is input, Claude outputs the selected message + adapts it slightly for the moment.

Tone: `faith` preset (ElevenLabs — slower, softer).

### Motivation System (`backend/psychology/motivation.py`)

Message bank: 10-15 core messages + `quote_bank` (user-added quotes from onboarding/settings).

Triggers:
- `hesitation` — valid setup detected on screen but no order placed after X seconds
- `soft_execution` — partial position taken vs plan
- `direct_request` — "Jarvis, give me something"

Tone: `motivation` preset (ElevenLabs — faster, harder).

### Ritual Engine (`backend/psychology/ritual.py`)

```python
class RitualEngine:
    async def start_ritual(self, available_minutes: int) -> RitualResult:
        # Phase 0: WHOOP baseline scan → classify state
        # If <10 min: run emergency protocol
        # Otherwise: run phases 1-6 based on state (GREEN/AMBER/RED)
        ...

    async def run_phase(self, phase: RitualPhase, state: BiometricState):
        # Announce phase
        # Give instruction via TTS
        # Await voice confirmation before advancing
        ...

    def arm_session(self):
        # Called after Phase 6 completion
        # Sets session_state.session_armed = True
        # Arms: screen monitoring, voice monitoring, biometric monitoring, lockout
        ...
```

Phase configurations by state:

| Phase | GREEN | AMBER | RED |
|---|---|---|---|
| 1 - Cold water | Standard | Standard | Standard |
| 2 - Environment | Standard | Standard | Standard |
| 3 - Playlist | Normal BPM | Lower BPM | Ambient only |
| 4 - Physical | 50 push-ups | Rhythmic movement | Light movement |
| 4a - Breathing | Skip | Box breathing | Extended calm + body scan |
| 5 - Visualization | 2 min | 3 min + breathing | 4 min + faith reset |
| 6 - Anchor cue | Fire | Fire (slow) | Fire (deliberate) |
| Total time | ~4 min | ~7 min | ~12 min |

**Ritual gate:** Session cannot arm without ritual completion. If user attempts voice command to arm without ritual: "Run the ritual first. You know the rules."

**Deliverable:** Full ritual runs end-to-end via voice. Phase 6 fires anchor cue. Session arms. `session_armed = True` in state.

---

## Milestone 8 — Notion Trade Journal

**Goal:** Every trade recorded automatically. Voice journaling works. Weekly review generates.

### Notion Database Schema

Create one Notion database: `JARVIS Trading Journal`

**Properties:**
| Property | Type |
|---|---|
| Date | Date |
| Instrument | Select |
| Direction | Select (Long/Short) |
| Entry Price | Number |
| Exit Price | Number |
| Size / Lots | Number |
| P&L | Number |
| Account | Select |
| Platform | Select |
| Recovery Score | Number |
| HR at Open | Number |
| HRV at Open | Number |
| Biometric State | Select (GREEN/AMBER/RED) |
| Rule Adherence | Select (Followed/Deviated/Override) |
| Emotional State | Text |
| Thesis | Text |
| Post-Trade Reflection | Text |
| Jarvis Interventions | Text |
| Override Count | Number |

### Journal Logger (`backend/journal/logger.py`)

```python
class JournalLogger:
    async def log_trade_auto(self, trade: Trade, session: SessionState):
        # Called on broker fill events (Tradovate WS, TradeLocker poll)
        # Builds entry from trade data + biometric snapshot + session state
        # Creates Notion page
        ...

    async def log_trade_voice(self, trade_context: dict):
        # Called when user says "Jarvis, log that trade"
        # Jarvis asks: thesis, emotional state, any deviations
        # Waits for voice responses, appends to existing auto-entry
        ...

    async def end_of_session_debrief(self, session: SessionState):
        # Triggered by market close time or "Jarvis, session's over"
        # Loops through all trades from session
        # Asks structured reflection per trade
        # Updates Notion entries + creates session summary page
        ...
```

### Weekly Review (`backend/journal/review.py`)

```python
class WeeklyReview:
    async def generate(self) -> str:
        # Fetch all trades from past 7 days from Notion
        # Send to Claude with structured analysis prompt
        # Surface: win rate by setup/time/account, biometric correlations,
        #          common deviations, patterns user likely doesn't see
        # Output: voice brief (TTS) + Notion summary page
        ...
```

**Scheduler:** Cron in Railway — run `WeeklyReview.generate()` every Sunday at 18:00.

**Deliverable:** Complete a trade on Tradovate → Notion entry created automatically within 10 seconds with full metadata.

---

## Milestone 9 — PWA Dashboard

**Goal:** Live session data visible on Mac browser and iPhone.

### Tech: React + Vite, PWA manifest, Tailwind CSS

### Views

**`LiveSession.jsx`** — active session card grid:
- Active account name + rule profile loaded
- P&L bar: current vs daily limit (red/amber/green colour coded)
- Trade count / max
- Consecutive loss counter
- WHOOP HR + HRV live numbers (60s refresh)
- Biometric state badge (GREEN/AMBER/RED)
- Jarvis status: `ARMED | MONITORING | INTERVENING | LOCKED`
- Lockout status panel (if locked: reason + timer)

**`History.jsx`**:
- Journal entries list (pulls from Notion via backend API)
- Weekly review summaries
- Simple P&L chart by day

### WebSocket Feed

Dashboard connects to `wss://backend.railway.app/ws/dashboard`.

Backend pushes `DashboardUpdate` events every 5 seconds:
```json
{
  "session_state": {...},
  "biometrics": {...},
  "recent_interventions": [...],
  "lockout": {...}
}
```

### PWA Setup
- `manifest.json` with `display: standalone`, icons
- Service worker for offline shell
- iOS: `apple-mobile-web-app-capable` meta tags

**Pushover Integration:**
- `POST https://api.pushover.net/1/messages.json` via httpx
- Triggered for: hard lockout, session arm, daily limit hit, weekly review ready
- Pushover sends to iPhone and Mac simultaneously

**Deliverable:** PWA installs on iPhone. Live session data updates in real-time. Hard lockout pushes iPhone notification.

---

## Milestone 10 — Onboarding Flow

**Goal:** First-time user is guided through complete setup by Jarvis voice — zero manual config.

### Flow

```python
class OnboardingFlow:
    steps = [
        OnboardingStep.IDENTITY,          # Confirm name (YAZDAQ / Bag Maker)
        OnboardingStep.CONTEXTS,          # Confirm 5 performance contexts
        OnboardingStep.RULE_PROFILES,     # 4 accounts × 7 rule fields = 28 voice prompts
        OnboardingStep.PSYCHOLOGY,        # Trading demons + green state description
        OnboardingStep.ANCHOR_CUE,        # Establish trading anchor cue (first rep)
        OnboardingStep.PLAYLISTS,         # 3 playlist links (standard/activation/calm)
        OnboardingStep.CONNECTIONS,       # API keys + Chrome extension install
    ]
```

Each step:
1. Jarvis explains what it needs and why (brief, direct)
2. User responds via voice or types in dashboard form
3. Data saved to profile
4. Jarvis confirms and advances

**Step 7 - Connections checklist** (dashboard UI):
Each service shows a connection card with status indicator:
- WHOOP — green ✓ once token validates
- Tradovate — green ✓ once `/account/list` returns data
- TradeLocker — green ✓ once auth succeeds
- Project X / Tradesea — green ✓ once session auth confirmed
- Notion — green ✓ once database created
- Pushover — green ✓ once test notification sent
- Chrome Extension — green ✓ once local WebSocket connects

**Anchor Conditioning System:**
```python
class AnchorConditioner:
    def record_rep(self, context: str):
        # Increment rep count for context anchor
        # After each rep: "Anchor fired. State delivered. That pairing just got stronger."
        ...

    def check_conditioning_status(self, context: str) -> int:
        # Returns reps completed (target: 60)
        # During early sessions (reps < 60): Jarvis reminds "The highway is being built"
        ...
```

**Deliverable:** Full onboarding runs start-to-finish. All 4 rule profiles populated. All API connections green. Chrome Extension installed and connected.

---

## Milestone 11 — Full Integration & Production

**Goal:** All 4 protection layers fire simultaneously. System deployed to production Railway. End-to-end tested.

### Lockout Severity Matrix Implementation

```python
class LockoutManager:
    def evaluate_and_trigger(
        self,
        violation: Violation,
        session: SessionState,
        override_count: int
    ) -> LockoutAction:
        # First warning → SOFT (30s auto)
        # 2nd violation same session → SOFT + voice (5 min)
        # Daily loss limit → HARD (rest of day, no unlock)
        # 3 consecutive losses → HARD (15 min min, full unlock protocol)
        # Biometric RED + order → HARD (until baseline, HR + voice unlock)
        # Manual "lock me out" → HARD (user-defined duration)
        # Override 3x → HARD (30 min)
        ...
```

### Unlock Protocol

```python
class UnlockProtocol:
    async def run(self, lock_type: LockoutType) -> bool:
        if lock_type == LockoutType.DAY_DONE:
            return False  # No unlock for daily limit

        # 1. Check WHOOP HR trending toward baseline
        # 2. Voice: "What rule did you break and why?"
        # 3. Faith or motivation based on state
        # 4. If appropriate: reduce limits for remainder of session
        # 5. Send UNLOCK to Chrome Extension
        # 6. Log full incident to Notion journal
        ...
```

### Integration Test Sequence

Run through this manually before declaring M11 complete:

1. Boot Desktop Agent on Mac → connect to backend ✓
2. Chrome Extension connects to Desktop Agent ✓
3. Open Tradovate → screen capture activates ✓
4. Run full ritual → session arms ✓
5. WHOOP state classified + shown on dashboard ✓
6. Place trade on Tradovate → auto-journaled to Notion ✓
7. Trigger SOFT lock → overlay fires → override logs ✓
8. Trigger HARD lock → imagery overlay → countdown ✓
9. Run unlock protocol → voice check → faith message → unlock ✓
10. "Jarvis, log that trade" → voice journaling flow ✓
11. "Jarvis, weekly review" → Claude generates review → pushed via Pushover ✓
12. Open PWA on iPhone → live session data visible ✓

### Railway Production Config

```toml
# railway.toml
[build]
builder = "nixpacks"

[deploy]
startCommand = "uvicorn backend.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
restartPolicyType = "on_failure"
```

Environment variables set in Railway dashboard (never in code).

**Deliverable:** System runs 24/7 on Railway. All 11 milestones integrated. First real trading session with full Jarvis monitoring completed.

---

## Implementation Order Summary

| Milestone | Priority | Estimated Sessions | Depends On |
|---|---|---|---|
| M0: Scaffold | P0 | 1 | — |
| M1: Voice Layer | P0 | 2-3 | M0 |
| M2: Rules Engine | P0 | 1-2 | M0 |
| M3: Desktop Agent | P1 | 2 | M0, M2 |
| M4: Chrome Extension | P1 | 2 | M3 |
| M5: Broker APIs | P1 | 2-3 | M0, M2 |
| M6: WHOOP | P1 | 1-2 | M0 |
| M7: Psych Engine | P2 | 2 | M1, M6 |
| M8: Notion Journal | P2 | 2 | M5 |
| M9: PWA Dashboard | P2 | 2 | M1, M5, M6 |
| M10: Onboarding | P3 | 2 | M1-M9 |
| M11: Integration | P3 | 1-2 | M0-M10 |

**Start here:** M0 → M1 → M2. These three milestones give you a working Jarvis you can talk to that knows your rules.

---

## First Session Action Items

1. Create `/backend` directory structure
2. Install Python 3.11+ (if not present)
3. Set up virtual environment: `python -m venv .venv`
4. Create `.env` file with all API keys
5. Build `main.py` + `config.py` + `health` endpoint
6. Deploy to Railway — confirm green
7. Begin M1: Deepgram WebSocket STT first

The voice layer is the nerve centre of everything. Get it talking first.
