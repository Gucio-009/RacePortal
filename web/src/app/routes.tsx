/**
 * routes.tsx — drzewo tras React Router v7 (`createBrowserRouter`).
 *
 * Layout: `RootLayout` na `/` z `<Outlet />` (+ Suspense) dla dzieci.
 * HomePage eager (LCP); pozostałe strony = `React.lazy` (mniej unused JS na /).
 * AuthGate: bootstrap JWT, opcjonalny filtr `roles`.
 *
 * Docker/nginx: try_files $uri /index.html — bez tego odświeżenie `/organizer` = 404.
 */

import { createBrowserRouter, Navigate, useRouteError } from "react-router";
import { ComponentType, lazy, ReactNode, useEffect, useRef, useState } from "react";
import { RootLayout } from "./components/RootLayout";
import { HomePage } from "./pages/HomePage";
import { useAuth } from "./context/AuthContext";
import type { UserRole } from "./lib/types";
import { Loader2 } from "lucide-react";

const CHUNK_RELOAD_KEY = "raceportal_chunk_reload";

/** Chrome / Firefox / Safari — brak chunka po deployu albo 404 z CDN. */
function isChunkLoadError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("dynamically imported module") ||
    message.includes("module script failed") ||
    message.includes("Loading chunk") ||
    message.includes("Loading CSS chunk")
  );
}

function shouldReloadForChunk(): boolean {
  try {
    if (sessionStorage.getItem(CHUNK_RELOAD_KEY) === "1") return false;
    sessionStorage.setItem(CHUNK_RELOAD_KEY, "1");
    return true;
  } catch {
    return false;
  }
}

function clearChunkReload(): void {
  try {
    sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  } catch {
    /* tryb prywatny */
  }
}

/**
 * Jedno odświeżenie, gdy lazy chunk nie schodzi (stary indeks vs nowy deploy,
 * albo 404 zapamiętany przez CDN). Drugi raz — errorElement, bez pętli reload.
 */
function lazyPage(factory: () => Promise<{ default: ComponentType }>) {
  return lazy(() =>
    factory()
      .then((module) => {
        clearChunkReload();
        return module;
      })
      .catch((error: unknown) => {
        if (isChunkLoadError(error) && shouldReloadForChunk()) {
          window.location.reload();
          return new Promise<{ default: ComponentType }>(() => {});
        }
        throw error;
      }),
  );
}

function RouteError() {
  const error = useRouteError();
  const chunk = isChunkLoadError(error);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-lg font-semibold text-[var(--race-fg)]">
        {chunk ? "Nie udało się wczytać tej części aplikacji." : "Coś poszło nie tak."}
      </p>
      <p className="max-w-md text-sm text-[var(--race-muted)]">
        {chunk
          ? "Odśwież stronę, żeby pobrać aktualną wersję."
          : "Odśwież stronę albo wróć na stronę główną."}
      </p>
      <button
        type="button"
        className="px-4 py-2 rounded-lg bg-[var(--race-accent)] text-[var(--race-on-accent)] font-semibold"
        onClick={() => window.location.reload()}
      >
        Odśwież
      </button>
    </div>
  );
}

const LoginPage = lazyPage(() =>
  import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })),
);
const RegisterPage = lazyPage(() =>
  import("./pages/RegisterPage").then((m) => ({ default: m.RegisterPage })),
);
const DashboardPage = lazyPage(() =>
  import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const EventsPage = lazyPage(() =>
  import("./pages/EventsPage").then((m) => ({ default: m.EventsPage })),
);
const EventDetailPage = lazyPage(() =>
  import("./pages/EventDetailPage").then((m) => ({ default: m.EventDetailPage })),
);
const ResultsPage = lazyPage(() =>
  import("./pages/ResultsPage").then((m) => ({ default: m.ResultsPage })),
);
const ArchivePage = lazyPage(() =>
  import("./pages/ArchivePage").then((m) => ({ default: m.ArchivePage })),
);
const GalleryPage = lazyPage(() =>
  import("./pages/GalleryPage").then((m) => ({ default: m.GalleryPage })),
);
const ForgotPasswordPage = lazyPage(() =>
  import("./pages/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage })),
);
const VerifyEmailPage = lazyPage(() =>
  import("./pages/VerifyEmailPage").then((m) => ({ default: m.VerifyEmailPage })),
);
const GaragePage = lazyPage(() =>
  import("./pages/GaragePage").then((m) => ({ default: m.GaragePage })),
);
const AdminPanelPage = lazyPage(() =>
  import("./pages/AdminPanelPage").then((m) => ({ default: m.AdminPanelPage })),
);
const OrganizerPanelPage = lazyPage(() =>
  import("./pages/OrganizerPanelPage").then((m) => ({ default: m.OrganizerPanelPage })),
);
const BecomeOrganizerPage = lazyPage(() =>
  import("./pages/BecomeOrganizerPage").then((m) => ({ default: m.BecomeOrganizerPage })),
);
const TermsPage = lazyPage(() =>
  import("./pages/LegalPages").then((m) => ({ default: m.TermsPage })),
);
const PrivacyPage = lazyPage(() =>
  import("./pages/LegalPages").then((m) => ({ default: m.PrivacyPage })),
);
const SettingsPage = lazyPage(() =>
  import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })),
);
const AccountPage = lazyPage(() =>
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
      <div className="min-h-[50vh] flex items-center justify-center text-[var(--race-muted)]">
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
    errorElement: <RouteError />,
    children: [
      { index: true, Component: HomePage },
      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
      { path: "forgot-password", Component: ForgotPasswordPage },
      { path: "verify-email", Component: VerifyEmailPage },
      { path: "verify-email/:token", Component: VerifyEmailPage },
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
