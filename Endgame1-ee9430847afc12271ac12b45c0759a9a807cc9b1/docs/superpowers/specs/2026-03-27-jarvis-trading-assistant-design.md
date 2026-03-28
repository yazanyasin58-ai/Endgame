# Jarvis Trading Assistant — System Design Spec
**Project:** Endgame1
**User:** YAZDAQ (Bag Maker)
**Date:** 2026-03-27
**Status:** Approved — Ready for Implementation Planning

---

## Overview

Jarvis is an AI-powered personal trading assistant modelled after the Jarvis from Iron Man — firm, direct, unfiltered. It combines real-time voice conversation, screen intelligence, biometric monitoring, psychological coaching, and hard lockout enforcement across multiple funded and live trading accounts.

The system enforces trading rules, runs science-backed pre-session rituals, monitors physical and emotional state, journals every trade, and physically locks the trader out of platforms when irrational behaviour is detected.

---

## Architecture Summary

Three components work together:

| Component | Platform | Role |
|---|---|---|
| **Backend** | Railway.app (Python) | Brain — rules engine, journal, broker connections, Claude API |
| **Desktop Agent** | Mac (background process) | Screen watching, local voice (mic/speaker), Chrome extension trigger |
| **Mobile** | iPhone PWA | Dashboard, push notifications |

---

## Section 1 — System Architecture

```
YOUR DEVICES
  [Mac Desktop]                    [iPhone]
   - Web Dashboard (PWA)            - PWA Dashboard
   - Microphone input               - Push Notifications (Pushover)
   - Speaker output                 - Voice via browser mic
   - Chrome Extension
          │                                │
          └──────────────┬─────────────────┘
                         │ HTTPS
                         ▼
            JARVIS BACKEND (Railway.app)
         ┌──────────────────────────────────┐
         │  Voice Layer  │  Rules Engine    │
         │  Screen Watch │  Journal Engine  │
         │  Ritual Engine│  Psych Engine    │
         │         ┌─────────────┐          │
         │         │ Claude API  │          │
         │         └─────────────┘          │
         └──────────────────────────────────┘
                         │
        ┌────────────────┼──────────────────┐
        ▼                ▼                  ▼
   BROKERS           NOTION            PUSHOVER
   - Tradovate       Trade Journal     Push notifs
   - TradeLocker     Database          iPhone/Mac
   - Project X
   - Tradesea
```

---

## Section 2 — Voice Layer

**Goal:** Real-time, low-latency conversation with the ability to interrupt the user mid-sentence when a rule violation or psychological red flag is detected.

### Technology Stack

| Role | Service | Detail |
|---|---|---|
| Speech-to-Text | Deepgram Nova-2 | Streaming WebSocket, ~50ms latency, live transcript chunks |
| AI Brain | Claude API (streaming) | Reasoning, rules enforcement, Jarvis personality |
| Text-to-Speech | ElevenLabs WebSocket | Streaming audio output, custom Jarvis voice |
| Interruption Logic | Custom Python | Watches live transcript, fires interrupt on flag |

### Interruption Pipeline

```
Your Mic
  │
  ▼
Deepgram Nova-2 (streaming)
  │  live transcript chunks as you speak
  ▼
Rules Monitor  ←── active rule profile
  │
  ├── violation detected ──→ INTERRUPT TRIGGER
  │                               │
  ▼                               ▼
Claude API (streaming)       ElevenLabs WebSocket
  │                          streams audio OUT
  └──────────────────────────┘  mic muted during output
```

### Jarvis Personality

- Firm, direct, no filler
- Speaks in commands and short statements
- Tone shifts dynamically:
  - **Calm authority** — standard conversation
  - **Hard interrupt** — rule violation caught
  - **Soft/slower** — faith/Islamic messages
  - **Sharp/fast** — raw motivational push
- Profanity permitted in motivational mode
- References user as "YAZDAQ" throughout

---

## Section 3 — Screen Intelligence Layer

**Goal:** Jarvis watches trading platforms visually — catching violations the user makes silently without saying anything.

### How It Works

