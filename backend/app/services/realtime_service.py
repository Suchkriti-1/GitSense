from __future__ import annotations

import asyncio
import json
from typing import Dict, List, Set
from fastapi import WebSocket
from app.services.github_service import get_user_activity, github_notifications, filter_notifications
from app.services.dashboard_service import get_dashboard_state, update_rule_counts
from app.routes.dashboard import resolve_user_login


class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        self.user_tokens: Dict[str, str] = {}
        self.background_tasks: Dict[str, asyncio.Task] = {}

    async def connect(self, websocket: WebSocket, user_id: str, token: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        self.user_tokens[user_id] = token

        # Start background polling for this user if not already running
        if user_id not in self.background_tasks or self.background_tasks[user_id].done():
            self.background_tasks[user_id] = asyncio.create_task(
                self._poll_github_updates(user_id)
            )

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                # No more connections for this user, stop polling
                if user_id in self.background_tasks:
                    self.background_tasks[user_id].cancel()
                    del self.background_tasks[user_id]
                del self.active_connections[user_id]
                if user_id in self.user_tokens:
                    del self.user_tokens[user_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_user(self, user_id: str, message: Dict):
        if user_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.add(connection)

            # Clean up disconnected websockets
            for connection in disconnected:
                self.active_connections[user_id].discard(connection)

    async def _poll_github_updates(self, user_id: str):
        """Poll GitHub for updates every 30 seconds"""
        last_notifications = None
        last_activity = None

        while user_id in self.active_connections:
            try:
                token = self.user_tokens.get(user_id)
                if not token:
                    await asyncio.sleep(30)
                    continue

                # Get user login and dashboard state
                user_login = resolve_user_login(token)
                dashboard_state = get_dashboard_state(user_login)

                # Fetch current notifications
                raw_notifications = github_notifications(token)

                # Filter notifications according to dashboard rules
                filtered_notifications, rule_counts = filter_notifications(
                    raw_notifications,
                    only_important=False,
                    token=token,
                    tracked_repositories=dashboard_state["repositories"],
                    rules=dashboard_state["rules"],
                )

                # Update rule counts in dashboard
                update_rule_counts(user_login, rule_counts)

                # Generate summary
                from app.services.github_service import generate_summary
                summary = generate_summary(filtered_notifications)

                # Fetch activity data
                current_activity = get_user_activity(token)

                # Check if there are changes
                notifications_changed = self._notifications_changed(last_notifications, filtered_notifications)
                activity_changed = self._activity_changed(last_activity, current_activity)

                if last_notifications is None or notifications_changed or activity_changed:
                    # Send updated data
                    await self.broadcast_to_user(user_id, {
                        "type": "dashboard_update",
                        "notifications": filtered_notifications[:50],  # Send first 50 notifications
                        "summary": summary,
                        "activity": current_activity,
                        "rule_counts": rule_counts
                    })

                last_notifications = filtered_notifications.copy()
                last_activity = current_activity

            except Exception as e:
                print(f"Error polling GitHub for user {user_id}: {str(e)}")
                await self.broadcast_to_user(user_id, {
                    "type": "error",
                    "message": "Failed to fetch GitHub updates"
                })

            await asyncio.sleep(30)  # Poll every 30 seconds

    def _notifications_changed(self, old: List | None, new: List) -> bool:
        """Check if notifications have changed"""
        if old is None:
            return True

        if len(old) != len(new):
            return True

        # Check if any notification has changed
        old_ids = {n.get("id") for n in old}
        new_ids = {n.get("id") for n in new}

        return old_ids != new_ids

    def _activity_changed(self, old: Dict | None, new: Dict) -> bool:
        """Check if activity data has changed"""
        if old is None:
            return True

        return (
            old.get("total_issues", 0) != new.get("total_issues", 0) or
            old.get("total_prs", 0) != new.get("total_prs", 0)
        )


# Global connection manager instance
manager = ConnectionManager()