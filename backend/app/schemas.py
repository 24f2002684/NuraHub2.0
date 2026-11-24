import re
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator

def clean_text(value: Optional[str]) -> str:
    """Strip leading/trailing whitespace, script/style blocks, HTML tags, and control characters."""
    if not value:
        return ""
    # Strip script and style blocks completely including inner text
    no_scripts = re.sub(r"<(script|style)[^>]*>.*?</\1>", "", value, flags=re.DOTALL | re.IGNORECASE)
    # Strip any remaining HTML tags
    no_html = re.sub(r"<[^>]*>", "", no_scripts)
    # Strip non-printable control characters
    no_control = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", no_html)
    return no_control.strip()

class RegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        # Whitelist alphanumeric and underscore to prevent directory traversal or script injection
        if not re.match(r"^[a-zA-Z0-9_]{3,30}$", v):
            raise ValueError("Username must be 3-30 characters and contain only letters, numbers, and underscores")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        # Bcrypt silently truncates passwords after 72 bytes; enforce limit explicitly
        byte_len = len(v.encode("utf-8"))
        if byte_len < 8 or byte_len > 72:
            raise ValueError("Password must be between 8 and 72 bytes")
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("Password must contain at least one letter and one number")
        return v

class LoginRequest(BaseModel):
    # Enforcing strict string types blocks NoSQL injection payloads such as {"$ne": ""}
    identifier: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(default="", max_length=80)
    age: Optional[int] = Field(default=None)
    bio: Optional[str] = Field(default="", max_length=500)
    interests: Optional[list[str]] = Field(default_factory=list)

    @field_validator("full_name", "bio")
    @classmethod
    def clean_strings(cls, v: Optional[str]) -> str:
        return clean_text(v)

    @field_validator("age")
    @classmethod
    def validate_age(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and (v < 5 or v > 120):
            raise ValueError("Age must be between 5 and 120")
        return v

    @field_validator("interests")
    @classmethod
    def clean_interests(cls, items: Optional[list[str]]) -> list[str]:
        if not items:
            return []
        if len(items) > 10:
            raise ValueError("You can specify at most 10 interests")
        cleaned = []
        for item in items:
            c = clean_text(item)
            if c:
                if len(c) > 30:
                    raise ValueError("Each interest must be at most 30 characters")
                cleaned.append(c)
        return cleaned

class ProfileResponse(BaseModel):
    username: str
    email: str
    full_name: str = ""
    age: Optional[int] = None
    bio: str = ""
    interests: list[str] = []
