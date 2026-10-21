/** E-mail oczekujący na kod aktywacji — przeżywa odświeżenie / nawigację w tej samej karcie. */
const KEY = "raceportal_pending_verify_email";

export function getPendingVerifyEmail(): string | null {
  try {
    const v = sessionStorage.getItem(KEY);
    return v && v.includes("@") ? v : null;
  } catch {
    return null;
  }
}

export function setPendingVerifyEmail(email: string): void {
  try {
    sessionStorage.setItem(KEY, email.trim().toLowerCase());
  } catch {
    /* private mode / quota — UI i tak trzyma state */
  }
}

export function clearPendingVerifyEmail(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
