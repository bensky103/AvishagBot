from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "sqlite+aiosqlite:///./data/avishag.db"
    openai_api_key: str = ""
    telegram_bot_token: str = ""
    telegram_allowed_user_id: int = 0

    model_config = {"env_file": ".env"}


settings = Settings()
