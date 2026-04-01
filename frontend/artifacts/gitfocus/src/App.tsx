import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import AuthCallback from "@/pages/AuthCallback";
import ConnectedDashboard from "@/pages/ConnectedDashboard";
import { AuthUser, buildGithubLoginUrl, fetchCurrentUser } from "@/lib/api";

const queryClient = new QueryClient();
const AUTH_STORAGE_KEY = "gitfocus-auth";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  user: AuthUser | null;
  signIn: () => void;
  signOut: () => void;
  completeAuth: (token: string, user: AuthUser) => void;
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  token: null,
  user: null,
  signIn: () => {},
  signOut: () => {},
  completeAuth: () => {},
});

export const useAuth = () => useContext(AuthContext);

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth/callback" component={AuthCallback} />
      <Route path="/dashboard" component={ConnectedDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);

  const completeAuth = useCallback((nextToken: string, nextUser: AuthUser) => {
    setToken(nextToken);
    setUser(nextUser);
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: nextToken,
        user: nextUser,
      }),
    );
  }, []);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const signIn = useCallback(() => {
    window.location.href = buildGithubLoginUrl();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      const savedSession = localStorage.getItem(AUTH_STORAGE_KEY);

      if (!savedSession) {
        if (!cancelled) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const parsed = JSON.parse(savedSession) as { token?: string };

        if (!parsed.token) {
          throw new Error("Missing access token.");
        }

        const restoredUser = await fetchCurrentUser(parsed.token);

        if (!cancelled) {
          completeAuth(parsed.token, restoredUser);
        }
      } catch {
        if (!cancelled) {
          signOut();
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void restoreSession();

    return () => {
      cancelled = true;
    };
  }, [completeAuth, signOut]);

  const authValue = useMemo(
    () => ({
      isAuthenticated: Boolean(token && user),
      isLoading,
      token,
      user,
      signIn,
      signOut,
      completeAuth,
    }),
    [completeAuth, isLoading, signIn, signOut, token, user],
  );

  return (
    <AuthContext.Provider value={authValue}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthContext.Provider>
  );
}

export default App;
