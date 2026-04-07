from fastapi import APIRouter, WebSocket, Depends, HTTPException
from app.services.realtime_service import manager
from app.services.github_service import get_authenticated_user

router = APIRouter()

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str = None):
    if not token:
        await websocket.close(code=1008)  # Policy violation
        return

    try:
        # Verify token by getting user info
        user_data = get_authenticated_user(token)
        user_id = str(user_data["id"])

        await manager.connect(websocket, user_id, token)

        try:
            while True:
                # Keep connection alive and listen for client messages
                data = await websocket.receive_text()
                # For now, we don't process client messages, just keep alive
        except Exception:
            pass
        finally:
            manager.disconnect(websocket, user_id)

    except Exception as e:
        await websocket.close(code=1011)  # Internal error
        print(f"WebSocket error: {str(e)}")

@router.get("/activity")
async def get_current_activity(token: str):
    """Get current GitHub activity (issues and PRs)"""
    try:
        from app.services.github_service import get_user_activity
        activity = get_user_activity(token)
        return activity
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))