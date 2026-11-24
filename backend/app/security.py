import secrets
import bcrypt
from app import config
from app.db import redis_client

def hash_password(password: str) -> str:
    """Hash password with bcrypt using a salt so identical passwords never produce matching hashes."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Constant-time check prevents timing attacks where attackers guess passwords by response duration."""
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

def create_session(user_id: str) -> str:
    """Generate a high-entropy URL-safe token and map session:<token> -> user_id in Redis with a TTL."""
    token = secrets.token_urlsafe(32)
    redis_client.setex(f"session:{token}", config.SESSION_TTL_SECONDS, user_id)
    return token

def get_session_user_id(token: str) -> str | None:
    """Return user_id for this session token, or None if expired or deleted."""
    return redis_client.get(f"session:{token}")

def refresh_session(token: str) -> None:
    """Sliding expiration: refreshes the TTL on each valid request so active users stay logged in."""
    redis_client.expire(f"session:{token}", config.SESSION_TTL_SECONDS)

def delete_session(token: str) -> None:
    """Invalidate session in Redis immediately upon user logout."""
    redis_client.delete(f"session:{token}")
