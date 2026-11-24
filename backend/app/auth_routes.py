from datetime import datetime, timezone
from fastapi import APIRouter, Response, Request, HTTPException, status
from pymongo.errors import DuplicateKeyError
from app import config
from app.db import users_col, redis_client
from app.schemas import RegisterRequest, LoginRequest
from app.security import hash_password, verify_password, create_session, delete_session

router = APIRouter(prefix="/api", tags=["auth"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(req: RegisterRequest):
    """Register a new user account. Does not log in; frontend routes to /login."""
    email_clean = req.email.lower().strip()
    pw_hash = hash_password(req.password)

    user_doc = {
        "username": req.username,
        "email": email_clean,
        "password_hash": pw_hash,
        "created_at": datetime.now(timezone.utc)
    }

    try:
        users_col.insert_one(user_doc)
    except DuplicateKeyError:
        # Return generic duplicate message to prevent attackers from discovering which field conflicted
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username or email already in use")

    return {"message": "User registered successfully"}

@router.post("/login")
def login(req: LoginRequest, response: Response):
    """Authenticate with username or email, issue Redis session, and return httpOnly cookie."""
    identifier = req.identifier.strip()
    
    # Rate limit: block brute-force attempts after 5 failures in 15 minutes
    rate_key = f"failed_login:{identifier.lower()}"
    attempts = redis_client.get(rate_key)
    if attempts and int(attempts) >= 5:
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many failed attempts. Try again in 15 minutes.")

    # Single query matches either username or email
    user = users_col.find_one({"$or": [{"username": identifier}, {"email": identifier.lower()}]})

    # Generic 401 error message for non-existent user or wrong password prevents account enumeration
    if not user or not verify_password(req.password, user.get("password_hash", "")):
        pipe = redis_client.pipeline()
        pipe.incr(rate_key)
        pipe.expire(rate_key, 900)  # 15 minutes
        pipe.execute()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    # Clear failed login attempts upon successful authentication
    redis_client.delete(rate_key)

    # Issue session token and save user_id in Redis
    user_id_str = str(user["_id"])
    token = create_session(user_id_str)

    # httpOnly cookie shields the token from JavaScript reading/XSS exfiltration
    response.set_cookie(
        key="session",
        value=token,
        max_age=config.SESSION_TTL_SECONDS,
        httponly=True,
        samesite="lax",
        secure=config.COOKIE_SECURE
    )

    # Return username only; token is never exposed in the response body
    return {"username": user["username"]}

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(request: Request):
    """Delete session from Redis and clear the browser cookie."""
    session_token = request.cookies.get("session")
    if session_token:
        delete_session(session_token)

    res = Response(status_code=status.HTTP_204_NO_CONTENT)
    res.delete_cookie(
        key="session",
        httponly=True,
        samesite="lax",
        secure=config.COOKIE_SECURE
    )
    return res
