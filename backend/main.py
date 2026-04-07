from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, dashboard, github, notification, realtime
from app.config import FRONTEND_URL

app = FastAPI()

def normalize_origin(value: str) -> str:
    return value.rstrip("/")


allowed_origins = [
    normalize_origin(FRONTEND_URL),
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(github.router, prefix="/repos", tags=["repos"])
app.include_router(notification.router, prefix="/notifications", tags=["notifications"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(realtime.router, prefix="/realtime", tags=["realtime"])

@app.get("/health")
def health_check():
    return {"status": "ok"}

