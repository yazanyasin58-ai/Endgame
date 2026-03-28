/**
 * Jarvis Lockout Extension — Content Script
 * Injected into all trading platform tabs.
 *
 * Handles SOFT_LOCK and HARD_LOCK overlay injection.
 */

(function () {
  "use strict";

  let currentOverlay = null;
  let lockTimer = null;

  // ── Overlay removal ──────────────────────────────────────────────────────────

  function removeOverlay() {
    if (currentOverlay) {
      currentOverlay.remove();
      currentOverlay = null;
    }
    if (lockTimer) {
      clearInterval(lockTimer);
      lockTimer = null;
    }
  }

  // ── Soft Lock ────────────────────────────────────────────────────────────────

  function showSoftLock(reason, durationSec = 30) {
    removeOverlay();

    const overlay = document.createElement("div");
    overlay.id = "jarvis-soft-lock";
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 2147483647;
      background: rgba(0,0,0,0.88);
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #fff;
    `;

    let remaining = durationSec;

    overlay.innerHTML = `
      <div style="max-width:520px; text-align:center; padding:40px;">
        <div style="font-size:11px; letter-spacing:3px; color:#888; margin-bottom:16px; text-transform:uppercase;">
          JARVIS
        </div>
        <div style="font-size:22px; font-weight:600; line-height:1.4; margin-bottom:12px; color:#f5f5f5;">
          ${reason || "Rule violation detected."}
        </div>
        <div id="jarvis-soft-timer" style="font-size:14px; color:#888; margin-bottom:36px;">
          Auto-dismissing in <span id="jarvis-countdown">${remaining}</span>s
        </div>
        <div style="display:flex; gap:12px; justify-content:center;">
          <button id="jarvis-standdown" style="
            padding:12px 28px; background:#ef4444; border:none; border-radius:6px;
            color:#fff; font-size:15px; font-weight:600; cursor:pointer; letter-spacing:0.5px;
          ">Stand down</button>
          <button id="jarvis-override" style="
            padding:12px 28px; background:transparent; border:1px solid #444; border-radius:6px;
            color:#888; font-size:13px; cursor:pointer;
          ">This was intentional</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    currentOverlay = overlay;

    // Countdown
    const countdownEl = overlay.querySelector("#jarvis-countdown");
    lockTimer = setInterval(() => {
      remaining--;
      if (countdownEl) countdownEl.textContent = remaining;
      if (remaining <= 0) {
        removeOverlay();
      }
    }, 1000);

    // Buttons
    overlay.querySelector("#jarvis-standdown").addEventListener("click", removeOverlay);
    overlay.querySelector("#jarvis-override").addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "OVERRIDE_LOGGED" });
      removeOverlay();
    });
  }

  // ── Hard Lock ────────────────────────────────────────────────────────────────

  const HARD_LOCK_IMAGES = [
    // Add absolute paths to hardlock images here (injected via extension URLs)
    // chrome.runtime.getURL("assets/hardlock-images/img1.jpg")
    // For now uses CSS gradient as placeholder until images are added
  ];

  const HARD_LOCK_MESSAGES = [
    "Someone right now would trade everything they have just to be in your position.",
    "Discipline is doing the right thing even when no one is watching. Especially then.",
    "The market will be here tomorrow. Make sure you are too.",
    "Your account is not a casino. Protect it.",
    "Al-Fatihah was revealed as a mercy. You are not alone in this. Come back to yourself.",
  ];

  function showHardLock(reason, durationSec = 900) {
    removeOverlay();

    const overlay = document.createElement("div");
    overlay.id = "jarvis-hard-lock";
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 2147483647;
      background: #000;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: #fff;
      pointer-events: all;
      user-select: none;
    `;

    const msgIndex = Math.floor(Math.random() * HARD_LOCK_MESSAGES.length);
    const message = HARD_LOCK_MESSAGES[msgIndex];

    let minutesLeft = Math.ceil(durationSec / 60);

    overlay.innerHTML = `
      <div style="max-width:560px; text-align:center; padding:60px 40px;">
        <div style="font-size:10px; letter-spacing:4px; color:#444; margin-bottom:32px; text-transform:uppercase;">
          LOCKED — JARVIS
        </div>

        <div id="jarvis-hard-reason" style="
          font-size:13px; color:#666; margin-bottom:24px; letter-spacing:0.5px;
        ">${reason || "Hard lockout triggered."}</div>

        <div style="
          font-size:20px; font-weight:400; line-height:1.7; color:#d4d4d4;
          margin-bottom:48px; font-style:italic;
        ">"${message}"</div>

        <div style="font-size:13px; color:#555; margin-bottom:8px;">Time remaining</div>
        <div id="jarvis-hard-timer" style="
          font-size:48px; font-weight:700; letter-spacing:2px; color:#fff;
          font-variant-numeric: tabular-nums;
        ">${formatTime(durationSec)}</div>

        <div style="margin-top:32px; font-size:12px; color:#333; letter-spacing:1px;">
          UNLOCK REQUIRES VOICE CHECK-IN + HR CHECK
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    currentOverlay = overlay;

    // Block all interaction with underlying page
    overlay.addEventListener("click", (e) => e.stopPropagation(), true);
    overlay.addEventListener("keydown", (e) => e.stopPropagation(), true);

    // Countdown
    let remaining = durationSec;
    const timerEl = overlay.querySelector("#jarvis-hard-timer");

    lockTimer = setInterval(() => {
      remaining--;
      if (timerEl) timerEl.textContent = formatTime(remaining);
      if (remaining <= 0) {
        // Timer expired — still locked until backend sends UNLOCK
        if (timerEl) timerEl.textContent = "00:00";
        const sub = overlay.querySelector("#jarvis-hard-reason");
        if (sub) sub.textContent = "Minimum time elapsed. Waiting for voice check-in.";
        clearInterval(lockTimer);
        lockTimer = null;
      }
    }, 1000);
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  }

  // ── Message listener ─────────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "SOFT_LOCK") {
      showSoftLock(msg.reason, msg.duration_sec || 30);
    } else if (msg.type === "HARD_LOCK") {
      showHardLock(msg.reason, msg.duration_sec || 900);
    } else if (msg.type === "UNLOCK") {
      removeOverlay();
    }
  });

})();
