import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CheckSquare,
  Clock,
  Filter,
  Flame,
  GitPullRequest,
  LogOut,
  MessageSquare,
  RefreshCw,
  Search,
  Settings,
  Star,
} from "lucide-react";
import { useAuth } from "@/App";
import { NotificationItem, NotificationSummary, Repo, fetchNotifications, fetchRepositories } from "@/lib/api";

const RULES = [
  { id: 1, name: "Direct Mentions", trigger: "@you mentioned", action: "Always notify" },
  { id: 2, name: "Assigned Work", trigger: "Assigned to you", action: "Push to top" },
  { id: 3, name: "Review Requests", trigger: "Review requested", action: "Mark medium priority" },
];

type Tab = "action" | "waiting" | "repos" | "rules" | "stale" | "settings";

function formatRelativeAge(value: string) {
  const updatedAt = new Date(value).getTime();
  const diffMs = Date.now() - updatedAt;

  if (Number.isNaN(updatedAt) || diffMs < 0) return "just now";

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "just now";
  if (diffHours < 24) return `${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return `${Math.floor(diffDays / 7)}w ago`;
}

function getNotificationIcon(type: string) {
  switch (type?.toLowerCase()) {
    case "pullrequest":
      return GitPullRequest;
    case "issue":
      return AlertTriangle;
    default:
      return MessageSquare;
  }
}

function getStatus(notification: NotificationItem) {
  if (notification.priority === "high") {
    return {
      label: "Needs Action",
      className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      dot: "bg-yellow-400",
    };
  }

  if (notification.priority === "medium") {
    return {
      label: "Watching",
      className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
      dot: "bg-blue-400",
    };
  }

  return {
    label: "Low Priority",
    className: "bg-white/5 text-white/50 border-white/10",
    dot: "bg-white/30",
  };
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <CheckSquare size={40} className="text-white/10 mb-4" />
      <p className="text-white/30 font-medium">{title}</p>
      <p className="text-white/20 text-sm mt-1">{copy}</p>
    </div>
  );
}

export default function ConnectedDashboard() {
  const { isAuthenticated, isLoading, user, token, signOut } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("action");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "pullrequest" | "issue" | "discussion">("all");
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [repositories, setRepositories] = useState<Repo[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      if (!token) {
        if (!cancelled) setLoadingData(false);
        return;
      }

      try {
        setLoadingData(true);
        setError(null);

        const [notificationsResponse, repositoriesResponse] = await Promise.all([
          fetchNotifications(token, false, 50),
          fetchRepositories(token),
        ]);

        if (!cancelled) {
          setNotifications(notificationsResponse.notifications);
          setSummary(notificationsResponse.summary);
          setRepositories(repositoriesResponse);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard data.");
        }
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    }

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const visibleNotifications = useMemo(
    () => notifications.filter((item) => !dismissedIds.includes(item.id)),
    [dismissedIds, notifications],
  );

  const filteredItems = useMemo(
    () =>
      visibleNotifications.filter((item) => {
        const haystack = `${item.title} ${item.repository}`.toLowerCase();
        const matchesSearch = haystack.includes(search.toLowerCase());
        const matchesType = filterType === "all" || item.type.toLowerCase() === filterType;
        return matchesSearch && matchesType;
      }),
    [filterType, search, visibleNotifications],
  );

  const actionItems = filteredItems.filter((item) => item.priority !== "low");
  const waitingItems = filteredItems.filter((item) => item.priority === "low");
  const staleItems = [...visibleNotifications]
    .filter((item) => Date.now() - new Date(item.updated_at).getTime() > 1000 * 60 * 60 * 24 * 3)
    .sort((a, b) => new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());

  const navItems = [
    { id: "action" as Tab, label: "Needs Action", icon: Flame, count: actionItems.length },
    { id: "waiting" as Tab, label: "Waiting on Others", icon: Clock, count: waitingItems.length },
    { id: "repos" as Tab, label: "Repositories", icon: BookOpen, count: repositories.length },
    { id: "rules" as Tab, label: "Custom Rules", icon: Filter, count: RULES.length },
    { id: "stale" as Tab, label: "Stale & Overdue", icon: RefreshCw, count: staleItems.length },
    { id: "settings" as Tab, label: "Settings", icon: Settings },
  ];

  const stats = [
    { label: "Needs Action", value: summary?.high_priority ?? 0, icon: Flame, color: "text-orange-400" },
    { label: "Waiting on Others", value: summary?.low_priority ?? 0, icon: Clock, color: "text-purple-400" },
    { label: "Stale Threads", value: staleItems.length, icon: RefreshCw, color: "text-red-400" },
    { label: "Tracked Repos", value: repositories.length, icon: BookOpen, color: "text-blue-400" },
  ];

  const handleSignOut = () => {
    signOut();
    navigate("/", { replace: true });
  };

  const recentNotifications = visibleNotifications.slice(0, 6);

  if (isLoading || (!isAuthenticated && !error)) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-white/50">Preparing your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="h-14 border-b border-white/[0.06] bg-black/90 backdrop-blur-md flex items-center px-4 md:px-6 gap-4 sticky top-0 z-40">
        <a href="/" className="mr-4 shrink-0 hover:opacity-75 transition-opacity">
          <span className="font-display font-bold text-lg tracking-tight">Revv</span>
        </a>

        <div className="flex-1 max-w-lg">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2">
            <Search size={14} className="text-white/30 shrink-0" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search PRs, issues, repos..."
              className="bg-transparent text-sm text-white placeholder:text-white/25 outline-none flex-1"
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <div className="relative">
          <button
            onClick={() => setNotificationsOpen((current) => !current)}
            className="relative text-white/40 hover:text-white transition-colors"
            title="Notifications"
          >
            <Bell size={18} />
            {summary && summary.total > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}
          </button>
          <AnimatePresence>
            {notificationsOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.16 }}
                className="absolute right-0 top-10 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-white/10 bg-[#080808] shadow-2xl shadow-black/40 overflow-hidden z-50"
              >
                <div className="px-4 py-3 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-white">Notifications</h3>
                      <p className="text-xs text-white/35">
                        {summary?.total ?? 0} total across your connected GitHub inbox
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab("action");
                        setNotificationsOpen(false);
                      }}
                      className="text-xs text-white/50 hover:text-white transition-colors"
                    >
                      Open dashboard
                    </button>
                  </div>
                </div>

                <div className="p-3 border-b border-white/5 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-2 py-2">
                    <p className="text-lg font-display font-bold text-white">{summary?.high_priority ?? 0}</p>
                    <p className="text-[11px] text-white/35">High</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-2 py-2">
                    <p className="text-lg font-display font-bold text-white">{summary?.reviews ?? 0}</p>
                    <p className="text-[11px] text-white/35">Reviews</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] px-2 py-2">
                    <p className="text-lg font-display font-bold text-white">{summary?.mentions ?? 0}</p>
                    <p className="text-[11px] text-white/35">Mentions</p>
                  </div>
                </div>

                <div className="max-h-[360px] overflow-y-auto p-2">
                  {recentNotifications.length === 0 ? (
                    <div className="px-3 py-8 text-center">
                      <p className="text-sm text-white/45">No notifications to show.</p>
                    </div>
                  ) : (
                    recentNotifications.map((item) => {
                      const Icon = getNotificationIcon(item.type);
                      const status = getStatus(item);

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.priority === "low" ? "waiting" : "action");
                            setNotificationsOpen(false);
                          }}
                          className="w-full text-left flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-white/[0.04] transition-colors"
                        >
                          <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${status.dot}`} />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon size={12} className="text-white/45 shrink-0" />
                              <span className="text-[11px] font-mono text-white/35 truncate">{item.repository}</span>
                            </div>
                            <p className="text-sm text-white/80 line-clamp-2">{item.title}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className={`text-[11px] px-2 py-0.5 rounded-md border ${status.className}`}>
                                {status.label}
                              </span>
                              <span className="text-[11px] text-white/30">{formatRelativeAge(item.updated_at)}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
          <div className="flex items-center gap-2 pl-3 border-l border-white/10">
            <div className="w-7 h-7 bg-white/10 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {user?.avatar}
            </div>
            <span className="text-sm text-white/60 hidden md:block">{user?.name}</span>
            <button onClick={handleSignOut} className="text-white/30 hover:text-white transition-colors ml-1" title="Sign out">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 border-r border-white/[0.06] bg-black flex-col hidden md:flex shrink-0 p-3">
          <div className="space-y-0.5 flex-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  activeTab === item.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"
                }`}
              >
                <item.icon size={15} className="shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.count !== undefined && <span className="text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center bg-white/[0.06] text-white/30">{item.count}</span>}
              </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <p className="text-white/20 text-xs font-mono uppercase tracking-wider px-3 mb-2">Tracked</p>
            {repositories.slice(0, 5).map((repo) => (
              <a
                key={repo.id}
                href={repo.html_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/60 transition-colors"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-green-500/60 shrink-0" />
                <span className="truncate font-mono">{repo.full_name}</span>
              </a>
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-[#030303]">
          {loadingData ? (
            <div className="p-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/50">Loading your GitHub data...</div>
            </div>
          ) : error ? (
            <div className="p-6">
              <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.05] p-6">
                <h1 className="text-lg font-display font-bold text-white mb-2">Dashboard unavailable</h1>
                <p className="text-sm text-white/60">{error}</p>
              </div>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "action" && (
                <motion.div key="action" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="p-6 max-w-5xl">
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                    {stats.map((stat) => (
                      <div key={stat.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-3">
                          <stat.icon size={15} className={stat.color} />
                          <span className="text-2xl font-display font-bold text-white">{stat.value}</span>
                        </div>
                        <p className="text-xs text-white/40">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h1 className="text-xl font-display font-bold text-white">Needs Action</h1>
                      <p className="text-sm text-white/30 mt-0.5">Live GitHub notifications that deserve your attention.</p>
                    </div>
                    <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 text-xs gap-1">
                      {(["all", "pullrequest", "issue", "discussion"] as const).map((type) => (
                        <button
                          key={type}
                          onClick={() => setFilterType(type)}
                          className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${filterType === type ? "bg-white text-black" : "text-white/40 hover:text-white"}`}
                        >
                          {type === "pullrequest" ? "pr" : type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {actionItems.length === 0 ? (
                      <EmptyState title="All caught up" copy="No high-signal items match your current filter." />
                    ) : (
                      actionItems.map((item, index) => {
                        const Icon = getNotificationIcon(item.type);
                        const status = getStatus(item);

                        return (
                          <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }} className="group flex items-start gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all">
                            <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${status.dot}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <span className="text-xs font-mono text-white/30">{item.repository}</span>
                                <span className="text-xs font-mono text-white/25">{item.reason}</span>
                              </div>
                              <h3 className="text-white/90 text-sm font-medium leading-snug mb-2 pr-4">{item.title}</h3>
                              <div className="flex items-center gap-3 text-xs text-white/25 flex-wrap">
                                <span className="flex items-center gap-1"><Icon size={12} />{item.type}</span>
                                <span>{formatRelativeAge(item.updated_at)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${status.className}`}>{status.label}</span>
                              <button onClick={() => setDismissedIds((current) => [...current, item.id])} className="opacity-0 group-hover:opacity-100 transition-opacity text-white/30 hover:text-white text-xs">Dismiss</button>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "waiting" && (
                <motion.div key="waiting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="p-6 max-w-5xl">
                  <div className="mb-6">
                    <h1 className="text-xl font-display font-bold text-white">Waiting on Others</h1>
                    <p className="text-sm text-white/30 mt-0.5">Lower-priority threads still worth keeping an eye on.</p>
                  </div>
                  <div className="space-y-2">
                    {waitingItems.length === 0 ? <EmptyState title="Nothing pending" copy="No lower-priority threads are waiting right now." /> : waitingItems.map((item) => {
                      const Icon = getNotificationIcon(item.type);
                      return (
                        <div key={item.id} className="flex items-start gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                          <div className="mt-1 w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                            <Icon size={14} className="text-purple-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-mono text-white/30">{item.repository}</span>
                              <span className="text-xs font-mono text-white/25">{item.reason}</span>
                            </div>
                            <p className="text-white/80 text-sm font-medium">{item.title}</p>
                            <p className="text-white/25 text-xs mt-1">{formatRelativeAge(item.updated_at)}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {activeTab === "repos" && (
                <motion.div key="repos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="p-6 max-w-5xl">
                  <div className="mb-6">
                    <h1 className="text-xl font-display font-bold text-white">Repositories</h1>
                    <p className="text-sm text-white/30 mt-0.5">Repositories available from your connected GitHub account.</p>
                  </div>
                  <div className="space-y-2">
                    {repositories.length === 0 ? <EmptyState title="No repositories found" copy="Your GitHub account did not return any repositories." /> : repositories.map((repo) => (
                      <a key={repo.id} href={repo.html_url} target="_blank" rel="noreferrer" className="flex items-center gap-4 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs text-white/30 font-mono">{repo.owner.login}/</span>
                            <span className="font-display font-semibold text-white">{repo.name}</span>
                            {repo.private && <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-md">Private</span>}
                          </div>
                          <p className="text-xs text-white/30 mt-1">{repo.description || "No description provided."}</p>
                          <div className="flex items-center gap-3 text-xs text-white/25 mt-2">
                            <span className="flex items-center gap-1"><Star size={11} /> {repo.stargazers_count} stars</span>
                            <span>Updated {formatRelativeAge(repo.updated_at)}</span>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "rules" && (
                <motion.div key="rules" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="p-6 max-w-5xl">
                  <div className="mb-6">
                    <h1 className="text-xl font-display font-bold text-white">Custom Rules</h1>
                    <p className="text-sm text-white/30 mt-0.5">Current prioritization logic applied to your GitHub notifications.</p>
                  </div>
                  <div className="space-y-2">
                    {RULES.map((rule) => (
                      <div key={rule.id} className="flex items-center gap-4 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <span className="font-display font-semibold text-white text-sm">{rule.name}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-white/30 font-mono">
                            <span>IF {rule.trigger}</span>
                            <span className="text-white/15">then</span>
                            <span className="text-white/40">{rule.action}</span>
                          </div>
                        </div>
                        <span className="text-xs bg-white/10 text-white/70 px-2 py-1 rounded-md">Active</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "stale" && (
                <motion.div key="stale" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="p-6 max-w-5xl">
                  <div className="mb-6">
                    <h1 className="text-xl font-display font-bold text-white">Stale & Overdue</h1>
                    <p className="text-sm text-white/30 mt-0.5">Notifications that have been quiet for more than three days.</p>
                  </div>
                  <div className="space-y-2">
                    {staleItems.length === 0 ? <EmptyState title="No stale threads" copy="Everything recent is still fresh." /> : staleItems.map((item) => (
                      <div key={item.id} className="flex items-start gap-4 p-5 rounded-2xl border border-red-500/10 bg-red-500/[0.03]">
                        <div className="w-9 h-9 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                          <Clock size={16} className="text-red-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono text-white/30">{item.repository}</span>
                            <span className="text-xs font-mono text-white/25">{item.reason}</span>
                          </div>
                          <p className="text-white/80 text-sm font-medium">{item.title}</p>
                        </div>
                        <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">{formatRelativeAge(item.updated_at)}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="p-6 max-w-2xl">
                  <div className="mb-8">
                    <h1 className="text-xl font-display font-bold text-white">Settings</h1>
                    <p className="text-sm text-white/30 mt-0.5">Connected account details and notification totals.</p>
                  </div>

                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-4">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 font-mono">Profile</h3>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-lg font-bold">{user?.avatar}</div>
                      <div>
                        <p className="font-display font-bold text-white">{user?.name}</p>
                        <p className="text-sm text-white/40">@{user?.handle} connected via GitHub</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-4">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 font-mono">Overview</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between"><span className="text-sm text-white/70">Total notifications</span><span className="text-sm font-semibold text-white">{summary?.total ?? 0}</span></div>
                      <div className="flex items-center justify-between"><span className="text-sm text-white/70">Mentions</span><span className="text-sm font-semibold text-white">{summary?.mentions ?? 0}</span></div>
                      <div className="flex items-center justify-between"><span className="text-sm text-white/70">Assignments</span><span className="text-sm font-semibold text-white">{summary?.tasks ?? 0}</span></div>
                      <div className="flex items-center justify-between"><span className="text-sm text-white/70">Review requests</span><span className="text-sm font-semibold text-white">{summary?.reviews ?? 0}</span></div>
                    </div>
                  </div>

                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 font-mono">Session</h3>
                    <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-red-400 border border-red-500/20 bg-red-500/[0.04] px-4 py-2.5 rounded-xl hover:bg-red-500/10 transition-all">
                      <LogOut size={14} /> Sign out of Revv
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}
