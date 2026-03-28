from __future__ import annotations
import asyncio
from dataclasses import dataclass, field
from enum import Enum

from backend.core.state import BiometricState, update_session
from backend.biometrics.classifier import get_ritual_track


class RitualPhase(str, Enum):
    BIOMETRIC_SCAN = "phase_0_biometric_scan"
    COLD_WATER = "phase_1_cold_water"
    ENVIRONMENT = "phase_2_environment"
    PLAYLIST = "phase_3_playlist"
    PHYSICAL = "phase_4_physical"
    BREATHING = "phase_4a_breathing"
    VISUALIZATION = "phase_5_visualization"
    ANCHOR_CUE = "phase_6_anchor_cue"
    COMPLETE = "complete"
    EMERGENCY = "emergency"


@dataclass
class PhaseConfig:
    name: str
    instruction: str
    wait_for_confirmation: bool = True
    duration_sec: int | None = None  # timed phases (breathing, visualization)


# Phase scripts keyed by (phase, track)
PHASE_SCRIPTS: dict[tuple[RitualPhase, str], PhaseConfig] = {

    (RitualPhase.COLD_WATER, "standard"): PhaseConfig(
        name="Physiological break",
        instruction=(
            "Cold water. Face, neck, wrists. 30 seconds. This spikes norepinephrine — "
            "it sharpens focus. Go now and come back when done."
        ),
    ),
    (RitualPhase.COLD_WATER, "extended"): PhaseConfig(
        name="Physiological break",
        instruction=(
            "Your recovery is moderate today. Cold water — more thorough. "
            "Face, neck, wrists, forearms. 60 seconds. Go."
        ),
    ),
    (RitualPhase.COLD_WATER, "deep_reset"): PhaseConfig(
        name="Physiological break",
        instruction=(
            "Recovery is low today. Cold shower if possible — full 90 seconds. "
            "If not, cold water full face submersion. This is non-negotiable. "
            "Your body needs the reset before we go further."
        ),
    ),

    (RitualPhase.ENVIRONMENT, "standard"): PhaseConfig(
        name="Environment setup",
        instruction=(
            "Set up the workspace. Same configuration every session — your signal to your nervous "
            "system that it's time to perform. Charts up, order platform open, phone on Do Not "
            "Disturb, water on the desk. Tell me when ready."
        ),
    ),
    (RitualPhase.ENVIRONMENT, "extended"): PhaseConfig(
        name="Environment setup",
        instruction=(
            "Workspace setup. Everything in its place. This environmental order signals internal order. "
            "Take your time — don't rush this part. Tell me when everything is set."
        ),
    ),
    (RitualPhase.ENVIRONMENT, "deep_reset"): PhaseConfig(
        name="Environment setup",
        instruction=(
            "Workspace setup. Move slowly. No rushing today — your body is depleted and rushing "
            "signals threat. Take 5 minutes on this. Everything in its exact place. Tell me when done."
        ),
    ),

    (RitualPhase.PLAYLIST, "standard"): PhaseConfig(
        name="Auditory anchor",
        instruction="Start your trading playlist. This context anchor is for trading only — never elsewhere. Let it run.",
        wait_for_confirmation=False,
        duration_sec=5,
    ),
    (RitualPhase.PLAYLIST, "extended"): PhaseConfig(
        name="Auditory anchor",
        instruction="Start your calm trading playlist. Lower BPM today — your system needs steady, not activated.",
        wait_for_confirmation=False,
        duration_sec=5,
    ),
    (RitualPhase.PLAYLIST, "deep_reset"): PhaseConfig(
        name="Auditory anchor",
        instruction="Ambient playlist only today. No beats, no activation. You need calm first.",
        wait_for_confirmation=False,
        duration_sec=5,
    ),

    (RitualPhase.PHYSICAL, "standard"): PhaseConfig(
        name="Physical calibration",
        instruction=(
            "50 push-ups. Then a 2-minute walk. This induces transient hypofrontality — "
            "it shuts down the overthinking prefrontal cortex. Go. Tell me when done."
        ),
    ),
    (RitualPhase.PHYSICAL, "extended"): PhaseConfig(
        name="Physical calibration",
        instruction=(
            "Rhythmic movement — 3 minutes. Jump rope, jumping jacks, or a brisk walk. "
            "Rhythmic over intense today. Keep breathing controlled. Tell me when done."
        ),
    ),
    (RitualPhase.PHYSICAL, "deep_reset"): PhaseConfig(
        name="Physical calibration",
        instruction=(
            "Light movement only — a slow 5-minute walk. No intensity. "
            "Your body is red today — pushing it will backfire. Gentle movement, controlled breath. "
            "Tell me when done."
        ),
    ),

    (RitualPhase.BREATHING, "extended"): PhaseConfig(
        name="Box breathing",
        instruction=(
            "Box breathing. Inhale 4 counts. Hold 4. Exhale 4. Hold 4. "
            "I'll guide three rounds. Ready? Inhale... 2... 3... 4... "
            "Hold... 2... 3... 4... Exhale... 2... 3... 4... Hold... 2... 3... 4... "
            "Again. Inhale... 2... 3... 4... Hold... 2... 3... 4... "
            "Exhale... 2... 3... 4... Hold... 2... 3... 4... "
            "One more. Inhale... 2... 3... 4... Hold... 2... 3... 4... "
            "Exhale... 2... 3... 4... Hold... 2... 3... 4. "
            "Good. Tell me how that felt."
        ),
        duration_sec=90,
    ),
    (RitualPhase.BREATHING, "deep_reset"): PhaseConfig(
        name="Extended calm + body scan",
        instruction=(
            "Eyes closed. Slow your breathing down — no counts, just slow. "
            "Scan from the top of your head down. Release tension as you find it — jaw, shoulders, chest, hands. "
            "Take 3 minutes. I'll be here. Just breathe. "
            "Allah is Al-Razzaq. Your rizq is written. Nothing today changes that. "
            "Breathe. Scan. Release. Tell me when you're ready."
        ),
        duration_sec=180,
    ),

    (RitualPhase.VISUALIZATION, "standard"): PhaseConfig(
        name="Visualization",
        instruction=(
            "Eyes closed. 2 minutes. See yourself at the platform. "
            "Setup appears — clean, clear. You see it, you assess it, you enter with precision. "
            "Size is correct. Stop is placed. You sit with it. "
            "Price moves in your favour — you manage it according to the plan. No deviations. "
            "Then it ends — win or loss — and you're calm either way. "
            "You are YAZDAQ. You execute. You don't chase. You don't revenge. You don't force. "
            "See it. Lock it in. Tell me when you've run through it."
        ),
        duration_sec=120,
    ),
    (RitualPhase.VISUALIZATION, "extended"): PhaseConfig(
        name="Visualization",
        instruction=(
            "Eyes closed. 3 minutes. Deeper than usual today. "
            "See the workspace. Feel the chair. Hear the platform sounds. "
            "Setup appears — take your time seeing it clearly. "
            "You enter with precision. Correct size. Stop placed. You sit with patience. "
            "The outcome is secondary to the process. You are not attached to P&L. "
            "You are attached to execution quality. See that. "
            "Faith anchor: Tawakkul. You've done the preparation. The outcome is not yours to control. "
            "Tell me when you're ready."
        ),
        duration_sec=180,
    ),
    (RitualPhase.VISUALIZATION, "deep_reset"): PhaseConfig(
        name="Visualization",
        instruction=(
            "Eyes closed. 4 minutes. You need this one. "
            "Breathe first — slow and deliberate. Let everything from the last hour go. "
            "See yourself calm. Centred. In control. Not because the market is easy, "
            "but because you are disciplined. "
            "Your account is protected. Your rules are clear. Your only job is to execute them. "
            "Faith reset: Allah is Al-Razzaq. Your rizq is written. No trade today adds or removes "
            "what is already yours. Trade with that freedom. "
            "See one clean execution. Just one. See it clearly. Tell me when done."
        ),
        duration_sec=240,
    ),

    (RitualPhase.ANCHOR_CUE, "standard"): PhaseConfig(
        name="Anchor cue",
        instruction="Fire your trading anchor cue now. Slow. Deliberate. Full intention.",
        wait_for_confirmation=False,
        duration_sec=8,
    ),
    (RitualPhase.ANCHOR_CUE, "extended"): PhaseConfig(
        name="Anchor cue",
        instruction="Slower today. Fire your anchor cue with full presence. Let the state settle before you open the platform.",
        wait_for_confirmation=False,
        duration_sec=12,
    ),
    (RitualPhase.ANCHOR_CUE, "deep_reset"): PhaseConfig(
        name="Anchor cue",
        instruction="Deliberate. This anchor holds everything you've built. Fire it with full intention. Take your time.",
        wait_for_confirmation=False,
        duration_sec=15,
    ),
}

