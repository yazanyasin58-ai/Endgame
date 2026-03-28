/**
 * Jarvis Lockout Extension — Service Worker (background.js)
 *
 * Connects to Desktop Agent at ws://localhost:7979
 * Receives lockout commands and forwards to content scripts in trading platform tabs.
 *
 * Messages from agent:
 *   { type: "SOFT_LOCK", reason: "...", duration_sec: 30 }
 *   { type: "HARD_LOCK", reason: "...", duration_sec: 900 }
 *   { type: "UNLOCK" }
 */

const AGENT_WS_URL = "ws://127.0.0.1:7979";
const TRADING_PLATFORMS = [
  "*://trader.tradovate.com/*",
  "*://*.tradovate.com/*",
  "*://app.tradelocker.com/*",
  "*://*.tradelocker.com/*",
  "*://*.topstepx.com/*",
  "*://*.projectx.com/*",
  "*://*.tradesea.io/*",
];

let ws = null;
let reconnectTimer = null;

function connect() {
  if (ws && ws.readyState === WebSocket.OPEN) return;

  ws = new WebSocket(AGENT_WS_URL);

  ws.onopen = () => {
    console.log("[Jarvis] Connected to Desktop Agent");
    if (reconnectTimer) clearInterval(reconnectTimer);
    reconnectTimer = null;
  };

  ws.onmessage = async (event) => {
    let data;
    try {
      data = JSON.parse(event.data);
    } catch {
      return;
    }

    const { type, reason, duration_sec } = data;

    if (type === "SOFT_LOCK" || type === "HARD_LOCK" || type === "UNLOCK") {
      // Broadcast to all active trading platform tabs
      const tabs = await chrome.tabs.query({ url: TRADING_PLATFORMS });
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, { type, reason, duration_sec }).catch(() => {});
      }
    }
  };

  ws.onclose = () => {
    console.log("[Jarvis] Agent disconnected — will retry");
    ws = null;
    if (!reconnectTimer) {
      reconnectTimer = setInterval(connect, 5000);
    }
  };

  ws.onerror = () => {
    ws = null;
  };
}

// Content script → background: log override events
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg.type === "OVERRIDE_LOGGED") {
    console.log("[Jarvis] Override logged from tab:", sender.tab?.url);
    // Forward override event to backend via agent WS
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "override_logged",
        url: sender.tab?.url,
        timestamp: Date.now(),
      }));
    }
  }
});

// Start connecting immediately
connect();
