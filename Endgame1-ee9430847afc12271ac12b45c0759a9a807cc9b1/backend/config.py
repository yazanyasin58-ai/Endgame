from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    # ── AI ────────────────────────────────────────────────────────────────────
    anthropic_api_key: str = ""

    # ── Voice ─────────────────────────────────────────────────────────────────
    deepgram_api_key: str = ""
    elevenlabs_api_key: str = ""
    elevenlabs_voice_id: str = ""

    # ── Biometrics — WHOOP ────────────────────────────────────────────────────
    whoop_client_id: str = ""
    whoop_client_secret: str = ""
    whoop_refresh_token: str = ""   # copy from whoop_hr_gate/tokens.json

    # ── Tradovate (Alpha futures funded) ──────────────────────────────────────
    tradovate_username: str = ""
    tradovate_password: str = ""
    tradovate_client_id: str = ""
    tradovate_client_secret: str = ""
    tradovate_use_demo: bool = False

    # ── TradeLocker (Hero FX live forex) ──────────────────────────────────────
    tradelocker_email: str = ""
    tradelocker_password: str = ""
    tradelocker_server: str = ""    # e.g. "HeroFX-Live"

    # ── Journal ───────────────────────────────────────────────────────────────
    notion_token: str = ""
    notion_database_id: str = ""    # populated after first-run database creation

    # ── Push Notifications ────────────────────────────────────────────────────
    pushover_user_key: str = ""
    pushover_app_token: str = ""


settings = Settings()
