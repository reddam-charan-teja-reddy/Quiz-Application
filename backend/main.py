import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv
load_dotenv()

from routes.auth import router as auth_router
from routes.quiz import router as quiz_router
from routes.history import router as history_router
from routes.profile import router as profile_router
from routes.generate import router as generate_router


app = FastAPI()

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(quiz_router)
app.include_router(history_router)
app.include_router(profile_router)
app.include_router(generate_router)


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
