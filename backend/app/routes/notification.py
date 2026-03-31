from fastapi import APIRouter, HTTPException
from app.services.github_service import (
    filter_notifications,
    github_notifications,
    generate_summary
)

router = APIRouter()

@router.get("")
def read_notifications(token: str, important: bool = False, page: int = 1, limit: int = 10):
    try:
        notifications = github_notifications(token)

        filtered = filter_notifications(
            notifications, 
            only_important=important
        )

        start = (page - 1) * limit
        end = start + limit
        paginated = filtered[start:end]

        summary = generate_summary(filtered)

        return {
            "notifications": paginated,
            "summary": summary,
            "pagination": {
                "page": page,
                "limit": limit,
                "total": len(filtered)
            }
        }
    
    except Exception as e:

        raise HTTPException(status_code=500, detail=str(e))