- Lightweight Python background process on Mac
- Uses `mss` library for fast screenshots (active window only)
- Screenshots sent to Claude Vision API with active rule profile as context
- Activates only when a trading platform window is in focus
- Screenshots processed and discarded — nothing stored unless flagged for journal

### Detection Targets

| Scenario | Detection | Response |
|---|---|---|
| Order ticket open, size too large | Position size field vs rule max | "That's 3 contracts — your limit on this account is 2. Resize before you send." |
| Daily loss limit reached + new order | P&L on screen + open order ticket | "You're already down $480. Your limit is $500. Close that ticket." |
| 3 consecutive losses + immediate re-entry | Loss count + new order within seconds | "Three losses back to back. Your rule says take 15 minutes. Step away." |
| Trading during restricted hours | System clock + platform active | "It's 9:32. You don't trade the first 15 minutes. Close it." |
| Revenge trade pattern | Fast re-entry after loss | Calls it by name — "That's revenge trading. We've talked about this." |
| Adding to a losing position | Position + adding order | Flags immediately based on rule profile |
| Switching accounts mid-session | Platform/account change detected | Logs the switch, loads new rule profile |

### Platform Coverage

- Tradovate (web)
- TradeLocker / Hero FX (web)
- Project X / Topstep (web)
- Tradesea / Lucid (web)

---

## Section 4 — Broker Integrations

### Accounts

| Account | Platform | Integration Method |
|---|---|---|
| Topstep funded | Project X | Web session + screen watch (no direct API lock) |
| Alpha futures funded | Tradovate | REST + WebSocket API — full integration |
| Lucid funded | Tradesea | Web session + screen watch |
| Live forex | Hero FX via TradeLocker | TradeLocker REST API — full integration |

### Rule Profiles Per Account

Each account has its own rule profile stored in the backend. Profiles are interchangeable and configurable — set during onboarding, adjustable anytime via voice or dashboard.

**Profile fields per account:**
- Max daily loss ($)
- Max contracts/lot size per trade
- Max trades per day
- Max consecutive losses before mandatory stop
- Restricted trading hours
- Revenge trade cooldown (minutes)
- Account type: funded / live (affects lockout severity)

Jarvis auto-detects which platform is active on screen and loads the corresponding profile.

---

## Section 5 — Psychological Intelligence Engine

Four subsystems work in parallel during every session.

### 5a — WHOOP Biometric Integration

User has an existing WHOOP API tracking system to be wired in directly.

**Metrics consumed:**

| Metric | Use |
|---|---|
| Heart rate (live) | Stress detection during session |
| HRV vs personal baseline | Anxiety/arousal state classification |
| Recovery score | Pre-session state + sizing recommendation |
| Sleep performance | Pre-session warning flag |
| Accumulated strain | Session length recommendation |

**Biometric triggers during live session:**

| Signal | Threshold | Jarvis Action |
|---|---|---|
| HR spike | >95 bpm while in a position | Immediate calm intervention |
| HRV drop | Significant dip from session baseline | "Your body is stressed. Step back 60 seconds." |
| Recovery <50% at session start | Pre-market | Flag in morning briefing, suggest reduced sizing |
| Poor sleep | <70% sleep performance | Pre-session caution — "Trade lighter today." |

Session baseline is captured at ritual completion. During-session alerts compare against this personal baseline, not generic averages.

### 5b — Faith System (Islamic)

Triggered by: stress biometrics, rule violation, losing streak, or direct request ("Jarvis, I need a reminder").

Voice tone shifts — slower, calmer, softer ElevenLabs settings.

Example messages:
- *"Allah loves those who are patient. Your rizq is written — no trade will add or remove what is already yours. Trust your system. Trust Him. Wait for the setup."*
- *"Tawakkul. You've done the preparation. Now let go of the outcome. What's meant for you will not pass you."*
- *"Sabr. This discomfort you feel right now — this is where your character is built. Don't let a bad trade become a bad decision."*
- *"Al-Fatihah was revealed as a mercy. You are not alone in this. Come back to yourself."*

