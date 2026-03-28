from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from backend.core.jarvis import jarvis
from backend.api.ws import voice_ws, agent_ws, dashboard_ws
from backend.api.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await jarvis.startup()
    yield
    await jarvis.shutdown()


app = FastAPI(title="Jarvis", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# REST routes
app.include_router(router, prefix="/api")

# WebSocket endpoints
app.add_api_websocket_route("/ws/voice", voice_ws)
app.add_api_websocket_route("/ws/agent", agent_ws)
app.add_api_websocket_route("/ws/dashboard", dashboard_ws)


@app.get("/health")
async def health():
    return {"status": "ok", "name": "Jarvis"}


# Serve PWA dashboard static files if built
dashboard_dist = os.path.join(os.path.dirname(__file__), "..", "dashboard", "dist")
if os.path.isdir(dashboard_dist):
    app.mount("/", StaticFiles(directory=dashboard_dist, html=True), name="dashboard")
