import json
import time
import threading
import webbrowser
import asyncio
from urllib.parse import urlencode
import csv
from datetime import datetime
from zoneinfo import ZoneInfo

import requests
from flask import Flask, request, jsonify
from bleak import BleakClient

WHOOP_AUTH_URL = "https://api.prod.whoop.com/oauth/oauth2/auth"
WHOOP_TOKEN_URL = "https://api.prod.whoop.com/oauth/oauth2/token"
WHOOP_API_BASE = "https://api.prod.whoop.com/developer"

TOKENS_FILE = "tokens.json"

# BLE live HR config
WHOOP_BLE_ADDRESS = "CC:06:C6:D6:E4:D0"
HR_MEASUREMENT_UUID = "00002a37-0000-1000-8000-00805f9b34fb"

app = Flask(__name__)

state = {
    "tokens": None,
    "status": "ALLOW",
    "last_hr_bpm": None,
    "last_source": None,
    "last_updated": None,
    "ble_ok": False,
    "blocked_since": None,
    "cooldown_started": None,
    "cooldown_unlock_after": None,
    "last_logged_status": None,
    "last_sample_unix": 0,

}


# -----------------------------
# Config + Tokens
# -----------------------------
def load_config():
    with open("config.json", "r", encoding="utf-8") as f:
        return json.load(f)


def save_tokens(tokens):
    with open(TOKENS_FILE, "w", encoding="utf-8") as f:
        json.dump(tokens, f, indent=2)


def load_tokens():
    try:
        with open(TOKENS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return None


# -----------------------------
# WHOOP OAuth + API
# -----------------------------
def build_auth_url(cfg):
    scopes = ["read:cycles", "read:workout", "offline"]
    params = {
        "client_id": cfg["client_id"],
        "response_type": "code",
        "redirect_uri": cfg["redirect_uri"],
        "scope": " ".join(scopes),
        "state": "HRGATE0001"
    }
    return f"{WHOOP_AUTH_URL}?{urlencode(params)}"


def exchange_code_for_tokens(cfg, code):
    data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": cfg["redirect_uri"],
        "client_id": cfg["client_id"],
        "client_secret": cfg["client_secret"]
    }
    r = requests.post(WHOOP_TOKEN_URL, data=data, timeout=20)
    r.raise_for_status()
    return r.json()


def refresh_tokens(cfg, refresh_token):
    data = {
        "grant_type": "refresh_token",
        "refresh_token": refresh_token,
        "client_id": cfg["client_id"],
        "client_secret": cfg["client_secret"]
    }
    r = requests.post(WHOOP_TOKEN_URL, data=data, timeout=20)
    r.raise_for_status()
    return r.json()


