import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from config import settings
from limiter import limiter

from routes.auth import router as auth_router
from routes.quiz import router as quiz_router
from routes.history import router as history_router
from routes.profile import router as profile_router
from routes.generate import router as generate_router

app = FastAPI(title="QuizApp API", version="0.1.0")

# Rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

# Routers
app.include_router(auth_router)
app.include_router(quiz_router)
app.include_router(history_router)
app.include_router(profile_router)
app.include_router(generate_router)


@app.get("/health")
async def health_check():
    return {"status": "ok", "version": "0.1.0"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
