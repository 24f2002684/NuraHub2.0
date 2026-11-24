import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env explicitly so configuration is available regardless of current working directory
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)

def get_required_env(key: str) -> str:
    """Fail immediately at startup if a critical environment variable is missing."""
    val = os.getenv(key)
    if not val:
        raise RuntimeError(f"Missing required environment variable: {key}. Please check backend/.env")
    return val

# Required database connections
MONGODB_URI = get_required_env("MONGODB_URI")
MONGODB_DB = get_required_env("MONGODB_DB")
REDIS_URL = get_required_env("REDIS_URL")

# Session TTL (default 7 days = 604800 seconds)
SESSION_TTL_SECONDS = int(os.getenv("SESSION_TTL_SECONDS", "604800"))

# Whitelisted origins for browser CORS (strict array, no wildcards)
CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if o.strip()]

# Local development uses HTTP; set to True in production to ensure cookies transmit only over HTTPS
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
