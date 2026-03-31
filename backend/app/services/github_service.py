import requests

def get_user_repos(token: str):
    url = "https://api.github.com/user/repos"
    headers = {"Authorization": f"token {token}",
               "Accept": "application/vnd.github.v3+json"
    }

    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        raise Exception("Failed to fetch user repositories from GitHub.")
    
    data = response.json()
    return data


def get_authenticated_user(token: str):
    url = "https://api.github.com/user"
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }

    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        raise Exception("Failed to fetch authenticated user from GitHub.")

    return response.json()

def github_notifications(token: str):
    url = "https://api.github.com/notifications"
    headers = {
    "Authorization": f"Bearer {token}",
    "Accept": "application/vnd.github+json"
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        data = response.json()
        return data 
    
    except requests.exceptions.RequestException as e:
        raise Exception(f"Error fetching notifications: {str(e)}")


def filter_notifications(notifications, only_important=False):
    filtered = []

    for n in notifications:
        subject = n.get("subject", {})
        repo = n.get("repository", {})

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

        item = {
            "id": n.get("id"),
            "repository": repo.get("full_name"),
            "type": subject.get("type"),
            "title": subject.get("title"),
            "url": subject.get("url"),
            "reason": reason,
            "important": important,
            "priority": priority,
            "category": category,
            "updated_at": n.get("updated_at")
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

    return filtered

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