EMERGENCY_SCRIPT = (
    "Emergency protocol. We have less than 10 minutes. "
    "Cold water — 30 seconds, now. "
    "Then 20 push-ups — go. "
    "One breath visualization: see one clean entry. One. "
    "Fire your anchor cue. "
    "I'm arming the session. But YAZDAQ — build 40 minutes in next session. "
    "This compressed version is not the standard."
)


@dataclass
class RitualResult:
    completed: bool
    track: str
    biometric_state: BiometricState
    baseline_captured: bool


class RitualEngine:
    def __init__(self):
        self._jarvis = None
        self._biometric_monitor = None

    def set_jarvis(self, jarvis, biometric_monitor):
        self._jarvis = jarvis
        self._biometric_monitor = biometric_monitor

    async def start_ritual(self, available_minutes: int = 40) -> RitualResult:
        from backend.biometrics.classifier import classify_state

        # Phase 0 — Biometric baseline scan
        await self._say(
            "Starting ritual. Pulling your biometric state from WHOOP now.",
            tone="calm_authority",
        )

        pre_session = {}
        biometric_state = BiometricState.UNKNOWN
        if self._biometric_monitor:
            pre_session = await self._biometric_monitor.get_pre_session_summary()
            biometric_state = pre_session.get("state", BiometricState.UNKNOWN)

        track = get_ritual_track(biometric_state)

        # Announce state
        await self._announce_state(biometric_state, pre_session)

        # Emergency protocol if under 10 minutes
        if available_minutes < 10:
            await self._run_emergency()
            return await self._complete(track, biometric_state)

        # Full ritual — phases 1–6
        phases = self._get_phases(track)
        for phase in phases:
            config = PHASE_SCRIPTS.get((phase, track)) or PHASE_SCRIPTS.get((phase, "standard"))
            if not config:
                continue
            await self._run_phase(phase, config)

        return await self._complete(track, biometric_state)

    def _get_phases(self, track: str) -> list[RitualPhase]:
        phases = [
            RitualPhase.COLD_WATER,
            RitualPhase.ENVIRONMENT,
            RitualPhase.PLAYLIST,
            RitualPhase.PHYSICAL,
        ]
        if track in ("extended", "deep_reset"):
            phases.append(RitualPhase.BREATHING)
        phases += [RitualPhase.VISUALIZATION, RitualPhase.ANCHOR_CUE]
        return phases

    async def _run_phase(self, phase: RitualPhase, config: PhaseConfig):
        await self._say(config.instruction, tone="calm_authority")
        if config.duration_sec:
            await asyncio.sleep(config.duration_sec)
        elif config.wait_for_confirmation:
            await self._wait_confirmation(phase.value)

    async def _run_emergency(self):
        await self._say(EMERGENCY_SCRIPT, tone="calm_authority")
        await asyncio.sleep(120)  # 2 min for the compressed protocol

    async def _announce_state(self, state: BiometricState, data: dict):
        messages = {
            BiometricState.GREEN: (
                f"Green state. Recovery {data.get('recovery', '?')}%, "
                f"HRV {data.get('hrv', '?'):.0f}ms, "
                f"sleep {data.get('sleep', '?')}%. "
                "Standard protocol. You're primed."
            ),
            BiometricState.AMBER: (
                f"Amber state. Recovery {data.get('recovery', '?')}%. "
                "Extended protocol with breathing work today. "
                "Trade with reduced size if in doubt."
            ),
            BiometricState.RED: (
                f"Red state. Recovery {data.get('recovery', '?')}%. "
                "Deep reset protocol. This takes 12 minutes minimum. "
                "Consider trading lighter today — your body is telling you something."
            ),
            BiometricState.UNKNOWN: (
                "WHOOP data unavailable. Running standard protocol. "
                "Check your WHOOP connection after the session."
            ),
        }
        await self._say(messages.get(state, messages[BiometricState.UNKNOWN]), tone="calm_authority")

    async def _complete(self, track: str, state: BiometricState) -> RitualResult:
        # Capture biometric baseline
        baseline_captured = False
        if self._biometric_monitor:
            recovery = await self._biometric_monitor.capture_baseline()
            baseline_captured = recovery is not None

        # Arm session
        update_session(ritual_complete=True)
        from backend.core.session import session_manager
        session_manager.arm_session()

        await self._say(
            "You're locked in. Screen monitoring armed. Voice monitoring armed. Biometrics armed. Begin.",
            tone="calm_authority",
        )

        return RitualResult(
            completed=True,
            track=track,
            biometric_state=state,
            baseline_captured=baseline_captured,
        )

    async def _say(self, text: str, tone: str = "calm_authority"):
        if self._jarvis:
            await self._jarvis.say(text, tone)
        else:
            print(f"[Ritual] {text}")

    async def _wait_confirmation(self, phase_name: str):
        """In production this awaits a voice 'ready' or 'done' from the user via VoicePipeline."""
        print(f"[Ritual] Waiting for confirmation: {phase_name}")
        await asyncio.sleep(3)  # Minimal wait — voice pipeline handles real confirmation


# Module-level singleton
ritual_engine = RitualEngine()
