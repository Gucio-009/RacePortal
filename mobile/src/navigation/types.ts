export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type EventsStackParamList = {
  EventsList: undefined;
  EventDetail: { id: string };
};

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

export type MainTabParamList = {
  EventsTab: undefined;
  DashboardTab: undefined;
  GarageTab: undefined;
  MoreTab: undefined;
};

export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};
