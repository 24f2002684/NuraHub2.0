from bson import ObjectId
from fastapi import Request, HTTPException, status
from app.db import users_col
from app.security import get_session_user_id, refresh_session, delete_session

def get_current_user(request: Request) -> dict:
    """
    Authenticate request via httpOnly session cookie.
    Validates token in Redis, refreshes TTL on activity, and fetches user doc from MongoDB.
    """
    session_token = request.cookies.get("session")
    if not session_token:
        # Missing cookie indicates an unauthenticated request
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    user_id = get_session_user_id(session_token)
    if not user_id:
        # Token expired in Redis or was never issued
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired or invalid")

    # Sliding session expiration: keep active users logged in
    refresh_session(session_token)

    try:
        user = users_col.find_one({"_id": ObjectId(user_id)})
    except Exception:
        user = None

    if not user:
        # Clean up orphan session in Redis if user was deleted from MongoDB
        delete_session(session_token)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    return user
