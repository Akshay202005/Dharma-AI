import os
from dotenv import load_dotenv

load_dotenv()  # reads .env into environment variables


class Settings:
    api_key: str = os.getenv("LLM_API_KEY", "")
    model: str = os.getenv("LLM_MODEL", "")
    base_url: str | None = os.getenv("LLM_BASE_URL") or None  # None = OpenAI default

    fallback_api_key: str = os.getenv("FALLBACK_API_KEY", "")
    fallback_model: str = os.getenv("FALLBACK_MODEL", "")
    fallback_base_url: str | None = os.getenv("FALLBACK_BASE_URL") or None

    @property
    def has_fallback(self) -> bool:
        return bool(self.fallback_api_key and self.fallback_model)


settings = Settings()

if not settings.api_key or not settings.model:
    raise RuntimeError("LLM_API_KEY and LLM_MODEL must be set in .env")