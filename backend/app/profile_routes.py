from datetime import datetime, timezone
from fastapi import APIRouter, Depends
from app.db import profiles_col
from app.deps import get_current_user
from app.schemas import ProfileUpdate, ProfileResponse

router = APIRouter(prefix="/api", tags=["profile"])

@router.get("/profile", response_model=ProfileResponse)
def get_profile(current_user: dict = Depends(get_current_user)):
    """Return user credentials and profile details, providing empty defaults if profile is not created yet."""
    user_id = str(current_user["_id"])
    profile = profiles_col.find_one({"user_id": user_id}) or {}

    return ProfileResponse(
        username=current_user["username"],
        email=current_user["email"],
        full_name=profile.get("full_name", ""),
        age=profile.get("age"),
        bio=profile.get("bio", ""),
        interests=profile.get("interests", [])
    )

@router.put("/profile", response_model=ProfileResponse)
def update_profile(req: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    """Upsert profile document linked to current user's ID."""
    user_id = str(current_user["_id"])

    update_fields = {
        "full_name": req.full_name,
        "age": req.age,
        "bio": req.bio,
        "interests": req.interests,
        "updated_at": datetime.now(timezone.utc)
    }

    # Upsert ensures the profile is created on first update or modified subsequently
    profiles_col.update_one(
        {"user_id": user_id},
        {"$set": update_fields, "$setOnInsert": {"user_id": user_id}},
        upsert=True
    )

    return ProfileResponse(
        username=current_user["username"],
        email=current_user["email"],
        full_name=req.full_name,
        age=req.age,
        bio=req.bio,
        interests=req.interests
    )
