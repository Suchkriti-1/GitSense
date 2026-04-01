export interface AuthUser {
  name: string;
  handle: string;
  avatarUrl?: string;
  avatar: string;
}

export interface Repo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  html_url: string;
  description: string | null;
  updated_at: string;
  stargazers_count: number;
  owner: {
    login: string;
  };
}

export interface NotificationItem {
  id: string;
  repository: string;
  type: string;
  title: string;
  url: string | null;
  reason: string;
  important: boolean;
  priority: "high" | "medium" | "low";
  category: string;
  updated_at: string;
}

export interface NotificationSummary {
  total: number;
  high_priority: number;
  medium_priority: number;
  low_priority: number;
  mentions: number;
  tasks: number;
  reviews: number;
}

export interface NotificationsResponse {
  notifications: NotificationItem[];
  summary: NotificationSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
export const API_BASE_URL = (rawApiBaseUrl || "http://localhost:8000").replace(/\/$/, "");

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function normalizeUser(user: {
  login?: string;
  name?: string;
  avatar_url?: string;
  avatarUrl?: string;
}): AuthUser {
  const handle = user.login ?? "";
  const name = user.name?.trim() || handle;

  return {
    name,
    handle,
    avatarUrl: user.avatar_url ?? user.avatarUrl,
    avatar: getInitials(name || handle || "GH"),
  };
}

async function apiGet<T>(path: string, params?: Record<string, string | number | boolean>) {
  const search = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      search.set(key, String(value));
    });
  }

  const url = `${API_BASE_URL}${path}${search.size ? `?${search.toString()}` : ""}`;
  const response = await fetch(url);

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const data = await response.json();
      if (typeof data.detail === "string") {
        message = data.detail;
      }
    } catch {
      // Ignore invalid JSON responses and keep the status-based message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function buildGithubLoginUrl() {
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  const frontendRedirect = `${window.location.origin}${basePath}`;
  const search = new URLSearchParams({ frontend_redirect: frontendRedirect });

  return `${API_BASE_URL}/auth/login?${search.toString()}`;
}

export async function fetchCurrentUser(token: string) {
  const user = await apiGet<{ login: string; name: string; avatar_url?: string }>("/auth/me", { token });
  return normalizeUser(user);
}

export async function fetchRepositories(token: string) {
  const data = await apiGet<{ repositories: Repo[] }>("/repos", { token });
  return data.repositories;
}

export async function fetchNotifications(token: string, important = false, limit = 50) {
  return apiGet<NotificationsResponse>("/notifications", {
    token,
    important,
    page: 1,
    limit,
  });
}