def whoop_get(cfg, path):
    if not state["tokens"]:
        raise RuntimeError("Not authenticated")

    access_token = state["tokens"]["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}
    url = f"{WHOOP_API_BASE}{path}"

    r = requests.get(url, headers=headers, timeout=20)

    if r.status_code == 401 and state["tokens"].get("refresh_token"):
        new_tokens = refresh_tokens(cfg, state["tokens"]["refresh_token"])
        state["tokens"] = new_tokens
        save_tokens(new_tokens)
        headers = {"Authorization": f"Bearer {new_tokens['access_token']}"}
        r = requests.get(url, headers=headers, timeout=20)

    r.raise_for_status()
    return r.json()


def get_latest_cycle_avg_hr(cfg):
    data = whoop_get(cfg, "/v2/cycle?limit=10")
    recs = data.get("records", [])
    for r in recs:
        if r.get("score_state") == "SCORED" and r.get("score", {}).get("average_heart_rate") is not None:
            return r["score"]["average_heart_rate"]
    return None


def get_latest_workout_avg_hr(cfg):
    data = whoop_get(cfg, "/v2/activity/workout?limit=10")
    recs = data.get("records", [])
    for r in recs:
        if r.get("score_state") == "SCORED" and r.get("score", {}).get("average_heart_rate") is not None:
            return r["score"]["average_heart_rate"]
    return None


# -----------------------------
# Thresholding
# -----------------------------
def effective_threshold(cfg):
    base = int(cfg.get("base_threshold_bpm", 100))
    mode = cfg.get("mode", "normal")
    offset = int(cfg.get("modes", {}).get(mode, {}).get("threshold_offset", 0))
    return base + offset


# -----------------------------
# BLE Live HR
# -----------------------------
def parse_hr(data: bytearray) -> int:
    flags = data[0]
    hr_16bit = flags & 0x01
    if hr_16bit:
        return int(data[1] | (data[2] << 8))
    return int(data[1])


async def ble_hr_loop():
    try:
        async with BleakClient(WHOOP_BLE_ADDRESS, timeout=30.0) as client:
            if not client.is_connected:
                raise RuntimeError("BLE connection failed")

            state["ble_ok"] = True

            def on_hr(_, data: bytearray):
                hr = parse_hr(data)
                state["last_hr_bpm"] = hr
                state["last_source"] = "ble_live_hr"
                state["last_updated"] = int(time.time())

            await client.start_notify(HR_MEASUREMENT_UUID, on_hr)

            while True:
                await asyncio.sleep(1)

    except Exception as e:
        # If BLE dies, we mark it and allow fallback to WHOOP API.
        state["ble_ok"] = False
        state["last_source"] = f"ble_error:{type(e).__name__}"
        state["last_updated"] = int(time.time())


def run_ble_thread():
    # Run BLE loop in its own event loop/thread so Flask can run normally.
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    loop.run_until_complete(ble_hr_loop())

def now_unix() -> int:
    return int(time.time())


def within_time_window(cfg) -> bool:
    tz_name = cfg.get("timezone", "America/New_York")
    tz = ZoneInfo(tz_name)
    now = datetime.now(tz)

    day = now.strftime("%a").upper()[:3]  # MON, TUE...
    hm = now.strftime("%H:%M")

    windows = cfg.get("time_windows", [])
    if not windows:
        return True  # if no windows configured, always allow gating

    for w in windows:
        if day in w.get("days", []) and w["start"] <= hm <= w["end"]:
            return True
    return False

def log_sample(cfg):
    path = cfg.get("log_file", "gate_log.csv")

    row = {
        "ts_utc": datetime.utcnow().isoformat(),
        "status": state.get("status"),
        "hr_bpm": state.get("last_hr_bpm"),
        "threshold_bpm": effective_threshold(cfg),
        "mode": cfg.get("mode", "normal"),
        "session_enabled": cfg.get("session_enabled", True),
        "source": state.get("last_source"),
        "ble_ok": state.get("ble_ok", False),
        "blocked_since_unix": state.get("blocked_since"),
        "cooldown_started_unix": state.get("cooldown_started"),
        "cooldown_unlock_after_unix": state.get("cooldown_unlock_after"),
    }

    file_exists = False
    try:
        with open(path, "r", encoding="utf-8") as _:
            file_exists = True
    except FileNotFoundError:
        pass

    with open(path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=row.keys())
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)

def log_status_change(cfg, hr, threshold):
    path = cfg.get("log_file", "gate_log.csv")
    row = {
        "ts_utc": datetime.utcnow().isoformat(),
        "status": state.get("status"),
        "hr_bpm": hr,
        "threshold_bpm": threshold,
        "mode": cfg.get("mode", "normal"),
        "session_enabled": cfg.get("session_enabled", True),
        "source": state.get("last_source"),
        "ble_ok": state.get("ble_ok", False)
    }

    file_exists = False
    try:
        with open(path, "r", encoding="utf-8") as _:
            file_exists = True
    except FileNotFoundError:
        pass

    with open(path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=row.keys())
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)

def log_event(cfg, event_type, details=None):
    path = cfg.get("event_log_file", "gate_events.csv")
    details = details or {}

    row = {
        "ts_utc": datetime.utcnow().isoformat(),
        "event": event_type,
        "hr_bpm": state.get("last_hr_bpm"),
        "threshold_bpm": effective_threshold(cfg),
        "mode": cfg.get("mode", "normal"),
        "session_enabled": cfg.get("session_enabled", True),
        "source": state.get("last_source"),
        "ble_ok": state.get("ble_ok", False),
        **details
    }

    file_exists = False
    try:
        with open(path, "r", encoding="utf-8") as _:
            file_exists = True
    except FileNotFoundError:
        pass

    with open(path, "a", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=row.keys())
        if not file_exists:
            writer.writeheader()
        writer.writerow(row)


