from __future__ import annotations
import json
import os
from pathlib import Path
from backend.rules.models import RuleProfile

PROFILES_DIR = Path(__file__).parent.parent.parent / "data" / "profiles"


def load_profile(account_id: str) -> RuleProfile:
    path = PROFILES_DIR / f"{account_id}.json"
    if not path.exists():
        raise FileNotFoundError(f"No rule profile found for account: {account_id}")
    with open(path, "r") as f:
        return RuleProfile(**json.load(f))


def save_profile(profile: RuleProfile) -> None:
    PROFILES_DIR.mkdir(parents=True, exist_ok=True)
    path = PROFILES_DIR / f"{profile.account_id}.json"
    with open(path, "w") as f:
        json.dump(profile.model_dump(), f, indent=2)


def list_profiles() -> list[str]:
    if not PROFILES_DIR.exists():
        return []
    return [p.stem for p in PROFILES_DIR.glob("*.json")]


def load_all_profiles() -> dict[str, RuleProfile]:
    return {account_id: load_profile(account_id) for account_id in list_profiles()}
