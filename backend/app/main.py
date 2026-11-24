from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app import config
from app.db import users_col, profiles_col
from app.auth_routes import router as auth_router
from app.profile_routes import router as profile_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database indexes exist on startup so duplicate constraints are enforced at the DB level
    users_col.create_index("username", unique=True)
    users_col.create_index("email", unique=True)
    profiles_col.create_index("user_id", unique=True)
    yield

app = FastAPI(title="Auth App API", lifespan=lifespan)

# Turn FastAPI's 422 errors into an accessible format for frontend field-by-field highlighting
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    field_errors = {}
    for err in exc.errors():
        loc = err.get("loc", [])
        field_name = str(loc[-1]) if loc else "general"
        msg = err.get("msg", "Invalid value")
        if msg.startswith("Value error, "):
            msg = msg.replace("Value error, ", "")
        field_errors[field_name] = msg

    return JSONResponse(
        status_code=422,
        content={"detail": "Please fix the highlighted fields", "errors": field_errors}
    )

# CORS: strictly allow frontend origin with credentials enabled for cookie transfer
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "OPTIONS"],
    allow_headers=["Content-Type"],
)

# Health endpoint: simple liveness check that avoids touching database
@app.get("/health")
def health_check():
    return {"status": "ok"}

# Mount auth and profile routes
app.include_router(auth_router)
app.include_router(profile_router)
