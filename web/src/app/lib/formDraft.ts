/**
 * formDraft.ts — lokalne szkice formularzy (localStorage).
 *
 * Używane przy ochronie przed zamknięciem garażu / wydarzenia organizatora.
 * Nowe wydarzenia: lista wersji roboczych (`EVENT_NEW_DRAFTS_KEY`).
 */

export function saveFormDraft<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // private mode / quota — ignoruj
  }
}

export function loadFormDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { data?: T };
    return parsed?.data ?? null;
  } catch {
    return null;
  }
}

export function clearFormDraft(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function isFormDirty(current: unknown, baseline: unknown): boolean {
  return JSON.stringify(current) !== JSON.stringify(baseline);
}

export const GARAGE_DRAFT_KEY = "raceportal_draft_garage";
/** Szkic edycji istniejącego wydarzenia: `${EVENT_DRAFT_KEY}_${eventId}` */
export const EVENT_DRAFT_KEY = "raceportal_draft_event";
/** Lista wersji roboczych nowych wydarzeń (panel organizatora). */
export const EVENT_NEW_DRAFTS_KEY = "raceportal_draft_events_new";

export interface EventDraftEntry<T = unknown> {
  id: string;
  savedAt: number;
  data: T;
}

function newDraftId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `draft_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function readEventDraftList<T>(): EventDraftEntry<T>[] {
  try {
    const raw = localStorage.getItem(EVENT_NEW_DRAFTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is EventDraftEntry<T> =>
        !!item &&
        typeof item === "object" &&
        typeof (item as EventDraftEntry).id === "string" &&
        typeof (item as EventDraftEntry).savedAt === "number" &&
        (item as EventDraftEntry).data != null,
    );
  } catch {
    return [];
  }
}

function writeEventDraftList<T>(entries: EventDraftEntry<T>[]): void {
  try {
    localStorage.setItem(EVENT_NEW_DRAFTS_KEY, JSON.stringify(entries));
  } catch {
    // private mode / quota — ignoruj
  }
}

/** Jednorazowa migracja starego pojedynczego klucza → lista. */
function migrateLegacyNewEventDraft<T>(): void {
  const legacy = loadFormDraft<T>(EVENT_DRAFT_KEY);
  if (!legacy) return;
  const list = readEventDraftList<T>();
  list.unshift({ id: newDraftId(), savedAt: Date.now(), data: legacy });
  writeEventDraftList(list);
  clearFormDraft(EVENT_DRAFT_KEY);
}

export function listEventDrafts<T>(): EventDraftEntry<T>[] {
  migrateLegacyNewEventDraft<T>();
  return readEventDraftList<T>().sort((a, b) => b.savedAt - a.savedAt);
}

export function getEventDraft<T>(id: string): EventDraftEntry<T> | null {
  return listEventDrafts<T>().find((d) => d.id === id) ?? null;
}

/** Tworzy lub aktualizuje wersję roboczą nowego wydarzenia. Zwraca id. */
export function upsertEventDraft<T>(data: T, id?: string | null): string {
  migrateLegacyNewEventDraft<T>();
  const list = readEventDraftList<T>();
  const draftId = id && list.some((d) => d.id === id) ? id : newDraftId();
  const entry: EventDraftEntry<T> = { id: draftId, savedAt: Date.now(), data };
  const next = list.filter((d) => d.id !== draftId);
  next.unshift(entry);
  writeEventDraftList(next);
  return draftId;
}

export function removeEventDraft(id: string): void {
  writeEventDraftList(readEventDraftList().filter((d) => d.id !== id));
}

export function eventDraftLabel(data: { name?: string }): string {
  const name = data.name?.trim();
  return name || "Bez nazwy";
}
