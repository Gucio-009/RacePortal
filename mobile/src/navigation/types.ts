/**
 * Typy parametrów nawigacji React Navigation (TypeScript).
 *
 * Rola w architekturze: kontrakt stacków/tabów — Root (Main + modale auth),
 * Events (lista → detal), More (konto, admin, archiwum…), Main tabs.
 * Zapewnia type-safe `navigate("EventDetail", { id })` itd.
 *
 * Technologie: React Navigation 7 (native-stack + bottom-tabs).
 *
 * Pomysł (alt): Expo Router (file-based routes w `app/`); Flutter go_router;
 * React Native CLI + ten sam React Navigation bez Expo.
 */

/** Modale logowania / rejestracji / resetu (Root stack). */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

/** Stack listy wydarzeń → szczegóły. */
export type EventsStackParamList = {
  EventsList: undefined;
  EventDetail: { id: string };
};

/** Stack zakładki „Więcej” — profile, panele ról, legal, archiwum. */
export type MoreStackParamList = {
  MoreHome: undefined;
  Account: undefined;
  Settings: undefined;
  Admin: undefined;
  Organizer: undefined;
  BecomeOrganizer: undefined;
  Archive: undefined;
  Results: undefined;
  Gallery: undefined;
  Legal: { kind: "terms" | "privacy" };
  EventDetail: { id: string };
};

/** Dolne taby: Eventy / Moje / Garaż / Więcej. */
export type MainTabParamList = {
  EventsTab: undefined;
  DashboardTab: undefined;
  GarageTab: undefined;
  MoreTab: undefined;
};

/** Root: Main (taby) + modale auth. */
export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};
