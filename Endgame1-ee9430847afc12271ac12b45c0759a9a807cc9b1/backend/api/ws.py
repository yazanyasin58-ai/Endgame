from __future__ import annotations
import asyncio
import json

from fastapi import WebSocket, WebSocketDisconnect

from backend.core.jarvis import jarvis
from backend.core.state import get_session, update_session


async def voice_ws(websocket: WebSocket):
    """
    /ws/voice — Browser/PWA microphone stream.

    Client → Server:
      Binary frames: raw PCM audio (16kHz, 16-bit, mono)
      Text frames:   JSON control messages
        {"type": "start"}
        {"type": "stop"}
        {"type": "text", "content": "..."}

    Server → Client:
      Binary frames: MP3 audio (TTS output)
      Text frames:   JSON status/event messages
    """
    await websocket.accept()
    print("[WS/voice] Client connected")

    # Wire TTS audio output back to this WebSocket
    async def send_audio(chunk: bytes):
        try:
            await websocket.send_bytes(chunk)
        except Exception:
            pass

    jarvis.set_audio_callback(send_audio)
    await jarvis.start_voice()

    try:
        while True:
            msg = await websocket.receive()

            if msg["type"] == "websocket.receive":
                if "bytes" in msg and msg["bytes"]:
                    await jarvis.handle_audio(msg["bytes"])

                elif "text" in msg and msg["text"]:
                    data = json.loads(msg["text"])
                    msg_type = data.get("type")

                    if msg_type == "text":
                        await jarvis.handle_text(data.get("content", ""))

                    elif msg_type == "set_account":
                        account_id = data.get("account_id", "")
                        try:
                            from backend.core.session import session_manager
                            session_manager.set_active_account(account_id)
                            await websocket.send_text(json.dumps({
                                "type": "account_set",
                                "account_id": account_id,
                            }))
                        except ValueError as e:
                            await websocket.send_text(json.dumps({"type": "error", "message": str(e)}))

    except WebSocketDisconnect:
        print("[WS/voice] Client disconnected")
    except Exception as e:
        print(f"[WS/voice] Error: {e}")


async def agent_ws(websocket: WebSocket):
    """
    /ws/agent — Desktop Agent connection.

    Agent → Server:
      {"type": "screenshot", "platform": "tradovate", "image_b64": "...", "timestamp": "..."}
      {"type": "biometric", "hr": 78, "hrv": 65.2, "recovery": 82}
      {"type": "heartbeat"}

    Server → Agent:
      {"type": "lockout", "level": "SOFT|HARD|UNLOCK", "reason": "...", "duration_sec": 900}
      {"type": "push_notification", "title": "...", "message": "..."}
    """
    await websocket.accept()
    print("[WS/agent] Desktop Agent connected")

    try:
        while True:
            text = await websocket.receive_text()
            data = json.loads(text)
            msg_type = data.get("type")

            if msg_type == "screenshot":
                await jarvis.process_screen_event(data)

            elif msg_type == "biometric":
                hr = data.get("hr")
                hrv = data.get("hrv")
                recovery = data.get("recovery")
                sleep_perf = data.get("sleep_performance")

                if hr is not None:
                    update_session(current_hr=hr)
                if hrv is not None:
                    update_session(current_hrv=hrv)
                if recovery is not None:
                    update_session(recovery_score=recovery)
                if sleep_perf is not None:
                    update_session(sleep_performance=sleep_perf)

                # Biometric classification
                from backend.biometrics.classifier import classify_state, WhoopSnapshot
                snapshot = WhoopSnapshot(
                    hr=hr or 0,
                    hrv=hrv or 0.0,
                    recovery_score=recovery or 0,
                    sleep_performance=sleep_perf or 0,
                )
                state = classify_state(snapshot)
                update_session(biometric_state=state)

                # Check for biometric violations
                if hr and hrv:
                    from backend.rules.engine import rules_engine
                    violations = rules_engine.evaluate_biometric(hr, hrv)
                    for v in violations:
                        await jarvis.say(v.message, tone=v.tone)

            elif msg_type == "heartbeat":
                await websocket.send_text(json.dumps({"type": "pong"}))

    except WebSocketDisconnect:
        print("[WS/agent] Desktop Agent disconnected")
    except Exception as e:
        print(f"[WS/agent] Error: {e}")


async def dashboard_ws(websocket: WebSocket):
    """
    /ws/dashboard — PWA Dashboard live feed.

    Server pushes DashboardUpdate every 5 seconds.
    Client can send: {"type": "ping"}
    """
    await websocket.accept()
    jarvis.register_dashboard_ws(websocket)
    print("[WS/dashboard] Dashboard client connected")

    async def push_loop():
        while True:
            await asyncio.sleep(5)
            try:
                await jarvis.broadcast_state()
            except Exception:
                break

    push_task = asyncio.create_task(push_loop())

    try:
        while True:
            text = await websocket.receive_text()
            data = json.loads(text)
            if data.get("type") == "ping":
                await websocket.send_text(json.dumps({"type": "pong"}))
    except WebSocketDisconnect:
        print("[WS/dashboard] Dashboard disconnected")
    except Exception as e:
        print(f"[WS/dashboard] Error: {e}")
    finally:
        push_task.cancel()
        jarvis.unregister_dashboard_ws(websocket)
