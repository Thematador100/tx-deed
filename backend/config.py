"""Configuration management for the scraping service."""
import os
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    """Application settings."""

    # API Configuration
    api_host: str = os.getenv("API_HOST", "0.0.0.0")
    api_port: int = int(os.getenv("API_PORT", "8000"))

    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./data/taxsales.db")

    # Scraping
    user_agent: str = os.getenv(
        "USER_AGENT",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    )
    scraping_delay_min: int = int(os.getenv("SCRAPING_DELAY_MIN", "2"))
    scraping_delay_max: int = int(os.getenv("SCRAPING_DELAY_MAX", "5"))
    max_retries: int = int(os.getenv("MAX_RETRIES", "3"))

    # Proxy
    use_proxy: bool = os.getenv("USE_PROXY", "false").lower() == "true"
    proxy_url: Optional[str] = os.getenv("PROXY_URL")

    # LLM
    openai_api_key: Optional[str] = os.getenv("OPENAI_API_KEY")
    anthropic_api_key: Optional[str] = os.getenv("ANTHROPIC_API_KEY")

    # Scheduling
    scrape_schedule_cron: str = os.getenv("SCRAPE_SCHEDULE_CRON", "0 2 * * *")

    # Logging
    log_level: str = os.getenv("LOG_LEVEL", "INFO")

    class Config:
        env_file = ".env"
        case_sensitive = False

# Create data directory if it doesn't exist
Path("./data").mkdir(exist_ok=True)

settings = Settings()
