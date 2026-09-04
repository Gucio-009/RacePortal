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
import { applyUserSettings, loadSettings } from "./lib/userSettings";

/** Jednorazowy bootstrap preferencji UI z localStorage (Ustawienia). */
function SettingsBootstrap() {
  useEffect(() => {
    applyUserSettings(loadSettings());
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
