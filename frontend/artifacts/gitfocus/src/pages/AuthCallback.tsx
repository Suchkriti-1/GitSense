import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { fetchCurrentUser, normalizeUser } from "@/lib/api";
import { useAuth } from "@/App";

export default function AuthCallback() {
  const [, navigate] = useLocation();
  const { completeAuth } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function finishAuth() {
      const params = new URLSearchParams(window.location.search);
      const token = params.get("token");

      if (!token) {
        if (!cancelled) {
          setError("GitHub sign-in did not return an access token.");
        }
        return;
      }

      try {
        const login = params.get("login");
        const name = params.get("name");
        const avatarUrl = params.get("avatar_url");

        const user =
          login || name
            ? normalizeUser({
                login: login ?? undefined,
                name: name ?? undefined,
                avatar_url: avatarUrl ?? undefined,
              })
            : await fetchCurrentUser(token);

        if (!cancelled) {
          completeAuth(token, user);
          navigate("/dashboard", { replace: true });
        }
      } catch (authError) {
        if (!cancelled) {
          setError(
            authError instanceof Error ? authError.message : "Unable to complete GitHub sign-in.",
          );
        }
      }
    }

    void finishAuth();

    return () => {
      cancelled = true;
    };
  }, [completeAuth, navigate]);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-3xl font-bold mb-4">Connecting your GitHub account</h1>
        <p className="text-white/50">
          {error ?? "Finalizing your session and loading your dashboard..."}
        </p>
        {error && (
          <button
            onClick={() => navigate("/", { replace: true })}
            className="mt-6 px-5 py-3 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition-colors"
          >
            Back to home
          </button>
        )}
      </div>
    </div>
  );
}
