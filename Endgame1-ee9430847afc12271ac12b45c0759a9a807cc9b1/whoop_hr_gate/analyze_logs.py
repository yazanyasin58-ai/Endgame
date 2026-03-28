import csv
import os
import json
from datetime import datetime, timezone
from collections import defaultdict
from zoneinfo import ZoneInfo

EVENTS_FILE_DEFAULT = "gate_events.csv"
SAMPLES_FILE_DEFAULT = "gate_log.csv"
LOCAL_TZ = ZoneInfo("America/New_York")

def parse_iso(ts: str) -> datetime:
    # Supports "2025-12-18T07:12:34.123456" (no timezone) by treating it as UTC.
    # Your logger uses datetime.utcnow().isoformat(), which is UTC but timezone-naive.
    dt = datetime.fromisoformat(ts)
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt


def read_csv_rows(path: str):
    with open(path, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        return list(reader)


def safe_int(x, default=None):
    try:
        if x is None:
            return default
        x = str(x).strip()
        if x == "" or x.lower() == "none" or x.lower() == "null":
            return default
        return int(float(x))
    except Exception:
        return default


def fmt_seconds(sec: int) -> str:
    if sec is None:
        return "N/A"
    m, s = divmod(sec, 60)
    h, m = divmod(m, 60)
    if h:
        return f"{h}h {m}m {s}s"
    if m:
        return f"{m}m {s}s"
    return f"{s}s"

def hhmm_to_minutes(hhmm: str) -> int:
    h, m = hhmm.split(":")
    return int(h) * 60 + int(m)

def compute_window_seconds_for_day(cfg, day_str: str) -> int:
    # day_str is YYYY-MM-DD in LOCAL_TZ
    # Convert to weekday code (MON/TUE/...)
    dt = datetime.fromisoformat(day_str).replace(tzinfo=LOCAL_TZ)
    wd = dt.strftime("%a").upper()[:3]

    total = 0
    for w in cfg.get("time_windows", []):
        if wd in w.get("days", []):
            start = hhmm_to_minutes(w["start"])
            end = hhmm_to_minutes(w["end"])
            if end >= start:
                total += (end - start) * 60
    return total

def summarize_from_events(events):
    """
    Uses BLOCK_ENTER and ALLOW_ENTER to compute block intervals and HR at block entry.
    """
    # Sort by time
    events_sorted = sorted(events, key=lambda r: parse_iso(r["ts_utc"]))
    first = parse_iso(events_sorted[0]["ts_utc"])
    print("DEBUG first event UTC:", first.isoformat(), "| NY:", first.astimezone(LOCAL_TZ).isoformat())


    block_intervals = []  # (start_dt, end_dt, hr_at_start, mode_at_start)
    current_block_start = None
    current_block_hr = None
    current_block_mode = None

    for r in events_sorted:
        evt = (r.get("event") or "").strip()
        ts = parse_iso(r["ts_utc"])
        hr = safe_int(r.get("hr_bpm"))
        mode = (r.get("mode") or "unknown").strip()

        if evt == "BLOCK_ENTER":
            # If we were already blocked, ignore duplicate enters
            if current_block_start is None:
                current_block_start = ts
                current_block_hr = hr
                current_block_mode = mode

        elif evt == "ALLOW_ENTER":
            # Close a block interval if we were blocked
            if current_block_start is not None:
                block_intervals.append((current_block_start, ts, current_block_hr, current_block_mode))
                current_block_start = None
                current_block_hr = None
                current_block_mode = None

    # If logs end while blocked, close interval at last timestamp
    if current_block_start is not None and events_sorted:
        last_ts = parse_iso(events_sorted[-1]["ts_utc"])
        block_intervals.append((current_block_start, last_ts, current_block_hr, current_block_mode))

    # Aggregate by UTC date (you can change to local if you want)
    per_day = defaultdict(lambda: {"blocks": 0, "blocked_seconds": 0, "hr_entries": []})
    per_mode = defaultdict(lambda: {"blocks": 0, "blocked_seconds": 0, "hr_entries": []})

    for start, end, hr0, mode0 in block_intervals:
        day = ts.astimezone(LOCAL_TZ).date().isoformat()
        dur = int((end - start).total_seconds())
        if dur < 0:
            continue

        per_day[day]["blocks"] += 1
        per_day[day]["blocked_seconds"] += dur
        if hr0 is not None:
            per_day[day]["hr_entries"].append(hr0)

        per_mode[mode0]["blocks"] += 1
        per_mode[mode0]["blocked_seconds"] += dur
        if hr0 is not None:
            per_mode[mode0]["hr_entries"].append(hr0)

    return per_day, per_mode, block_intervals


def summarize_from_samples(samples):
    """
    Uses sampled rows to estimate time in BLOCK by counting sample intervals.
    Accepts ts_utc OR last_updated_unix.
    """
    if not samples:
        return None

    def get_sample_time(row):
        if "ts_utc" in row and row["ts_utc"]:
            return parse_iso(row["ts_utc"])
        if "last_updated_unix" in row and row["last_updated_unix"]:
            return datetime.fromtimestamp(int(row["last_updated_unix"]), tz=timezone.utc)
        return None

    samples_with_time = []
    for r in samples:
        t = get_sample_time(r)
        if t is not None:
            samples_with_time.append((t, r))

    samples_with_time.sort(key=lambda x: x[0])

    per_day = defaultdict(lambda: {"blocked_samples": 0, "total_samples": 0})

    for ts, r in samples_with_time:
        day = ts.astimezone(LOCAL_TZ).date().isoformat()
        status = (r.get("status") or "").strip().upper()
        per_day[day]["total_samples"] += 1
        if status == "BLOCK":
            per_day[day]["blocked_samples"] += 1

    return per_day



def main(events_path=EVENTS_FILE_DEFAULT, samples_path=SAMPLES_FILE_DEFAULT):
    if not os.path.exists(events_path):
        print(f"[!] Missing {events_path}. Make sure your event logging is enabled.")
        return

    events = read_csv_rows(events_path)
    samples = read_csv_rows(samples_path) if os.path.exists(samples_path) else []

    cfg = {}
    if os.path.exists("config.json"):
        with open("config.json", "r", encoding="utf-8") as f:
            cfg = json.load(f)

    per_day, per_mode, intervals = summarize_from_events(events)
    sample_day = summarize_from_samples(samples) if samples else None

    print("\n=== WHOOP Gate Summary (America/New_York) ===\n")

    if not per_day:
        print("No BLOCK/ALLOW events found yet. Trigger a block/unblock and try again.")
        return

    # Print per-day summary
    days = sorted(per_day.keys())
    for d in days:
        blocks = per_day[d]["blocks"]
        blocked_sec = per_day[d]["blocked_seconds"]
        hrs = per_day[d]["hr_entries"]
        avg_hr = round(sum(hrs) / len(hrs), 1) if hrs else None

        line = f"{d} | blocks: {blocks} | time blocked: {fmt_seconds(blocked_sec)}"
        if avg_hr is not None:
            line += f" | avg HR at block entry: {avg_hr} bpm"
        
        window_sec = compute_window_seconds_for_day(cfg, d) if cfg else 0
        if window_sec > 0:
            pct_blocked = round(100 * blocked_sec / window_sec, 2)
            line += f" | blocked% of window: {pct_blocked}%"

        # Sample-based sanity check (if available)
        if sample_day and d in sample_day:
            total = sample_day[d]["total_samples"]
            b = sample_day[d]["blocked_samples"]
            if total > 0:
                pct = round(100 * b / total, 1)
                line += f" | sample BLOCK%: {pct}%"

        print(line)

    # Print per-mode summary
    print("\n=== By Mode (based on mode at BLOCK_ENTER) ===\n")
    for mode in sorted(per_mode.keys()):
        blocks = per_mode[mode]["blocks"]
        blocked_sec = per_mode[mode]["blocked_seconds"]
        window_sec = compute_window_seconds_for_day(cfg, d) if cfg else 0
        if window_sec > 0:
            pct_blocked = round(100 * blocked_sec / window_sec, 2)
            line += f" | blocked% of window: {pct_blocked}%"
        hrs = per_mode[mode]["hr_entries"]
        avg_hr = round(sum(hrs) / len(hrs), 1) if hrs else None

        line = f"{mode} | blocks: {blocks} | time blocked: {fmt_seconds(blocked_sec)}"
        if avg_hr is not None:
            line += f" | avg HR at block entry: {avg_hr} bpm"
        print(line)

    # Quick notes
    print("\n=== Notes ===")
    print(f"- Intervals counted: {len(intervals)}")
    if not samples:
        print("- No sample file found (gate_log.csv). That’s fine, events alone work.")
    else:
        print(f"- Samples loaded: {len(samples)} (used only as a sanity check)")

    print("\nDone.\n")


if __name__ == "__main__":
    main()
