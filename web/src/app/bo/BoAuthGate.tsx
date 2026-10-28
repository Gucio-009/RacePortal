/**
 * Brama BO: tylko zalogowany ADMIN. Non-admin → wylogowanie + komunikat.
 */
import { ReactNode, useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export function BoAuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, isLoading, logout, refreshSession } = useAuth();
  const location = useLocation();
  const [roleRefreshing, setRoleRefreshing] = useState(false);
  const deniedToast = useRef(false);
  const refreshAttempted = useRef(false);

  useEffect(() => {
    refreshAttempted.current = false;
  }, []);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    if (user.role === "ADMIN") return;
    if (refreshAttempted.current) return;
    refreshAttempted.current = true;
    let cancelled = false;
    setRoleRefreshing(true);
    void refreshSession().finally(() => {
      if (!cancelled) setRoleRefreshing(false);
    });
    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated, user, refreshSession]);

  useEffect(() => {
    if (isLoading || roleRefreshing) return;
    if (!isAuthenticated || !user) return;
    if (user.role === "ADMIN") return;
    if (deniedToast.current) return;
    deniedToast.current = true;
    toast.error("Brak dostępu do backoffice. Wymagana rola ADMIN.");
    logout();
  }, [isLoading, roleRefreshing, isAuthenticated, user, logout]);

  if (isLoading || roleRefreshing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--race-bg)] text-[var(--race-muted)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--race-accent)]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/logowanie" replace state={{ from: location.pathname }} />;
  }

  if (user?.role !== "ADMIN") {
    return <Navigate to="/logowanie" replace />;
  }

  return <>{children}</>;
}
