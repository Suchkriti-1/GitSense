from __future__ import annotations

import requests


def _github_headers(token: str, use_bearer: bool = False):
    scheme = "Bearer" if use_bearer else "token"
    return {
        "Authorization": f"{scheme} {token}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

def get_user_repos(token: str):
    url = "https://api.github.com/user/repos"
    headers = _github_headers(token)

    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        raise Exception("Failed to fetch user repositories from GitHub.")
    
    data = response.json()
    return data


def get_authenticated_user(token: str):
    url = "https://api.github.com/user"
    headers = _github_headers(token)

    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        raise Exception("Failed to fetch authenticated user from GitHub.")

    return response.json()

def github_notifications(token: str):
    url = "https://api.github.com/notifications"
    headers = _github_headers(token, use_bearer=True)

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data

    except requests.exceptions.RequestException as e:
        raise Exception(f"Error fetching notifications: {str(e)}")


def _normalize_rule_trigger(trigger: str) -> str:
    return trigger.strip().lower()


def _fetch_subject_details(token: str, url: str | None, cache: dict[str, dict]) -> dict:
    if not url:
        return {}
    if url in cache:
        return cache[url]

    response = requests.get(url, headers=_github_headers(token))
    if response.status_code != 200:
        cache[url] = {}
        return {}

    data = response.json()
    cache[url] = data if isinstance(data, dict) else {}
    return cache[url]


def _extract_labels(details: dict) -> list[str]:
    labels = details.get("labels", [])
    return [
        label.get("name", "").strip().lower()
        for label in labels
        if isinstance(label, dict) and label.get("name")
    ]


def _apply_rule_overrides(reason: str | None, labels: list[str], rules: list[dict]):
    priority = None
    important = None
    matched_rule_ids: list[int] = []

    for rule in rules:
        if not rule.get("active", False):
            continue

        trigger = _normalize_rule_trigger(str(rule.get("trigger", "")))
        matched = False

        if trigger == "assigned to me" and reason == "assign":
            matched = True
        elif "mentioned" in trigger and reason == "mention":
            matched = True
        elif trigger == "review requested" and reason == "review_requested":
            matched = True
        elif trigger.startswith('label: "'):
            label_name = trigger[len('label: "') : -1] if trigger.endswith('"') else trigger.replace("label:", "").strip()
            matched = label_name in labels

        if not matched:
            continue

        matched_rule_ids.append(int(rule["id"]))
        action = str(rule.get("action", "")).strip().lower()

        if action == "silent / archive":
            return {"exclude": True, "matched_rule_ids": matched_rule_ids}
        if action == "priority alert":
            priority = "high"
            important = True
        elif action == "always notify":
            if priority != "high":
                priority = "medium"
            important = True

    return {
        "exclude": False,
        "matched_rule_ids": matched_rule_ids,
        "priority": priority,
        "important": important,
    }


def filter_notifications(
    notifications,
    only_important=False,
    token: str | None = None,
    tracked_repositories: list[dict] | None = None,
    rules: list[dict] | None = None,
):
    filtered = []
    tracked_repo_names = {
        f"{repo.get('org', '').strip().lower()}/{repo.get('name', '').strip().lower()}"
        for repo in (tracked_repositories or [])
        if repo.get("active")
    }
    rule_counts: dict[int, int] = {}
    subject_cache: dict[str, dict] = {}

    for n in notifications:
        subject = n.get("subject", {})
        repo = n.get("repository", {})
        repository_name = (repo.get("full_name") or "").strip()
        repository_key = repository_name.lower()

        if tracked_repo_names and repository_key not in tracked_repo_names:
            continue

        reason = n.get("reason")

        if reason in ["mention", "assign"]:
            important = True
            priority = "high"
        elif reason in ["author", "review_requested"]:
            important = True
            priority = "medium"
        else:
            important = False
            priority = "low"

        if reason == "mention":
            category = "direct"
        elif reason == "assign":
            category = "task"
        if reason == "mention":
            category = "direct"
        elif reason == "assign":
            category = "task"
        elif reason == "review_requested":
            category = "review"
        elif reason == "comment":
            category = "activity"
        else:
            category = "other"

        details = _fetch_subject_details(token, subject.get("url"), subject_cache) if token else {}
        labels = _extract_labels(details)
        rule_result = _apply_rule_overrides(reason, labels, rules or [])

        if rule_result.get("exclude"):
            for rule_id in rule_result.get("matched_rule_ids", []):
                rule_counts[rule_id] = rule_counts.get(rule_id, 0) + 1
            continue

        if rule_result.get("priority"):
            priority = rule_result["priority"]
        if rule_result.get("important") is not None:
            important = bool(rule_result["important"])

        for rule_id in rule_result.get("matched_rule_ids", []):
            rule_counts[rule_id] = rule_counts.get(rule_id, 0) + 1

        item = {
            "id": n.get("id"),
            "repository": repository_name,
            "type": subject.get("type"),
            "title": subject.get("title"),
            "url": subject.get("url"),
            "reason": reason,
            "important": important,
            "priority": priority,
            "category": category,
            "updated_at": n.get("updated_at"),
            "labels": labels,
        }

        if not only_important or important:
            filtered.append(item)


    priority_order = {
    "high": 3,
    "medium": 2,
    "low": 1
    }

    filtered.sort(
        key=lambda x: (
            priority_order.get(x.get("priority", "low")),
            x.get("updated_at", "")
        ),
        reverse=True
    )

    return filtered, rule_counts

def generate_summary(notifications):
    summary = {
        "total": len(notifications),
        "high_priority": sum(1 for n in notifications if n.get("priority") == "high"),
        "medium_priority": sum(1 for n in notifications if n.get("priority") == "medium"),
        "low_priority": sum(1 for n in notifications if n.get("priority") == "low"),
        "mentions": sum(1 for n in notifications if n.get("reason") == "mention"),
        "tasks": sum(1 for n in notifications if n.get("reason") == "assign"),
        "reviews": sum(1 for n in notifications if n.get("reason") == "review_requested"),
    }

    return summary
