/**
 * App — korzeń aplikacji: AuthProvider + RouterProvider + Toaster.
 *
 * Kolejność: Auth owija router (AuthGate / useAuth w trasach chronionych).
 * SettingsBootstrap: przy starcie czyta `raceportal_settings` z localStorage
 * i aplikuje akcent / pit-stop (`data-pit-stop`, `--race-accent` w theme.css).
 * Toaster (sonner): ciemny motyw, toasty z całego SPA.
 *
 * React Router: `createBrowserRouter` w routes.tsx — deep linki wymagają
 * SPA fallback w nginx (Docker), inaczej 404 na odświeżeniu.
 *
 * Pomysł (alt): TanStack Query Provider; ThemeProvider zamiast ręcznego applyUserSettings.
 */

import { RouterProvider } from "react-router";
import { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { applyUserSettings } from "./pages/SettingsPage";

/**
 * Jednorazowy bootstrap preferencji UI z localStorage (Ustawienia).
 * Błąd JSON → bezpieczne domyślne (gold accent, bez pit-stop).
 */
function SettingsBootstrap() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem("raceportal_settings");
      const parsed = raw ? JSON.parse(raw) : {};
      applyUserSettings({
        emailAlerts: true,
        startReminders: true,
        soundFx: false,
        pitStopMode: false,
        accent: "gold",
        teamFlair: "",
        ...parsed,
      });
    } catch {
      applyUserSettings({
        emailAlerts: true,
        startReminders: true,
        soundFx: false,
        pitStopMode: false,
        accent: "gold",
        teamFlair: "",
      });
    }
  }, []);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsBootstrap />
      <RouterProvider router={router} />
      <Toaster position="top-right" theme="dark" closeButton duration={3500} />
    </AuthProvider>
  );
}
