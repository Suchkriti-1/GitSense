import { useEffect, useRef, useState, useCallback } from "react";
import {
  connectRealtimeWebSocket,
  fetchGitHubActivity,
  fetchNotifications,
  GitHubActivity,
  RealtimeUpdate,
  NotificationItem,
  NotificationSummary,
} from "@/lib/api";

export function useRealtimeDashboard(token: string | null) {
  const [activity, setActivity] = useState<GitHubActivity | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [summary, setSummary] = useState<NotificationSummary | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionMode, setConnectionMode] = useState<"live" | "polling" | "offline">("offline");
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const prevNotificationIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const hasSnapshotRef = useRef(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!token) return;

    try {
      const ws = connectRealtimeWebSocket(token);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        setConnectionMode("live");
        setError(null);
      };

      ws.onmessage = (event) => {
        try {
          const update: RealtimeUpdate = JSON.parse(event.data);

          if (update.type === "dashboard_update") {
            if (update.notifications) {
              const currentIds = new Set(update.notifications.map((item) => item.id));
              if (initializedRef.current) {
                const newNotifications = update.notifications.filter(
                  (item) => !prevNotificationIdsRef.current.has(item.id),
                );
                if (newNotifications.length > 0) {
                  audioRef.current?.play().catch(() => {});
                }
              }
              prevNotificationIdsRef.current = currentIds;
              initializedRef.current = true;
              setNotifications(update.notifications);
            }
            if (update.summary) {
              setSummary(update.summary);
            }
            if (update.activity) {
              setActivity(update.activity);
            }
            setLastUpdate(new Date());
          } else if (update.type === "error") {
            setError(update.message || "Connection error");
          }
        } catch (err) {
          console.error("Failed to parse WebSocket message:", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        setConnectionMode((current) => (hasSnapshotRef.current ? "polling" : current === "live" ? "offline" : current));
        wsRef.current = null;

        // Auto-reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 5000);
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        setConnectionMode((current) => (hasSnapshotRef.current ? "polling" : current));
        setError("Live connection unavailable. Refreshing automatically.");
      };

    } catch (err) {
      console.error("Failed to connect WebSocket:", err);
      setConnectionMode((current) => (hasSnapshotRef.current ? "polling" : current));
      setError("Live connection unavailable. Refreshing automatically.");
    }
  }, [token]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
  }, []);

  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
    audioRef.current.volume = 0.5;
  }, []);

  const fetchInitialData = useCallback(async () => {
    if (!token) return;

    try {
      const [activityData, notificationsData] = await Promise.all([
        fetchGitHubActivity(token),
        fetchNotifications(token),
      ]);

      setActivity(activityData);
      setNotifications(notificationsData.notifications);
      setSummary(notificationsData.summary);
      prevNotificationIdsRef.current = new Set(notificationsData.notifications.map((item) => item.id));
      initializedRef.current = true;
      hasSnapshotRef.current = true;
      setLastUpdate(new Date());
      setConnectionMode((current) => (current === "live" ? current : "polling"));
      setError(null);
    } catch (err) {
      console.error("Failed to fetch initial activity:", err);
      setConnectionMode(hasSnapshotRef.current ? "polling" : "offline");
      setError(hasSnapshotRef.current ? "Live refresh is temporarily delayed." : "Failed to load activity data");
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      void fetchInitialData();
      // Establish WebSocket connection for real-time updates
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [token, connect, disconnect, fetchInitialData]);

  useEffect(() => {
    if (!token) return undefined;

    const interval = window.setInterval(() => {
      void fetchInitialData();
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [fetchInitialData, token]);

  return {
    activity,
    notifications,
    summary,
    isConnected,
    connectionMode,
    error,
    lastUpdate,
    refetch: fetchInitialData,
  };
}

// Keep the old hook for backward compatibility
export function useRealtimeActivity(token: string | null) {
  const { activity, isConnected, error, lastUpdate, refetch } = useRealtimeDashboard(token);

  return {
    activity,
    isConnected,
    error,
    lastUpdate,
    refetch,
  };
}
