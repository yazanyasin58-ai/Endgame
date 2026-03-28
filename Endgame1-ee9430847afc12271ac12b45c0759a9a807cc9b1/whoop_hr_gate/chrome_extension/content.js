async function checkGate() {
  try {
    const res = await fetch("http://127.0.0.1:8787/status", { cache: "no-store" });
    const data = await res.json();

    if (data.session_enabled === true && data.status === "BLOCK") {
      // Immediate kick-out
      window.location.href = chrome.runtime.getURL("cooldown.html");
    }
  } catch (e) {
    // If the local server is unreachable, do nothing (fail-open).
  }
}

// Check fast enough to feel instant, not so fast it burns CPU.
setInterval(checkGate, 1000);
checkGate();
