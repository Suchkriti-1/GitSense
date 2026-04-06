import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { useAuth } from "@/App";
import {
  GitPullRequest, AlertTriangle, Clock, Bell, Settings,
  Filter, Tag, MessageSquare, Search, LogOut,
  CheckSquare, Flame, RefreshCw, Eye, Star, BookOpen, Plus, X,
  ArrowUpRight, Zap, Users, Shield, Check, MoreHorizontal,
} from "lucide-react";

const INITIAL_REPOS = [
  { id: 1, name: "frontend-core", org: "acme-inc", active: true, stars: 412 },
  { id: 2, name: "backend-api", org: "acme-inc", active: true, stars: 208 },
  { id: 3, name: "design-system", org: "acme-inc", active: true, stars: 95 },
  { id: 4, name: "mobile-app", org: "acme-inc", active: false, stars: 67 },
  { id: 5, name: "docs", org: "acme-inc", active: false, stars: 31 },
];

const ITEMS = [
  { id: 1, type: "pr", repo: "frontend-core", num: "#142", title: "Fix hydration mismatch in Header component on SSR pages", author: "sarah-k", assignee: "alexchen", status: "Needs Review", statusColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", dot: "bg-yellow-400", labels: ["bug", "ssr"], comments: 4, time: "2h ago", priority: "high" },
  { id: 2, type: "issue", repo: "backend-api", num: "#89", title: "Add rate limiting to all public API endpoints before launch", author: "marcus-r", assignee: "alexchen", status: "Overdue", statusColor: "bg-red-500/10 text-red-400 border-red-500/20", dot: "bg-red-400", labels: ["urgent", "security"], comments: 12, time: "3d ago", priority: "critical" },
  { id: 3, type: "pr", repo: "frontend-core", num: "#140", title: "Update framer-motion dependency to v11 and fix breaking changes", author: "bot-dependabot", assignee: "alexchen", status: "Mentioned", statusColor: "bg-blue-500/10 text-blue-400 border-blue-500/20", dot: "bg-blue-400", labels: ["dependencies"], comments: 1, time: "5h ago", priority: "medium" },
  { id: 4, type: "discussion", repo: "design-system", num: "D#14", title: "Proposal: Migrate color tokens to CSS custom properties across all components", author: "priya-d", assignee: null, status: "Stale", statusColor: "bg-white/5 text-white/50 border-white/10", dot: "bg-white/30", labels: ["design", "RFC"], comments: 8, time: "6d ago", priority: "low" },
  { id: 5, type: "pr", repo: "backend-api", num: "#95", title: "Implement WebSocket support for real-time notification delivery", author: "james-l", assignee: "alexchen", status: "Needs Review", statusColor: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", dot: "bg-yellow-400", labels: ["feature", "websocket"], comments: 6, time: "1d ago", priority: "high" },
  { id: 6, type: "issue", repo: "frontend-core", num: "#131", title: "Dark mode toggle breaks localStorage persistence after page reload", author: "alexchen", assignee: null, status: "Waiting", statusColor: "bg-purple-500/10 text-purple-400 border-purple-500/20", dot: "bg-purple-400", labels: ["bug", "ux"], comments: 3, time: "4h ago", priority: "medium" },
];

const INITIAL_RULES = [
  { id: 1, name: "My Assignments", active: true, trigger: "Assigned to me", action: "Always notify", count: 5 },
  { id: 2, name: "Direct Mentions", active: true, trigger: "@alexchen mentioned", action: "Always notify", count: 3 },
  { id: 3, name: "Urgent Label", active: true, trigger: 'Label: "urgent"', action: "Priority alert", count: 1 },
  { id: 4, name: "Mute Dependabot", active: true, trigger: "Author: dependabot", action: "Silent / archive", count: 0 },
  { id: 5, name: "Security Issues", active: false, trigger: 'Label: "security"', action: "Always notify", count: 0 },
];

const STALE = [
  { repo: "backend-api", num: "#76", title: "Awaiting your response on the caching strategy", days: 7, type: "pr" },
  { repo: "design-system", num: "D#14", title: "RFC: color token proposal needs your vote", days: 6, type: "discussion" },
  { repo: "frontend-core", num: "#128", title: "Review requested 5 days ago — no action taken", days: 5, type: "pr" },
];

type Tab = "action" | "waiting" | "repos" | "rules" | "stale" | "settings";

export default function Dashboard() {
  const { user, signOut } = useAuth();
  const [, navigate] = useLocation();
  const [activeTab, setActiveTab] = useState<Tab>("action");
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"all" | "pr" | "issue" | "discussion">("all");
  const [dismissedIds, setDismissedIds] = useState<number[]>([]);

  // Repos state
  const [repos, setRepos] = useState(INITIAL_REPOS);
  const [showAddRepo, setShowAddRepo] = useState(false);
  const [newRepoName, setNewRepoName] = useState("");
  const [newRepoOrg, setNewRepoOrg] = useState("");

  // Rules state
  const [rules, setRules] = useState(INITIAL_RULES);
  const [showAddRule, setShowAddRule] = useState(false);
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleLabel, setNewRuleLabel] = useState("");
  const [newRuleAction, setNewRuleAction] = useState("Always notify");

  const handleSignOut = () => { signOut(); navigate("/"); };

  // Notification sound + browser push
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [pushEnabled, setPushEnabled] = useState(false);

  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
    audioRef.current.volume = 0.5;
    setPushEnabled(Notification.permission === "granted");
  }, []);

  const requestPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      setPushEnabled(permission === "granted");
      return permission === "granted";
    }
    return false;
  };

  const sendNotification = (title: string, body: string) => {
    audioRef.current?.play().catch(() => {});
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.ico" });
    }
  };

  // Poll backend every 30 seconds for new notifications
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/notifications/check`, {
          headers: { Authorization: `Bearer ${user?.token}` },
        });
        const data = await res.json();
        if (data.hasNew) {
          sendNotification("Revv", data.message || "You have new items that need your attention.");
        }
      } catch (e) {}
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAddRepo = () => {
    if (!newRepoName.trim()) return;
    setRepos(prev => [...prev, {
      id: Date.now(),
      name: newRepoName.trim(),
      org: newRepoOrg.trim() || "your-org",
      active: true,
      stars: 0,
    }]);
    setNewRepoName("");
    setNewRepoOrg("");
    setShowAddRepo(false);
  };

  const handleToggleRepo = (id: number) => {
    setRepos(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const handleAddRule = () => {
    if (!newRuleName.trim() || !newRuleLabel.trim()) return;
    setRules(prev => [...prev, {
      id: Date.now(),
      name: newRuleName.trim(),
      trigger: `Label: "${newRuleLabel.trim()}"`,
      action: newRuleAction,
      active: true,
      count: 0,
    }]);
    setNewRuleName("");
    setNewRuleLabel("");
    setNewRuleAction("Always notify");
    setShowAddRule(false);
  };

  const handleToggleRule = (id: number) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  const handleDeleteRule = (id: number) => {
    setRules(prev => prev.filter(r => r.id !== id));
  };

  const filteredItems = ITEMS.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase()) || item.repo.toLowerCase().includes(search.toLowerCase());
    const matchesType = filterType === "all" || item.type === filterType;
    const notDismissed = !dismissedIds.includes(item.id);
    return matchesSearch && matchesType && notDismissed;
  });

  const STATS = [
    { label: "Needs Action", value: ITEMS.filter(i => !dismissedIds.includes(i.id)).length, icon: Flame, color: "text-orange-400" },
    { label: "Waiting on Others", value: 4, icon: Clock, color: "text-purple-400" },
    { label: "Stale Threads", value: 3, icon: RefreshCw, color: "text-red-400" },
    { label: "Tracked Repos", value: repos.filter(r => r.active).length, icon: BookOpen, color: "text-blue-400" },
  ];

  const navItems: { id: Tab; label: string; icon: any; count?: number }[] = [
    { id: "action", label: "Needs Action", icon: Flame, count: ITEMS.filter(i => !dismissedIds.includes(i.id)).length },
    { id: "waiting", label: "Waiting on Others", icon: Clock, count: 4 },
    { id: "repos", label: "Repositories", icon: BookOpen, count: repos.filter(r => r.active).length },
    { id: "rules", label: "Custom Rules", icon: Filter, count: rules.filter(r => r.active).length },
    { id: "stale", label: "Stale & Overdue", icon: RefreshCw, count: STALE.length },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="h-14 border-b border-white/[0.06] bg-black/90 backdrop-blur-md flex items-center px-4 md:px-6 gap-4 sticky top-0 z-40">
        <a href="/" className="mr-4 shrink-0 hover:opacity-75 transition-opacity">
          <span className="font-display font-bold text-lg tracking-tight">Revv</span>
        </a>
        <div className="flex-1 max-w-lg">
          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2">
            <Search size={14} className="text-white/30 shrink-0" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search PRs, issues, repos..." className="bg-transparent text-sm text-white placeholder:text-white/25 outline-none flex-1" />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <button className="relative text-white/40 hover:text-white transition-colors">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
          </button>
          <div className="flex items-center gap-2 pl-3 border-l border-white/10">
            <div className="w-7 h-7 bg-white/10 text-white text-xs font-bold rounded-full flex items-center justify-center">{user?.avatar}</div>
            <span className="text-sm text-white/60 hidden md:block">{user?.name}</span>
            <button onClick={handleSignOut} className="text-white/30 hover:text-white transition-colors ml-1" title="Sign out"><LogOut size={15} /></button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 border-r border-white/[0.06] bg-black flex-col hidden md:flex shrink-0 p-3">
          <div className="space-y-0.5 flex-1">
            {navItems.map((item) => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${activeTab === item.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70 hover:bg-white/[0.04]"}`}>
                <item.icon size={15} className="shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.count !== undefined && (
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-md min-w-[20px] text-center ${activeTab === item.id ? "bg-white/20 text-white" : "bg-white/[0.06] text-white/30"}`}>{item.count}</span>
                )}
              </button>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-white/[0.06]">
            <p className="text-white/20 text-xs font-mono uppercase tracking-wider px-3 mb-2">Tracked</p>
            {repos.filter(r => r.active).map((repo) => (
              <div key={repo.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white/40 hover:text-white/60 transition-colors cursor-pointer">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500/60 shrink-0" />
                <span className="truncate font-mono">{repo.name}</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-[#030303]">
          <AnimatePresence mode="wait">

            {activeTab === "action" && (
              <motion.div key="action" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="p-6 max-w-5xl mx-auto w-full">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                  {STATS.map((stat, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
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
                    <p className="text-sm text-white/30 mt-0.5">Items requiring your direct attention right now.</p>
                  </div>
                  <div className="flex bg-white/[0.04] border border-white/[0.08] rounded-xl p-1 text-xs gap-1">
                    {(["all", "pr", "issue", "discussion"] as const).map((f) => (
                      <button key={f} onClick={() => setFilterType(f)} className={`px-3 py-1.5 rounded-lg capitalize font-medium transition-all ${filterType === f ? "bg-white text-black" : "text-white/40 hover:text-white"}`}>{f}</button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  {filteredItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <CheckSquare size={40} className="text-white/10 mb-4" />
                      <p className="text-white/30 font-medium">All caught up!</p>
                      <p className="text-white/20 text-sm mt-1">No items match your current filter.</p>
                    </div>
                  )}
                  {filteredItems.map((item, i) => (
                    <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="group flex items-start gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/10 transition-all">
                      <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.dot}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-mono text-white/30">{item.repo}</span>
                          <span className="text-white/15 text-xs">•</span>
                          <span className="text-xs font-mono text-white/25">{item.num}</span>
                          {item.labels.map((label) => (
                            <span key={label} className="px-1.5 py-0.5 rounded-md bg-white/[0.06] text-white/30 text-xs font-mono">{label}</span>
                          ))}
                        </div>
                        <h3 className="text-white/90 text-sm font-medium leading-snug mb-2 truncate pr-4">{item.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-white/25">
                          <span className="flex items-center gap-1">
                            {item.type === "pr" ? <GitPullRequest size={12} /> : item.type === "issue" ? <AlertTriangle size={12} /> : <MessageSquare size={12} />}
                            {item.type.toUpperCase()}
                          </span>
                          <span className="flex items-center gap-1"><MessageSquare size={12} /> {item.comments}</span>
                          <span>{item.time}</span>
                          <span>by {item.author}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2.5 py-1 rounded-lg border text-xs font-medium ${item.statusColor}`}>{item.status}</span>
                        <button onClick={() => setDismissedIds(prev => [...prev, item.id])} className="opacity-0 group-hover:opacity-100 transition-opacity text-white/20 hover:text-white/60 p-1 rounded-lg hover:bg-white/5" title="Dismiss"><X size={14} /></button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "waiting" && (
              <motion.div key="waiting" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="p-6 max-w-5xl mx-auto w-full">
                <div className="mb-6">
                  <h1 className="text-xl font-display font-bold text-white">Waiting on Others</h1>
                  <p className="text-sm text-white/30 mt-0.5">Items you've contributed to — awaiting responses or reviews.</p>
                </div>
                <div className="space-y-2">
                  {[
                    { repo: "backend-api", num: "#91", title: "Auth middleware refactor — awaiting lead review", status: "Review Requested", icon: Eye, days: 2 },
                    { repo: "frontend-core", num: "#138", title: "Responsive table component — pending designer sign-off", status: "Design Review", icon: Users, days: 4 },
                    { repo: "design-system", num: "#22", title: "Button variant spec — waiting on product decision", status: "Blocked", icon: Shield, days: 8 },
                    { repo: "mobile-app", num: "#54", title: "Push notification handler — needs QA approval", status: "In QA", icon: Check, days: 1 },
                  ].map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-4 p-4 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
                      <div className="mt-1 w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <item.icon size={14} className="text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-white/30">{item.repo}</span>
                          <span className="text-white/15">•</span>
                          <span className="text-xs font-mono text-white/25">{item.num}</span>
                        </div>
                        <p className="text-white/80 text-sm font-medium truncate">{item.title}</p>
                        <p className="text-white/25 text-xs mt-1">Waiting {item.days} day{item.days !== 1 ? "s" : ""}</p>
                      </div>
                      <span className="text-xs font-medium text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg shrink-0">{item.status}</span>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "repos" && (
              <motion.div key="repos" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="p-6 max-w-5xl mx-auto w-full">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-xl font-display font-bold text-white">Repositories</h1>
                    <p className="text-sm text-white/30 mt-0.5">Manage which repositories you're tracking.</p>
                  </div>
                  <button onClick={() => setShowAddRepo(true)} className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-all">
                    <Plus size={15} /> Add Repo
                  </button>
                </div>

                {/* Add Repo inline form */}
                <AnimatePresence>
                  {showAddRepo && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="mb-4 p-5 rounded-2xl border border-white/10 bg-white/[0.04]">
                      <p className="text-sm font-semibold text-white mb-4">Add a repository to track</p>
                      <div className="flex gap-3 mb-3 items-center">
                        <input value={newRepoOrg} onChange={(e) => setNewRepoOrg(e.target.value)} placeholder="org or username"
                          className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/30 transition-colors" />
                        <span className="text-white/30 text-sm">/</span>
                        <input value={newRepoName} onChange={(e) => setNewRepoName(e.target.value)} placeholder="repository-name"
                          onKeyDown={(e) => e.key === "Enter" && handleAddRepo()}
                          className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/30 transition-colors" />
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleAddRepo} className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-all">Track Repo</button>
                        <button onClick={() => { setShowAddRepo(false); setNewRepoName(""); setNewRepoOrg(""); }} className="px-4 py-2 text-white/40 hover:text-white text-sm rounded-xl hover:bg-white/5 transition-all">Cancel</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  {repos.map((repo, i) => (
                    <motion.div key={repo.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs text-white/30 font-mono">{repo.org}/</span>
                          <span className="font-display font-semibold text-white">{repo.name}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/25 mt-1">
                          {repo.stars > 0 && <span className="flex items-center gap-1"><Star size={11} /> {repo.stars} stars</span>}
                          {repo.active && <span className="flex items-center gap-1 text-green-400/60">● Tracking active</span>}
                        </div>
                      </div>
                      <button onClick={() => handleToggleRepo(repo.id)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-all ${repo.active ? "bg-white border-white" : "bg-white/[0.04] border-white/10"}`}>
                        <span className={`inline-block h-4 w-4 rounded-full transition-transform ${repo.active ? "translate-x-6 bg-black" : "translate-x-1 bg-white/30"}`} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "rules" && (
              <motion.div key="rules" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="p-6 max-w-5xl mx-auto w-full">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-xl font-display font-bold text-white">Custom Rules</h1>
                    <p className="text-sm text-white/30 mt-0.5">Define what triggers a notification and what gets silenced.</p>
                  </div>
                  <button onClick={() => setShowAddRule(true)} className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-all">
                    <Plus size={15} /> New Rule
                  </button>
                </div>

                {/* Add Rule inline form */}
                <AnimatePresence>
                  {showAddRule && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="mb-4 p-5 rounded-2xl border border-white/10 bg-white/[0.04]">
                      <p className="text-sm font-semibold text-white mb-4">Create a new rule</p>
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-white/40 font-mono mb-1.5 block">Rule name</label>
                          <input value={newRuleName} onChange={(e) => setNewRuleName(e.target.value)} placeholder="e.g. UI/UX Improvements"
                            className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/30 transition-colors" />
                        </div>
                        <div>
                          <label className="text-xs text-white/40 font-mono mb-1.5 block">Label to match</label>
                          <div className="flex items-center gap-2 bg-white/[0.04] border border-white/10 rounded-xl px-4 py-2.5 focus-within:border-white/30 transition-colors">
                            <Tag size={13} className="text-white/30 shrink-0" />
                            <input value={newRuleLabel} onChange={(e) => setNewRuleLabel(e.target.value)} placeholder="e.g. ui-ux-improvement, bug, urgent"
                              className="bg-transparent text-sm text-white placeholder:text-white/25 outline-none flex-1" />
                          </div>
                          <p className="text-xs text-white/20 mt-1.5 px-1">Type the exact label name from your GitHub repository.</p>
                        </div>
                        <div>
                          <label className="text-xs text-white/40 font-mono mb-1.5 block">Action</label>
                          <div className="flex gap-2 flex-wrap">
                            {["Always notify", "Priority alert", "Silent / archive"].map((action) => (
                              <button key={action} onClick={() => setNewRuleAction(action)}
                                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all ${newRuleAction === action ? "bg-white text-black border-white" : "text-white/40 border-white/10 hover:border-white/20 hover:text-white/60"}`}>
                                {action}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <button onClick={handleAddRule} className="px-4 py-2 bg-white text-black text-sm font-semibold rounded-xl hover:bg-white/90 transition-all">Save Rule</button>
                        <button onClick={() => { setShowAddRule(false); setNewRuleName(""); setNewRuleLabel(""); }} className="px-4 py-2 text-white/40 hover:text-white text-sm rounded-xl hover:bg-white/5 transition-all">Cancel</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="space-y-2">
                  {rules.map((rule, i) => (
                    <motion.div key={rule.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="font-display font-semibold text-white text-sm">{rule.name}</span>
                          {rule.count > 0 && <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-md font-mono">{rule.count} matched</span>}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-white/30 font-mono">
                          <span className="flex items-center gap-1"><Zap size={11} /> IF {rule.trigger}</span>
                          <span className="text-white/15">→</span>
                          <span className="text-white/40">{rule.action}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleToggleRule(rule.id)}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-all ${rule.active ? "bg-white border-white" : "bg-white/[0.04] border-white/10"}`}>
                          <span className={`inline-block h-4 w-4 rounded-full transition-transform ${rule.active ? "translate-x-6 bg-black" : "translate-x-1 bg-white/30"}`} />
                        </button>
                        <button onClick={() => handleDeleteRule(rule.id)} className="text-white/20 hover:text-red-400 transition-colors" title="Delete rule">
                          <X size={15} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "stale" && (
              <motion.div key="stale" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="p-6 max-w-5xl mx-auto w-full">
                <div className="mb-6">
                  <h1 className="text-xl font-display font-bold text-white">Stale & Overdue</h1>
                  <p className="text-sm text-white/30 mt-0.5">Threads that have gone quiet and need a nudge.</p>
                </div>
                <div className="space-y-2">
                  {STALE.map((item, i) => (
                    <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                      className="flex items-start gap-4 p-5 rounded-2xl border border-red-500/10 bg-red-500/[0.03] hover:bg-red-500/[0.05] transition-all">
                      <div className="w-9 h-9 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                        <Clock size={16} className="text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-white/30">{item.repo}</span>
                          <span className="text-white/15">•</span>
                          <span className="text-xs font-mono text-white/25">{item.num}</span>
                        </div>
                        <p className="text-white/80 text-sm font-medium">{item.title}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">{item.days}d stale</span>
                        <button className="text-xs text-white/30 hover:text-white/60 bg-white/[0.04] px-3 py-1.5 rounded-lg transition-colors">Remind me</button>
                      </div>
                    </motion.div>
                  ))}
                </div>
                <div className="mt-8">
                  <h2 className="text-lg font-display font-bold text-white mb-4">Missed Issues</h2>
                  <div className="bg-orange-500/[0.04] border border-orange-500/10 rounded-2xl p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle size={16} className="text-orange-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-white/80">2 issues may have slipped through</p>
                        <p className="text-xs text-white/30 mt-0.5">These were labeled "urgent" or "bug" and had no response within 24h.</p>
                      </div>
                    </div>
                    {[
                      { repo: "backend-api", num: "#88", title: "Null pointer on user logout endpoint crashes server" },
                      { repo: "frontend-core", num: "#127", title: "Memory leak in infinite scroll component on mobile" },
                    ].map((issue, i) => (
                      <div key={i} className="flex items-center gap-3 py-2.5 border-t border-white/[0.04]">
                        <span className="text-xs font-mono text-orange-400/60">{issue.repo} {issue.num}</span>
                        <span className="text-sm text-white/60 flex-1 truncate">{issue.title}</span>
                        <button className="text-xs text-orange-400 hover:text-orange-300 transition-colors flex items-center gap-1">View <ArrowUpRight size={11} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="p-6 max-w-2xl mx-auto w-full">
                <div className="mb-8">
                  <h1 className="text-xl font-display font-bold text-white">Settings</h1>
                  <p className="text-sm text-white/30 mt-0.5">Manage your account and notification preferences.</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-4">
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 font-mono">Profile</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-lg font-bold">{user?.avatar}</div>
                    <div>
                      <p className="font-display font-bold text-white">{user?.name}</p>
                      <p className="text-sm text-white/40">@{user?.handle} · Connected via GitHub</p>
                    </div>
                    <button className="ml-auto text-sm text-white/40 hover:text-white border border-white/10 px-4 py-2 rounded-xl hover:bg-white/5 transition-all">Edit</button>
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-4">
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 font-mono">Notifications</h3>
                  <div className="space-y-4">
                    {[
                      { label: "Email digest", desc: "Daily summary of unread items", on: true },
                      { label: "Stale reminders", desc: "Notify after 5 days of inactivity", on: true },
                      { label: "Slack integration", desc: "Send alerts to your Slack workspace", on: false },
                    ].map((pref, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-white/80">{pref.label}</p>
                          <p className="text-xs text-white/30">{pref.desc}</p>
                        </div>
                        <button className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-all ${pref.on ? "bg-white border-white" : "bg-white/[0.04] border-white/10"}`}>
                          <span className={`inline-block h-4 w-4 rounded-full transition-transform ${pref.on ? "translate-x-6 bg-black" : "translate-x-1 bg-white/30"}`} />
                        </button>
                      </div>
                    ))}
                    {/* Browser push — functional */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/80">Browser push</p>
                        <p className="text-xs text-white/30">Real-time desktop notifications + sound</p>
                      </div>
                      <button
                        onClick={requestPermission}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full border transition-all ${pushEnabled ? "bg-white border-white" : "bg-white/[0.04] border-white/10"}`}>
                        <span className={`inline-block h-4 w-4 rounded-full transition-transform ${pushEnabled ? "translate-x-6 bg-black" : "translate-x-1 bg-white/30"}`} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                  <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider mb-4 font-mono">Danger Zone</h3>
                  <button onClick={handleSignOut} className="flex items-center gap-2 text-sm text-red-400 border border-red-500/20 bg-red-500/[0.04] px-4 py-2.5 rounded-xl hover:bg-red-500/10 transition-all">
                    <LogOut size={14} /> Sign out of Revv
                  </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
