import { createBrowserRouter, Navigate, useNavigate } from "react-router";
import { useEffect, ReactNode } from "react";
import { RootLayout } from "./components/RootLayout";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { DashboardPage } from "./pages/DashboardPage";
import { EventsPage } from "./pages/EventsPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { ResultsPage } from "./pages/ResultsPage";
import { ArchivePage } from "./pages/ArchivePage";
import { GalleryPage } from "./pages/GalleryPage";
import { ForgotPasswordPage } from "./pages/ForgotPasswordPage";
import { GaragePage } from "./pages/GaragePage";
import { AdminPanelPage } from "./pages/AdminPanelPage";
import { OrganizerPanelPage } from "./pages/OrganizerPanelPage";
import { BecomeOrganizerPage } from "./pages/BecomeOrganizerPage";
import { EventsMapPage } from "./pages/EventsMapPage";
import { TermsPage, PrivacyPage } from "./pages/LegalPages";
import { useAuth } from "./context/AuthContext";
import type { UserRole } from "./lib/types";
import { Loader2 } from "lucide-react";

function AuthGate({
  children,
  roles,
}: {
  children: ReactNode;
  roles?: UserRole[];
}) {
  const { isAuthenticated, user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    if (roles && user && !roles.includes(user.role)) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, isLoading, user, roles, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-[#9ca3af]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FFD700]" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (roles && user && !roles.includes(user.role)) return null;

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

export const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      { index: true, Component: HomePage },
      { path: "login", Component: LoginPage },
      { path: "register", Component: RegisterPage },
      { path: "forgot-password", Component: ForgotPasswordPage },
      { path: "dashboard", Component: ProtectedDashboard },
      { path: "garaz", Component: ProtectedGarage },
      { path: "admin", Component: ProtectedAdmin },
      { path: "organizer", Component: ProtectedOrganizer },
      { path: "zostan-organizatorem", Component: BecomeOrganizerPage },
      { path: "wydarzenia", Component: EventsPage },
      { path: "wydarzenia/:id", Component: EventDetailPage },
      { path: "wyniki", Component: ResultsPage },
      { path: "archiwum", Component: ArchivePage },
      { path: "galeria", Component: GalleryPage },
      { path: "mapa", Component: EventsMapPage },
      { path: "terms", Component: TermsPage },
      { path: "privacy", Component: PrivacyPage },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
]);
