from __future__ import annotations
import asyncio

from backend.biometrics.whoop import whoop_client, WhoopRecovery
from backend.biometrics.classifier import classify_state
from backend.core.state import get_session, update_session, BiometricState

POLL_INTERVAL_SEC = 60  # WHOOP API does not stream live HR — best available is ~1min


class BiometricMonitor:
    """
    Polls WHOOP API every 60s during session.
    Fires Jarvis interventions on threshold breaches vs session baseline.
    """

    def __init__(self):
        self._task: asyncio.Task | None = None
        self._jarvis = None  # injected after startup to avoid circular imports

    def set_jarvis(self, jarvis):
        self._jarvis = jarvis

    async def capture_baseline(self) -> WhoopRecovery | None:
        """Call this at end of ritual Phase 6 to set session baseline."""
        recovery = await whoop_client.get_latest_recovery()
        if recovery:
            state = classify_state(recovery)
            update_session(
                biometric_state=state,
                baseline_hr=recovery.resting_heart_rate,
                baseline_hrv=recovery.hrv_rmssd_milli,
                recovery_score=recovery.score,
                sleep_performance=recovery.sleep_performance_pct,
                current_hr=recovery.resting_heart_rate,
                current_hrv=recovery.hrv_rmssd_milli,
            )
            print(f"[Biometrics] Baseline captured — Recovery: {recovery.score}% | "
                  f"HRV: {recovery.hrv_rmssd_milli:.1f}ms | "
                  f"State: {state}")
        return recovery

    async def get_pre_session_summary(self) -> dict:
        """Called at start of ritual for Phase 0 biometric scan."""
        recovery = await whoop_client.get_latest_recovery()
        cycle = await whoop_client.get_current_cycle()

        result = {}
        if recovery:
            state = classify_state(recovery)
            result = {
                "state": state,
                "recovery": recovery.score,
                "hrv": recovery.hrv_rmssd_milli,
                "resting_hr": recovery.resting_heart_rate,
                "sleep": recovery.sleep_performance_pct,
                "strain": cycle.strain if cycle else 0,
            }
        return result

    async def start(self):
        if self._task and not self._task.done():
            return
        self._task = asyncio.create_task(self._monitor_loop())
        print("[Biometrics] Live monitoring started (60s poll)")

    async def stop(self):
        if self._task:
            self._task.cancel()
            self._task = None

    async def _monitor_loop(self):
        while True:
            await asyncio.sleep(POLL_INTERVAL_SEC)
            session = get_session()
            if not session.session_armed:
                continue
            try:
                await self._check_live_state()
            except Exception as e:
                print(f"[Biometrics] Poll error: {e}")

    async def _check_live_state(self):
        session = get_session()
        recovery = await whoop_client.get_latest_recovery()
        if not recovery:
            return

        from backend.rules.engine import rules_engine
        violations = rules_engine.evaluate_biometric(
            hr=recovery.resting_heart_rate,
            hrv=recovery.hrv_rmssd_milli,
        )

        # Update state
        new_state = classify_state(recovery)
        update_session(
            biometric_state=new_state,
            current_hr=recovery.resting_heart_rate,
            current_hrv=recovery.hrv_rmssd_milli,
        )

        # Fire interventions
        if self._jarvis and violations:
            for v in violations:
                await self._jarvis.say(v.message, tone=v.tone)


# Module-level singleton
biometric_monitor = BiometricMonitor()
