/**
 * formDraft.ts — lokalne szkice formularzy (localStorage).
 *
 * Używane przy ochronie przed zamknięciem garażu / wydarzenia organizatora.
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
export const EVENT_DRAFT_KEY = "raceportal_draft_event";