Messages selected contextually based on the specific trigger — not random.

### 5c — Raw Motivation System

Triggered by: hesitation on a valid setup, soft execution, second-guessing, or direct request.

Voice tone shifts — firmer, faster, direct. Profanity permitted.

Example messages:
- *"Things will never change until you change. Period. Full stop."*
- *"If you don't control your mind, your mind will control you — and right now it's winning. Lock in."*
- *"You didn't come this far to cheat yourself. Do it right the first time or don't do it at all."*
- *"You're a grown man. Stop letting fear make your decisions. You've done the work. Execute."*
- *"Every trader who ever made it had the same doubts you have right now. The difference is they pushed through anyway."*

User can add personal quotes to a quote bank. Jarvis pulls from it.

### 5d — Pre-Session Focus Ritual

Science-backed 6-phase ritual based on flow state research (Dietrich 2003, Van der Linden 2021, Steven Kotler / Flow Genome Project) and professional athlete protocols (Kobe Bryant, Rafael Nadal, Steph Curry, Tom Brady).

Full ritual doc: `docs/research/JARVIS_RITUAL_PROMPT.md`

#### Phase 0 — Biometric Baseline Scan (automatic)

WHOOP data pulled the moment ritual initiates. State classified into three tracks:

| State | Criteria | Protocol |
|---|---|---|
| GREEN | Recovery >66%, HR calm, HRV healthy | Standard ritual (~3-4 min) |
| AMBER | Recovery 40-65%, elevated HR, slightly low HRV, or poor sleep | Extended ritual with breathing work (~6-8 min) |
| RED | Recovery <40%, significantly low HRV, high HR | Deep reset required (10+ min). Session sizing flagged. |

Jarvis announces state and selects protocol automatically — no manual assessment needed.

#### Phase 1 — Physiological Break (T-40 min)
Cold water on face or brief cold shower. Triggers norepinephrine spike. Jarvis instructs and waits for confirmation.

#### Phase 2 — Environment Setup (T-30 min)
Identical workspace configuration every session. Jarvis walks through setup checklist. Environmental order signals internal order (Nadal principle).

#### Phase 3 — Auditory Anchor (T-20 min)
Context-specific trading playlist starts. Never played outside trading context. BPM adjusted by state (high for flat, low/ambient for anxious).

#### Phase 4 — Physical Calibration (T-15 min)
5-10 min deliberate movement. For trading: 50 push-ups + brief walk or jump rope. Induces transient hypofrontality — silences prefrontal overthinking (Dietrich 2003). Intensity adjusted by state.

#### Phase 5 — Visualization (T-5 min)
2-3 min eyes closed. Jarvis guides: flawless execution, clean entry, disciplined management, no emotional decisions. Faith anchor embedded. Extended for anxious state.

#### Phase 6 — Lock-In Cue (T-1 min)
User's unique physical anchor gesture. Fired only in trading context. Never casually. Jarvis silent during firing. Then: *"You're locked in. Begin."*

**On completion:**
- Screen monitoring ARMED
- Voice monitoring ARMED
- Biometric live tracking ARMED (vs session baseline)
- Active rule profile LOADED
- Lockout system ARMED

#### Emergency Protocol (<10 min available)
Cold water → 20 push-ups → one breath visualization → fire cue.
Jarvis flags: "This is the compressed version. Build 40 minutes in next session."

#### Breathing Protocols (AMBER/RED states)

**Box Breathing:**
Inhale 4 counts → hold 4 → exhale 4 → hold 4. Repeated until HR drops.

**Extended Calm (RED only):**
Full body scan guided by Jarvis verbally, followed by faith reset, then biometric re-check.

---

## Section 6 — Lockout & Pattern Interrupt System

Four-layer protection working simultaneously:
1. Voice — warns and interrupts
2. Screen — catches silent violations
3. Biometrics — catches emotional state before action
4. Lockout — physically blocks access when all else fails

### Chrome Extension

Custom extension installed once on Mac. Controlled by Jarvis via local WebSocket.

