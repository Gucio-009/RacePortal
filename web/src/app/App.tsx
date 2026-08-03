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
