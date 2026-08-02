import { RouterProvider } from "react-router";
import { useEffect } from "react";
import { AuthProvider } from "./context/AuthContext";
import { router } from "./routes";
import { Toaster } from "./components/ui/sonner";
import { applyUserSettings } from "./pages/SettingsPage";

function SettingsBootstrap() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem("raceportal_settings");
      if (!raw) return;
      applyUserSettings(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsBootstrap />
      <RouterProvider router={router} />
      <Toaster position="top-right" theme="dark" closeButton duration={3500} closeButtonAriaLabel="Zamknij powiadomienie" />
    </AuthProvider>
  );
}
