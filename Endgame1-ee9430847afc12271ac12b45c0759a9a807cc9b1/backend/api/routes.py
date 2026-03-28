from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.core.state import get_session, update_session
from backend.core.session import session_manager
from backend.rules.profiles import load_all_profiles, save_profile, load_profile
from backend.rules.models import RuleProfile

router = APIRouter()


# ── Session ────────────────────────────────────────────────────────────────────

@router.get("/session/state")
async def get_session_state():
    return get_session().model_dump(mode="json")


class SetAccountRequest(BaseModel):
    account_id: str


@router.post("/session/set-account")
async def set_account(req: SetAccountRequest):
    try:
        session_manager.set_active_account(req.account_id)
        return {"ok": True, "account_id": req.account_id}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/session/arm")
async def arm_session():
    session = get_session()
    if not session.ritual_complete:
        raise HTTPException(status_code=400, detail="Complete the ritual first.")
    session_manager.arm_session()
    return {"ok": True, "armed": True}


@router.post("/session/end")
async def end_session():
    active = get_session().active_account
    session_manager.end_session(active_account=active)
    return {"ok": True}


# ── Rule Profiles ──────────────────────────────────────────────────────────────

@router.get("/profiles")
async def list_profiles():
    profiles = load_all_profiles()
    return {k: v.model_dump() for k, v in profiles.items()}


@router.get("/profiles/{account_id}")
async def get_profile(account_id: str):
    try:
        return load_profile(account_id).model_dump()
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Profile not found: {account_id}")


@router.put("/profiles/{account_id}")
async def update_profile(account_id: str, profile: RuleProfile):
    if profile.account_id != account_id:
        raise HTTPException(status_code=400, detail="account_id mismatch")
    save_profile(profile)
    return {"ok": True}


# ── Lockout ────────────────────────────────────────────────────────────────────

class LockRequest(BaseModel):
    reason: str = "manual"
    duration_minutes: int = 15


@router.post("/lockout/trigger")
async def trigger_lockout(req: LockRequest):
    from backend.lockout.manager import lockout_manager, LockoutAction, LockLevel
    from backend.rules.models import Violation, ViolationType, ViolationSeverity
    v = Violation(
        type=ViolationType.DAILY_LOSS_LIMIT_HIT,
        severity=ViolationSeverity.HARD_LOCK,
        message=f"Manual lockout: {req.reason}",
        tone="hard_interrupt",
    )
    action = LockoutAction(level=LockLevel.HARD, reason=req.reason, duration_min=req.duration_minutes)
    await lockout_manager.execute(action)
    return {"ok": True}


@router.post("/lockout/unlock")
async def unlock():
    from backend.lockout.manager import lockout_manager
    await lockout_manager.unlock()
    return {"ok": True}


# ── Journal ────────────────────────────────────────────────────────────────────

@router.get("/journal/entries")
async def get_journal_entries(limit: int = 20):
    from backend.journal.logger import journal_logger
    try:
        entries = await journal_logger.get_recent(limit)
        return {"entries": entries}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/journal/weekly-review")
async def trigger_weekly_review():
    from backend.journal.review import weekly_review
    try:
        summary = await weekly_review.generate()
        return {"ok": True, "summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
