from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, github, notification
from app.config import FRONTEND_URL

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(github.router, prefix="/repos", tags=["repos"])
app.include_router(notification.router, prefix="/notifications", tags=["notifications"])

@app.get("/health")
def health_check():
    return {"status": "ok"}