# -----------------------------
# Gating Loop
# -----------------------------
def poll_loop():
    while True:
        cfg = load_config()
        threshold = effective_threshold(cfg)

        # Enforce mode expiration
        expires_at = cfg.get("mode_expires_at_unix")
        if expires_at is not None and now_unix() >= int(expires_at):
            cfg["mode"] = "normal"
            cfg["mode_expires_at_unix"] = None
            with open("config.json", "w", encoding="utf-8") as f:
                 json.dump(cfg, f, indent=2)

        # 1) Session OFF => always allow
        if not cfg.get("session_enabled", True):
            state["status"] = "ALLOW"
            state["blocked_since"] = None
            state["cooldown_started"] = None
            state["cooldown_unlock_after"] = None
            state["last_source"] = "session_disabled"
            state["last_updated"] = now_unix()
            time.sleep(int(cfg.get("poll_seconds", 3)))
            continue

        # 2) Outside time windows => BLOCK (no trading outside scheduled hours)
        if not within_time_window(cfg):
            state["status"] = "BLOCK"
            state["blocked_since"] = state.get("blocked_since") or now_unix()
            state["cooldown_started"] = None
            state["cooldown_unlock_after"] = None
            state["last_source"] = "outside_time_window_block"
            state["last_updated"] = now_unix()
            time.sleep(int(cfg.get("poll_seconds", 3)))
            continue


        # 3) Get HR (prefer BLE)
        hr = state.get("last_hr_bpm")
        last_upd = state.get("last_updated")
        stale_seconds = int(cfg.get("ble_stale_seconds", 10))
        is_stale = (last_upd is None) or (now_unix() - int(last_upd) > stale_seconds)

        # BLE missing or stale => fallback to WHOOP scored records
        if (not state.get("ble_ok", False)) or (hr is None) or is_stale:
            hr = None
            if cfg.get("use_workout_if_available", True):
                hr = get_latest_workout_avg_hr(cfg)
                if hr is not None:
                    state["last_source"] = "workout_avg_hr"

            if hr is None:
                hr = get_latest_cycle_avg_hr(cfg)
                if hr is not None:
                    state["last_source"] = "cycle_avg_hr"

            if hr is not None:
                state["last_hr_bpm"] = hr
                state["last_updated"] = now_unix()

        # If still no HR, fail-open
        if hr is None:
            state["status"] = "ALLOW"
            state["last_source"] = state.get("last_source") or "no_hr_data"
            state["last_updated"] = now_unix()
            time.sleep(int(cfg.get("poll_seconds", 3)))
            continue

        # 4) Cooldown + gating logic
        should_block = hr > threshold

        cooldown_required = int(cfg.get("cooldown_required_seconds", 15))
        breaths_required = int(cfg.get("cooldown_breaths_required", 0))
        breath_sec = int(cfg.get("cooldown_breath_seconds_per_breath", 10))
        breathing_delay = breaths_required * breath_sec

        if should_block:
            # Enter/maintain BLOCK
            if state.get("blocked_since") is None:
                state["blocked_since"] = now_unix()

            state["status"] = "BLOCK"
            state["cooldown_started"] = None
            state["cooldown_unlock_after"] = None

        else:
            # HR is below threshold: start/continue cooldown timer
            if state.get("blocked_since") is not None:
                # Only relevant if we were blocked at some point
                if state.get("cooldown_started") is None:
                    state["cooldown_started"] = now_unix()
                    state["cooldown_unlock_after"] = (
                        state["cooldown_started"] + cooldown_required + breathing_delay
                    )

                if now_unix() >= int(state["cooldown_unlock_after"]):
                    # Cooldown satisfied: unlock
                    state["status"] = "ALLOW"
                    state["blocked_since"] = None
                    state["cooldown_started"] = None
                    state["cooldown_unlock_after"] = None
                else:
                    # Still cooling down: remain blocked
                    state["status"] = "BLOCK"
            else:
                # Never blocked in this session: allow normally
                state["status"] = "ALLOW"

        state["last_hr_bpm"] = hr
        state["last_updated"] = now_unix()

        # 5) Log events on status transitions
        prev_status = state.get("last_logged_status")

        if prev_status != state["status"]:
            if state["status"] == "BLOCK":
                log_event(cfg, "BLOCK_ENTER")
            else:
                log_event(cfg, "ALLOW_ENTER")

            # Optional: keep legacy status-change log
            log_status_change(cfg, hr, threshold)

            state["last_logged_status"] = state["status"]

        # 6) Periodic sampling (time-series logging)
        sample_every = int(cfg.get("log_sample_seconds", 5))
        last_sample = state.get("last_sample_unix", 0)

        if now_unix() - int(last_sample) >= sample_every:
            log_sample(cfg)
            state["last_sample_unix"] = now_unix()

        time.sleep(int(cfg.get("poll_seconds", 3)))



