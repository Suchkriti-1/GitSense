from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from urllib.parse import urlencode
from app.config import BACKEND_URL, FRONTEND_URL, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
from app.services.github_service import get_authenticated_user
import requests

router = APIRouter() 

@router.get("/login")
def login(frontend_redirect: str | None = None):
    if not GITHUB_CLIENT_ID or not GITHUB_CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="GitHub OAuth credentials not configured.")

    redirect_uri = f"{BACKEND_URL}/auth/callback"
    state = frontend_redirect or FRONTEND_URL
    github_auth_url = "https://github.com/login/oauth/authorize?" + urlencode(
        {
            "client_id": GITHUB_CLIENT_ID,
            "scope": "notifications repo user",
            "redirect_uri": redirect_uri,
            "state": state,
        }
    )

    return RedirectResponse(github_auth_url)

@router.get("/callback")
def callback(code: str, state: str | None = None):
    token_url = "https://github.com/login/oauth/access_token"

    headers = {"Accept": "application/json"}
    data = {
        "client_id": GITHUB_CLIENT_ID,
        "client_secret": GITHUB_CLIENT_SECRET,
        "code": code
    }

    response = requests.post(token_url, headers=headers, data=data)

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="Failed to exchange code for access token.")
    
    data = response.json()
    access_token = data.get("access_token")

    if not access_token:
        raise HTTPException(status_code=500, detail="Access token not found in response.")

    try:
        user = get_authenticated_user(access_token)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    frontend_redirect = state or FRONTEND_URL
    query = urlencode(
        {
            "token": access_token,
            "login": user.get("login", ""),
            "name": user.get("name") or user.get("login", ""),
            "avatar_url": user.get("avatar_url", ""),
        }
    )

    return RedirectResponse(f"{frontend_redirect.rstrip('/')}/auth/callback?{query}")


@router.get("/me")
def read_current_user(token: str):
    try:
        user = get_authenticated_user(token)
        return {
            "login": user.get("login"),
            "name": user.get("name") or user.get("login"),
            "avatar_url": user.get("avatar_url"),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
