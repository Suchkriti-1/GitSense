from fastapi import APIRouter, HTTPException
from app.services.github_service import get_user_repos

router = APIRouter()

@router.get("")
def read_repos(token: str):
    try:
        repos = get_user_repos(token)
        normalized_repos = [
            {
                "id": repo.get("id"),
                "name": repo.get("name"),
                "full_name": repo.get("full_name"),
                "private": repo.get("private", False),
                "html_url": repo.get("html_url"),
                "description": repo.get("description"),
                "updated_at": repo.get("updated_at"),
                "stargazers_count": repo.get("stargazers_count", 0),
                "owner": {
                    "login": repo.get("owner", {}).get("login"),
                },
            }
            for repo in repos
        ]
        return {"repositories": normalized_repos}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

