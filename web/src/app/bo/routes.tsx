/**
 * Router backoffice (bo.raceportal.pl) — osobne drzewo od apexu.
 */
import type { ReactNode } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { BoAuthGate } from "./BoAuthGate";
import { BoLayout } from "./BoLayout";
import { BoLoginPage } from "./BoLoginPage";
import { BoHubPage } from "./BoHubPage";
import { BoEventsPage } from "./BoEventsPage";
import { BoUsersPage } from "./BoUsersPage";
import { BoApplicationsPage } from "./BoApplicationsPage";
import { BoBugsPage } from "./BoBugsPage";
import { BoQueueProvider } from "./BoQueueContext";

function Protected({ children }: { children: ReactNode }) {
  return (
    <BoAuthGate>
      <BoQueueProvider>{children}</BoQueueProvider>
    </BoAuthGate>
  );
}

export const boRouter = createBrowserRouter([
  {
    path: "/logowanie",
    element: <BoLoginPage />,
  },
  {
    path: "/",
    element: (
      <Protected>
        <BoLayout />
      </Protected>
    ),
    children: [
      { index: true, element: <BoHubPage /> },
      { path: "wydarzenia", element: <BoEventsPage /> },
      { path: "uzytkownicy", element: <BoUsersPage /> },
      { path: "wnioski", element: <BoApplicationsPage /> },
      { path: "bledy", element: <BoBugsPage /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
