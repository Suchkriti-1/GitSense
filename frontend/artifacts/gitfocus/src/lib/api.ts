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

export interface DashboardTrackedRepo {
  id: number;
  name: string;
  org: string;
  active: boolean;
  stars: number;
}

export interface DashboardRule {
  id: number;
  name: string;
  active: boolean;
  trigger: string;
  action: "Always notify" | "Priority alert" | "Silent / archive";
  count: number;
}

export interface DashboardPreferences {
  email_digest: boolean;
  stale_reminders: boolean;
  browser_push: boolean;
  slack_integration: boolean;
}

export interface DashboardState {
  repositories: DashboardTrackedRepo[];
  rules: DashboardRule[];
  preferences: DashboardPreferences;
}

const rawApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  import.meta.env.VITE_API_URL?.trim();
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
  return apiRequest<T>("GET", path, { params });
}

async function apiRequest<T>(
  method: string,
  path: string,
  options?: {
    params?: Record<string, string | number | boolean>;
    body?: unknown;
  },
) {
  const search = new URLSearchParams();

  if (options?.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      search.set(key, String(value));
    });
  }

  const url = `${API_BASE_URL}${path}${search.size ? `?${search.toString()}` : ""}`;
  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers: options?.body ? { "Content-Type": "application/json" } : undefined,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error(`Unable to reach API at ${API_BASE_URL}. Check your frontend env and backend server.`);
  }

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

  if (response.status === 204) {
    return undefined as T;
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

export async function fetchDashboardState(token: string) {
  return apiGet<DashboardState>("/dashboard/state", { token });
}

export async function createTrackedRepository(token: string, name: string, org?: string) {
  return apiRequest<DashboardTrackedRepo>("POST", "/dashboard/repos", {
    params: { token },
    body: { name, org },
  });
}

export async function updateTrackedRepository(token: string, repoId: number, active: boolean) {
  return apiRequest<DashboardTrackedRepo>("PATCH", `/dashboard/repos/${repoId}`, {
    params: { token },
    body: { active },
  });
}

export async function createDashboardRule(
  token: string,
  payload: { name: string; label: string; action: DashboardRule["action"] },
) {
  return apiRequest<DashboardRule>("POST", "/dashboard/rules", {
    params: { token },
    body: payload,
  });
}

export async function updateDashboardRule(token: string, ruleId: number, active: boolean) {
  return apiRequest<DashboardRule>("PATCH", `/dashboard/rules/${ruleId}`, {
    params: { token },
    body: { active },
  });
}

export async function deleteDashboardRule(token: string, ruleId: number) {
  return apiRequest<void>("DELETE", `/dashboard/rules/${ruleId}`, {
    params: { token },
  });
}

export async function updateDashboardPreferences(
  token: string,
  updates: Partial<DashboardPreferences>,
) {
  return apiRequest<DashboardPreferences>("PATCH", "/dashboard/preferences", {
    params: { token },
    body: updates,
  });
}

// Real-time API functions
export interface GitHubActivity {
  issues: any[];
  pull_requests: any[];
  total_issues: number;
  total_prs: number;
}

export interface RealtimeUpdate {
  type: "initial_data" | "updates" | "dashboard_update" | "error";
  data?: GitHubActivity;
  notifications?: NotificationItem[];
  summary?: NotificationSummary;
  activity?: GitHubActivity;
  rule_counts?: any;
  changes?: {
    new_issues?: any[];
    new_prs?: any[];
    status_changes?: any[];
  };
  message?: string;
}

export async function fetchGitHubActivity(token: string): Promise<GitHubActivity> {
  return apiGet<GitHubActivity>("/realtime/activity", { token });
}

export function connectRealtimeWebSocket(token: string): WebSocket {
  const wsUrl = API_BASE_URL.replace(/^http/, "ws") + `/realtime/ws?token=${encodeURIComponent(token)}`;
  return new WebSocket(wsUrl);
}