**SOFT LOCK** (first violation / warning level):
- Full-screen overlay on trading platform tab
- Shows violation, gives 2 options: "Intentional" (logs as override) or "Stand down"
- 30-second timer before auto-dismiss
- Override logged to journal

**HARD LOCK** (daily limit hit, 3rd loss, biometric red + order attempt, repeated override):
- Full-screen overlay — cannot click through
- Displays curated images of people in poverty/struggle (gratitude reset / pattern interrupt)
- Message: *"Someone right now would trade everything they have just to be in your position."*
- Minimum 15-minute lockout timer
- Unlock requires voice confirmation + HR check

### Broker-Level Lockouts

| Broker | Method |
|---|---|
| Tradovate | API call — flatten positions + disable order entry |
| TradeLocker (Hero FX) | REST API — disable trading on account |
| Project X / Topstep | Chrome extension block (no direct API) |
| Tradesea / Lucid | Chrome extension block (no direct API) |

### Unlock Protocol

After minimum cooldown expires:
1. WHOOP HR check — must be returning toward baseline
2. Verbal check-in — "What rule did you break and why do you think it happened?" (logged to journal)
3. Faith reset or motivation hit based on state
4. Jarvis unlocks with reduced limits if appropriate

**Daily limit lockout:** No unlock for trading that day. Session is over.

### Lockout Severity Matrix

| Trigger | Lock Type | Duration | Unlock |
|---|---|---|---|
| First rule warning | Soft overlay | 30 sec auto | Click through |
| 2nd violation same session | Soft + voice | 5 min | Voice confirm |
| Daily loss limit hit | Hard lock | Rest of day | None |
| 3 consecutive losses | Hard lock | 15 min min | Full protocol |
| Biometric red + order attempt | Hard lock | Until baseline | HR + voice |
| Manual "lock me out" | Hard lock | User-defined | Protocol |
| Repeated override (3x) | Hard lock | 30 min | Protocol |

---

## Section 7 — Trade Journal

### Three Capture Methods

**1. Automatic (broker API)**
- Tradovate and TradeLocker push trade data on close
- Entry price, exit price, size, P&L, timestamp, account — auto-logged to Notion
- No user action required

**2. Voice-triggered**
- "Jarvis, log that trade" — Jarvis asks 2-3 quick questions
- What was the thesis? What did you feel going in? Any deviations from plan?
- Logged immediately to Notion

**3. End-of-session debrief**
- Triggered by schedule (market close) or voice command
- Jarvis reviews all trades from the session
- Asks structured reflection questions per trade
- Logs emotional state, rule adherence, lessons

### Notion Journal Structure

Each trade entry contains:
- Trade metadata (auto-captured): date, time, instrument, direction, entry, exit, size, P&L, account, platform
- Session biometric snapshot (WHOOP): recovery, HR range, HRV at open
- Rule adherence: followed / deviated / overrode
- Emotional state at entry (voice or self-report)
- Thesis (voice)
- Post-trade reflection (debrief)
- Any Jarvis interventions during the trade (flags, lockouts, faith messages)

### Weekly AI Review

Jarvis digests the week's journal and surfaces:
- Win rate by setup type, time of day, account
- Correlation between biometric state and performance
- Most common rule deviations
- Patterns the user likely doesn't see themselves
- Delivered as a voice brief + Notion summary page

---

## Section 8 — Dashboard (PWA)

Accessible on Mac browser and iPhone as a Progressive Web App.

**Live session view:**
- Active account + rule profile loaded
- Current P&L vs daily limit (colour-coded)
- Trade count vs max
- Consecutive loss counter
- WHOOP HR + HRV live feed
- Jarvis status (armed / monitoring / intervening)
- Lockout status

**Historical:**
- Journal entries
- Weekly review summaries
- Biometric vs performance correlation charts

---

## Section 9 — Onboarding Flow

Runs once on first launch. Jarvis guides the user through every step via voice.

### Step 1 — Identity
Jarvis establishes the user's trading identity name (YAZDAQ / Bag Maker).

