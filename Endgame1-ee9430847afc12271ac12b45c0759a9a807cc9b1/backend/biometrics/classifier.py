from __future__ import annotations
from dataclasses import dataclass

from backend.core.state import BiometricState
from backend.biometrics.whoop import WhoopRecovery


@dataclass
class WhoopSnapshot:
    hr: int = 0
    hrv: float = 0.0
    recovery_score: int = 0
    sleep_performance: int = 0


def classify_state(recovery: WhoopRecovery | WhoopSnapshot) -> BiometricState:
    """
    GREEN  — Recovery ≥ 67%, HRV healthy, sleep ≥ 70%
    AMBER  — Recovery 40–66%, or mildly elevated HR, or poor sleep
    RED    — Recovery < 40%, very low HRV, or poor sleep + low recovery
    """
    if isinstance(recovery, WhoopRecovery):
        score = recovery.score
        sleep = recovery.sleep_performance_pct
        hrv = recovery.hrv_rmssd_milli
    else:
        score = recovery.recovery_score
        sleep = recovery.sleep_performance
        hrv = recovery.hrv

    if score >= 67 and sleep >= 70:
        return BiometricState.GREEN
    elif score >= 40:
        return BiometricState.AMBER
    else:
        return BiometricState.RED


def classify_from_scores(recovery: int, sleep: int) -> BiometricState:
    if recovery >= 67 and sleep >= 70:
        return BiometricState.GREEN
    elif recovery >= 40:
        return BiometricState.AMBER
    return BiometricState.RED


def get_ritual_track(state: BiometricState) -> str:
    """
    Returns ritual track name based on biometric state.
    GREEN → standard (~4 min)
    AMBER → extended with breathing (~7 min)
    RED   → deep reset (~12 min)
    """
    return {
        BiometricState.GREEN: "standard",
        BiometricState.AMBER: "extended",
        BiometricState.RED: "deep_reset",
        BiometricState.UNKNOWN: "standard",
    }[state]
