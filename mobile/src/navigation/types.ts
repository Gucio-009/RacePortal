/**
 * Typy parametrów nawigacji — mobilka-wizytówka (tylko Eventy).
 *
 * Stack: lista wydarzeń → szczegóły. Bez auth / tabów / paneli ról.
 */
export type EventsStackParamList = {
  EventsList: undefined;
  EventDetail: { id: string };
};
