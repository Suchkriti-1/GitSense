from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.github_service import get_authenticated_user
from app.services.dashboard_service import (
    create_repository,
    create_rule,
    delete_rule,
    get_dashboard_state,
    get_preferences,
    list_repositories,
    list_rules,
    update_preferences,
    update_repository,
    update_rule,
)


router = APIRouter()


class RepositoryCreateRequest(BaseModel):
    name: str = Field(min_length=1)
    org: str | None = None


class RepositoryUpdateRequest(BaseModel):
    active: bool


class RuleCreateRequest(BaseModel):
    name: str = Field(min_length=1)
    label: str = Field(min_length=1)
    action: Literal["Always notify", "Priority alert", "Silent / archive"]


class RuleUpdateRequest(BaseModel):
    active: bool


class PreferencesUpdateRequest(BaseModel):
    email_digest: bool | None = None
    stale_reminders: bool | None = None
    browser_push: bool | None = None
    slack_integration: bool | None = None


def resolve_user_login(token: str) -> str:
    try:
        user = get_authenticated_user(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Invalid or expired GitHub token. {exc}")

    login = user.get("login")
    if not login:
        raise HTTPException(status_code=401, detail="Unable to resolve GitHub user for this token.")
    return login


@router.get("/state")
def read_dashboard_state(token: str):
    return get_dashboard_state(resolve_user_login(token))


@router.get("/repos")
def read_dashboard_repositories(token: str):
    return {"repositories": list_repositories(resolve_user_login(token))}


@router.post("/repos", status_code=201)
def add_dashboard_repository(payload: RepositoryCreateRequest, token: str):
    return create_repository(resolve_user_login(token), name=payload.name, org=payload.org)


@router.patch("/repos/{repo_id}")
def edit_dashboard_repository(repo_id: int, payload: RepositoryUpdateRequest, token: str):
    repo = update_repository(resolve_user_login(token), repo_id=repo_id, active=payload.active)
    if repo is None:
        raise HTTPException(status_code=404, detail="Repository not found.")
    return repo


@router.get("/rules")
def read_dashboard_rules(token: str):
    return {"rules": list_rules(resolve_user_login(token))}


@router.post("/rules", status_code=201)
def add_dashboard_rule(payload: RuleCreateRequest, token: str):
    return create_rule(resolve_user_login(token), name=payload.name, label=payload.label, action=payload.action)


@router.patch("/rules/{rule_id}")
def edit_dashboard_rule(rule_id: int, payload: RuleUpdateRequest, token: str):
    rule = update_rule(resolve_user_login(token), rule_id=rule_id, active=payload.active)
    if rule is None:
        raise HTTPException(status_code=404, detail="Rule not found.")
    return rule


@router.delete("/rules/{rule_id}", status_code=204)
def remove_dashboard_rule(rule_id: int, token: str):
    deleted = delete_rule(resolve_user_login(token), rule_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Rule not found.")


@router.get("/preferences")
def read_dashboard_preferences(token: str):
    return get_preferences(resolve_user_login(token))


@router.patch("/preferences")
def edit_dashboard_preferences(payload: PreferencesUpdateRequest, token: str):
    updates = payload.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No preference updates provided.")
    return update_preferences(resolve_user_login(token), updates)
