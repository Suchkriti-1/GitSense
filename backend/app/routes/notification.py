from fastapi import APIRouter, HTTPException
from app.services.github_service import (
    filter_notifications,
    github_notifications,
    generate_summary
)
from app.routes.dashboard import resolve_user_login
from app.services.dashboard_service import get_dashboard_state, update_rule_counts

router = APIRouter()

@router.get("")
def read_notifications(token: str, important: bool = False, page: int = 1, limit: int = 10):
    try:
        user_login = resolve_user_login(token)
        dashboard_state = get_dashboard_state(user_login)
        notifications = github_notifications(token)

        filtered, rule_counts = filter_notifications(
            notifications,
            only_important=important,
            token=token,
            tracked_repositories=dashboard_state["repositories"],
            rules=dashboard_state["rules"],
        )
        update_rule_counts(user_login, rule_counts)

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