# -----------------------------
# Flask Routes
# -----------------------------
@app.route("/callback")
def callback():
    code = request.args.get("code")
    if not code:
        return "Missing code", 400

    cfg = load_config()
    tokens = exchange_code_for_tokens(cfg, code)
    state["tokens"] = tokens
    save_tokens(tokens)
    return "Authenticated. You can close this tab."


@app.route("/status")
def status():
    cfg = load_config()
    return jsonify({
        "status": state["status"],
        "hr_bpm": state["last_hr_bpm"],
        "source": state["last_source"],
        "threshold_bpm": effective_threshold(cfg),
        "mode": cfg.get("mode", "normal"),
        "session_enabled": cfg.get("session_enabled", True),
        "ble_ok": state.get("ble_ok", False),
        "last_updated_unix": state["last_updated"]
    })


@app.route("/session/on", methods=["POST"])
def session_on():
    cfg = load_config()
    cfg["session_enabled"] = True
    cfg["session_enabled_at_unix"] = int(time.time())
    with open("config.json", "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)
    return jsonify({"ok": True, "session_enabled": True})


@app.route("/session/off", methods=["POST"])
def session_off():
    cfg = load_config()
    cfg["session_enabled"] = False
    with open("config.json", "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)
    return jsonify({"ok": True, "session_enabled": False})

@app.route("/mode", methods=["GET"])
def get_mode():
    cfg = load_config()
    return jsonify({
        "mode": cfg.get("mode", "normal"),
        "available_modes": list(cfg.get("modes", {}).keys())
    })


@app.route("/mode/<mode_name>", methods=["POST"])
def set_mode(mode_name):
    cfg = load_config()
    modes = cfg.get("modes", {})

    if mode_name not in modes:
        return jsonify({
            "ok": False,
            "error": f"Unknown mode '{mode_name}'.",
            "available_modes": list(modes.keys())
        }), 400

    cfg["mode"] = mode_name

    # Set expiration for non-normal modes
    if mode_name != "normal":
        max_minutes = int(cfg.get("mode_max_duration_minutes", 240))
        cfg["mode_expires_at_unix"] = int(time.time()) + (max_minutes * 60)
    else:
        cfg["mode_expires_at_unix"] = None

    with open("config.json", "w", encoding="utf-8") as f:
        json.dump(cfg, f, indent=2)

    return jsonify({
        "ok": True,
        "mode": mode_name,
        "expires_at_unix": cfg["mode_expires_at_unix"]
    })

# -----------------------------
# Main
# -----------------------------
def main():
    cfg = load_config()

    cached = load_tokens()
    if cached:
        state["tokens"] = cached
    else:
        url = build_auth_url(cfg)
        print("Authorize WHOOP here:\n", url)
        webbrowser.open(url)

    # Start BLE listener thread
    ble_t = threading.Thread(target=run_ble_thread, daemon=True)
    ble_t.start()

    # Start gating loop
    gate_t = threading.Thread(target=poll_loop, daemon=True)
    gate_t.start()

    # Run server
    app.run(host="127.0.0.1", port=8787, debug=False)


if __name__ == "__main__":
    main()