### Step 2 — Contexts
Confirms all ritual contexts:
- Trading (YAZDAQ Markets)
- Football
- Studying (Biology, IT, Finance, Stats)
- Content Creation (YouTube / Brand)
- General Deep Work

### Step 3 — Trading Rule Profiles
Jarvis walks through each account one by one — max daily loss, max contracts, max trades, restricted hours, consecutive loss limit, revenge trade cooldown. Repeats for all four accounts.

### Step 4 — Psychology Profile
- "What are your biggest trading demons?" → logged as priority flags for rules monitor
- "What does your best trading day look like mentally?" → builds personal green state profile used in visualization

### Step 5 — Anchor Cue Establishment (Trading)

Jarvis explains the science of kinesthetic anchoring (Pavlov / NLP). Criteria for a good anchor: unique, physical, repeatable, private.

Offers examples to spark ideas. User defines their own. Jarvis helps refine until the exact sequence is locked.

First conditioning rep fired during onboarding — visualization + anchor + confirmation.

Anchor conditioning tracked: Jarvis reminds user during early sessions (first 60 reps) that the highway is being built. Flags any anchor use outside trading context.

Separate anchors to be established in future sessions for other contexts (football, studying, content, deep work).

### Step 6 — Playlists
Three trading playlists defined: standard, activation (flat state), calm (anxious state). User provides Spotify/Apple Music links. Playlists reserved exclusively for their context.

### Step 7 — Connections (guided checklist)
- WHOOP API key
- Tradovate API credentials
- TradeLocker (Hero FX) API credentials
- Project X / Topstep (session auth)
- Tradesea / Lucid (session auth)
- Notion workspace
- Pushover (push notifications)
- Chrome extension install

Each connection shows a green tick on completion.

### Onboarding Complete
Jarvis confirms all systems armed and closes with a brief faith anchor + motivational send-off before the first session.

---

## Technology Stack Summary

| Layer | Technology |
|---|---|
| Backend runtime | Python 3.11+ |
| Hosting | Railway.app |
| AI brain | Claude API (Anthropic) — streaming |
| Speech-to-text | Deepgram Nova-2 — WebSocket streaming |
| Text-to-speech | ElevenLabs — WebSocket streaming |
| Screen capture | mss (Python library) |
| Vision analysis | Claude Vision API |
| Biometrics | WHOOP API (existing integration) |
| Trade journal | Notion API |
| Push notifications | Pushover |
| Browser lockout | Custom Chrome Extension (Manifest V3) |
| Broker integrations | Tradovate API, TradeLocker REST API |
| Dashboard | PWA (React or plain HTML/JS) |
| Local desktop agent | Python background process (Mac) |
| Inter-process comms | Local WebSocket (backend ↔ desktop agent ↔ Chrome extension) |

---

## Key Design Principles

1. **Setup once, run forever** — no manual server management, Railway handles all hosting
2. **Biometrics-first** — never just rely on what the user says; read the body
3. **Physically enforce, don't just warn** — lockout system is not advisory
4. **Ritual is mandatory** — no session arms without completing the ritual
5. **Adapt to state** — every response, every ritual phase, every message calibrated to current biometric + psychological state
6. **Faith and raw truth coexist** — both are tools; Jarvis knows which one the moment needs
7. **Rule profiles are king** — every intervention references the active account profile
8. **Journal everything** — including Jarvis interventions, overrides, and emotional state

---

## Out of Scope (v1)

- Automated trade execution (Jarvis observes and advises only — no algo trading)
- Android app (iPhone PWA covers mobile for v1)
- Other broker integrations beyond the four listed
- Social/sharing features

---

## Research References

- `docs/research/JARVIS_RITUAL_PROMPT.md` — Pre-performance ritual engine, flow state science, athlete protocols
- Dietrich (2003): Transient hypofrontality — movement downregulates prefrontal cortex
- Van der Linden et al. (2021): Flow neuroscience — dopaminergic and LC-NE systems
- Steven Kotler / Flow Genome Project: Five neurochemicals in flow state
- Pavlov (1897) / NLP Anchoring (Bandler/Grindler): Kinesthetic conditioning
