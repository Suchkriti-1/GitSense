from __future__ import annotations

import json
from pathlib import Path
from typing import Any


DATA_DIR = Path(__file__).resolve().parent.parent / "data"
STATE_FILE = DATA_DIR / "dashboard_state.json"


def build_default_state(user_login: str) -> dict[str, Any]:
    return {
        "repositories": [],
        "rules": [
            {
                "id": 1,
                "name": "My Assignments",
                "active": True,
                "trigger": "Assigned to me",
                "action": "Always notify",
                "count": 0,
            },
            {
                "id": 2,
                "name": "Direct Mentions",
                "active": True,
                "trigger": f"@{user_login} mentioned",
                "action": "Always notify",
                "count": 0,
            },
            {
                "id": 3,
                "name": "Review Requests",
                "active": True,
                "trigger": "Review requested",
                "action": "Priority alert",
                "count": 0,
            },
        ],
        "preferences": {
            "email_digest": True,
            "stale_reminders": True,
            "browser_push": False,
            "slack_integration": False,
        },
    }


def _ensure_state_file() -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if not STATE_FILE.exists():
        STATE_FILE.write_text(json.dumps({"users": {}}, indent=2), encoding="utf-8")


def _load_all_state() -> dict[str, Any]:
    _ensure_state_file()
    data = json.loads(STATE_FILE.read_text(encoding="utf-8"))
    if "users" not in data or not isinstance(data["users"], dict):
        return {"users": {}}
    return data


def _save_all_state(state: dict[str, Any]) -> None:
    STATE_FILE.write_text(json.dumps(state, indent=2), encoding="utf-8")


def _get_user_state(user_login: str) -> tuple[dict[str, Any], dict[str, Any]]:
    state = _load_all_state()
    users = state["users"]
    if user_login not in users:
        users[user_login] = build_default_state(user_login)
        _save_all_state(state)
    return state, users[user_login]


def _next_id(items: list[dict[str, Any]]) -> int:
    return max((int(item.get("id", 0)) for item in items), default=0) + 1


def get_dashboard_state(user_login: str) -> dict[str, Any]:
    _, user_state = _get_user_state(user_login)
    return {
        "repositories": user_state["repositories"],
        "rules": user_state["rules"],
        "preferences": user_state["preferences"],
    }


def list_repositories(user_login: str) -> list[dict[str, Any]]:
    _, user_state = _get_user_state(user_login)
    return user_state["repositories"]


def create_repository(user_login: str, name: str, org: str | None = None) -> dict[str, Any]:
    state, user_state = _get_user_state(user_login)
    normalized_name = name.strip()
    normalized_org = (org or "your-org").strip() or "your-org"

    existing_repo = next(
        (
            repo
            for repo in user_state["repositories"]
            if repo["name"].lower() == normalized_name.lower() and repo["org"].lower() == normalized_org.lower()
        ),
        None,
    )
    if existing_repo:
        existing_repo["active"] = True
        _save_all_state(state)
        return existing_repo

    repo = {
        "id": _next_id(user_state["repositories"]),
        "name": normalized_name,
        "org": normalized_org,
        "active": True,
        "stars": 0,
    }
    user_state["repositories"].append(repo)
    _save_all_state(state)
    return repo


def update_repository(user_login: str, repo_id: int, active: bool) -> dict[str, Any] | None:
    state, user_state = _get_user_state(user_login)
    for repo in user_state["repositories"]:
        if repo["id"] == repo_id:
            repo["active"] = active
            _save_all_state(state)
            return repo
    return None


def list_rules(user_login: str) -> list[dict[str, Any]]:
    _, user_state = _get_user_state(user_login)
    return user_state["rules"]


def create_rule(user_login: str, name: str, label: str, action: str) -> dict[str, Any]:
    state, user_state = _get_user_state(user_login)
    rule = {
        "id": _next_id(user_state["rules"]),
        "name": name.strip(),
        "trigger": f'Label: "{label.strip()}"',
        "action": action.strip(),
        "active": True,
        "count": 0,
    }
    user_state["rules"].append(rule)
    _save_all_state(state)
    return rule


def update_rule(user_login: str, rule_id: int, active: bool) -> dict[str, Any] | None:
    state, user_state = _get_user_state(user_login)
    for rule in user_state["rules"]:
        if rule["id"] == rule_id:
            rule["active"] = active
            _save_all_state(state)
            return rule
    return None


def delete_rule(user_login: str, rule_id: int) -> bool:
    state, user_state = _get_user_state(user_login)
    original_count = len(user_state["rules"])
    user_state["rules"] = [rule for rule in user_state["rules"] if rule["id"] != rule_id]
    if len(user_state["rules"]) == original_count:
        return False
    _save_all_state(state)
    return True


def get_preferences(user_login: str) -> dict[str, bool]:
    _, user_state = _get_user_state(user_login)
    return user_state["preferences"]


def update_preferences(user_login: str, updates: dict[str, bool]) -> dict[str, bool]:
    state, user_state = _get_user_state(user_login)
    user_state["preferences"].update(updates)
    _save_all_state(state)
    return user_state["preferences"]


def update_rule_counts(user_login: str, counts_by_id: dict[int, int]) -> list[dict[str, Any]]:
    state, user_state = _get_user_state(user_login)
    for rule in user_state["rules"]:
        rule["count"] = counts_by_id.get(int(rule["id"]), 0)
    _save_all_state(state)
    return user_state["rules"]
