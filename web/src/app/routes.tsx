/**
 * routes.tsx — drzewo tras React Router v7 (`createBrowserRouter`).
 *
 * Layout: `RootLayout` na `/` z `<Outlet />` (+ Suspense) dla dzieci.
 * HomePage eager (LCP); pozostałe strony = `React.lazy` (mniej unused JS na /).
 * AuthGate: bootstrap JWT, opcjonalny filtr `roles`.
 *
 * Docker/nginx: try_files $uri /index.html — bez tego odświeżenie `/organizer` = 404.
 */

import { createBrowserRouter, Navigate } from "react-router";
import { lazy, ReactNode, useEffect, useRef, useState } from "react";
import { RootLayout } from "./components/RootLayout";
import { HomePage } from "./pages/HomePage";
import { useAuth } from "./context/AuthContext";
import type { UserRole } from "./lib/types";
import { Loader2 } from "lucide-react";

const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazy(() =>
  import("./pages/RegisterPage").then((m) => ({ default: m.RegisterPage })),
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const EventsPage = lazy(() =>
  import("./pages/EventsPage").then((m) => ({ default: m.EventsPage })),
);
const EventDetailPage = lazy(() =>
  import("./pages/EventDetailPage").then((m) => ({ default: m.EventDetailPage })),
);
const ResultsPage = lazy(() =>
  import("./pages/ResultsPage").then((m) => ({ default: m.ResultsPage })),
);
const ArchivePage = lazy(() =>
  import("./pages/ArchivePage").then((m) => ({ default: m.ArchivePage })),
);
const GalleryPage = lazy(() =>
  import("./pages/GalleryPage").then((m) => ({ default: m.GalleryPage })),
);
const ForgotPasswordPage = lazy(() =>
  import("./pages/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage })),
);
const VerifyEmailPage = lazy(() =>
  import("./pages/VerifyEmailPage").then((m) => ({ default: m.VerifyEmailPage })),
);
const GaragePage = lazy(() =>
  import("./pages/GaragePage").then((m) => ({ default: m.GaragePage })),
);
const AdminPanelPage = lazy(() =>
  import("./pages/AdminPanelPage").then((m) => ({ default: m.AdminPanelPage })),
);
const OrganizerPanelPage = lazy(() =>
  import("./pages/OrganizerPanelPage").then((m) => ({ default: m.OrganizerPanelPage })),
);
const BecomeOrganizerPage = lazy(() =>
  import("./pages/BecomeOrganizerPage").then((m) => ({ default: m.BecomeOrganizerPage })),
);
const TermsPage = lazy(() =>
  import("./pages/LegalPages").then((m) => ({ default: m.TermsPage })),
);
const PrivacyPage = lazy(() =>
  import("./pages/LegalPages").then((m) => ({ default: m.PrivacyPage })),
);
const SettingsPage = lazy(() =>
  import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const AccountPage = lazy(() =>
  import("./pages/AccountPage").then((m) => ({ default: m.AccountPage })),
);

/**
 * Brama auth: spinner podczas bootstrapu `/api/auth/me`, potem redirect lub children.
 * `roles` — opcjonalna biała lista ról (np. tylko ADMIN).
 * Przy mismatch roli: jednorazowy `refreshSession` (po APPROVE wniosku org. w DB
 * React state może jeszcze trzymać USER — bez tego redirect na `/` przed panelem).
 */
function AuthGate({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: UserRole[];
}) {
  const { isAuthenticated, user, isLoading, refreshSession } = useAuth();
  const [roleRefreshing, setRoleRefreshing] = useState(false);
  const refreshAttempted = useRef(false);

  useEffect(() => {
    refreshAttempted.current = false;
  }, [roles?.join(",")]);

  useEffect(() => {
    if (!roles || isLoading || !isAuthenticated || !user) return;
    if (roles.includes(user.role)) return;
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
  }, [roles, isLoading, isAuthenticated, user, refreshSession]);

  if (isLoading || roleRefreshing) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-[#9ca3af]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--race-accent)]" />
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return <>{children}</>;
}

function ProtectedDashboard() {
  return (
    <AuthGate>
      <DashboardPage />
    </AuthGate>
  );
}

function ProtectedGarage() {
  return (
    <AuthGate>
      <GaragePage />
    </AuthGate>
  );
}

function ProtectedAdmin() {
  return (
    <AuthGate roles={["ADMIN"]}>
      <AdminPanelPage />
    </AuthGate>
  );
}

function ProtectedOrganizer() {
  return (
    <AuthGate roles={["ORGANIZER", "ADMIN"]}>
      <OrganizerPanelPage />
    </AuthGate>
  );
}

function ProtectedAccount() {
  return (
    <AuthGate>
      <AccountPage />
    </AuthGate>
  );
}

function ProtectedSettings() {
  return (
    <AuthGate>
      <SettingsPage />
    </AuthGate>
  );
}

function ProtectedBecomeOrganizer() {
  return (
    <AuthGate>
      <BecomeOrganizerPage />
    </AuthGate>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
      { path: "forgot-password", Component: ForgotPasswordPage },
      { path: "verify-email", Component: VerifyEmailPage },
      { path: "dashboard", Component: ProtectedDashboard },
      { path: "konto", Component: ProtectedAccount },
      { path: "ustawienia", Component: ProtectedSettings },
      { path: "garaz", Component: ProtectedGarage },
      { path: "admin", Component: ProtectedAdmin },
      { path: "organizer", Component: ProtectedOrganizer },
      { path: "zostan-organizatorem", Component: ProtectedBecomeOrganizer },
      { path: "wydarzenia", Component: EventsPage },
      { path: "wydarzenia/:id", Component: EventDetailPage },
      { path: "wyniki", Component: ResultsPage },
      { path: "archiwum", Component: ArchivePage },
      { path: "galeria", Component: GalleryPage },
      { path: "mapa", element: <Navigate to="/wydarzenia" replace /> },
      { path: "terms", Component: TermsPage },
      { path: "privacy", Component: PrivacyPage },
      // SPA catch-all — nieznane ścieżki → home (nginx i tak serwuje index.html)
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
