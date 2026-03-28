const STATUS_URL = "http://127.0.0.1:8787/status";

// Trading platforms — Jarvis enforcement targets
const BLOCK_URL_PATTERNS = [
  "*://trader.tradovate.com/*",
  "*://*.tradovate.com/*",
  "*://app.tradelocker.com/*",
  "*://*.tradelocker.com/*",
  "*://*.topstepx.com/*",
  "*://*.projectx.com/*",
  "*://*.tradesea.io/*"
];

let lastShouldBlock = null;

async function refreshStatusAndEnforce() {
  try {
    const res = await fetch(STATUS_URL, { cache: "no-store" });
    const data = await res.json();

    const shouldBlock = (data.session_enabled === true) && (data.status === "BLOCK");

    // 1) Update DNR ruleset for future requests
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      enableRulesetIds: shouldBlock ? ["ruleset_1"] : [],
      disableRulesetIds: shouldBlock ? [] : ["ruleset_1"]
    });

    // 2) If we just transitioned into BLOCK, immediately redirect open tabs
    if (shouldBlock && lastShouldBlock !== true) {
      const tabs = await chrome.tabs.query({ url: BLOCK_URL_PATTERNS });
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("cooldown.html") });
        }
      }
    }

    lastShouldBlock = shouldBlock;
  } catch (e) {
    // If the local server is down, fail-open:
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: ["ruleset_1"]
    });
    lastShouldBlock = null;
  }
}

setInterval(refreshStatusAndEnforce, 1000);
refreshStatusAndEnforce();
