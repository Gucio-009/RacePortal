/**
 * Detekcja hosta backoffice (bo.raceportal.pl) vs apex.
 * Lokalnie: bo.localhost albo VITE_FORCE_BO=true.
 */

export function isBackofficeHost(hostname = window.location.hostname): boolean {
  if (import.meta.env.VITE_FORCE_BO === "true") return true;
  if (hostname === "bo.localhost" || hostname === "bo.127.0.0.1") return true;
  return hostname.startsWith("bo.");
}

/** Origin publicznej aplikacji (apex) — linki „Podgląd” / „RacePortal”. */
export function apexOrigin(): string {
  const { protocol, hostname, port } = window.location;
  if (hostname.startsWith("bo.")) {
    const apexHost = hostname.slice(3);
    const p = port ? `:${port}` : "";
    return `${protocol}//${apexHost}${p}`;
  }
  if (hostname === "bo.localhost" || hostname === "bo.127.0.0.1") {
    const p = port ? `:${port}` : "";
    return `${protocol}//localhost${p}`;
  }
  return "https://raceportal.pl";
}

export function apexEventUrl(eventId: string): string {
  return `${apexOrigin()}/wydarzenia/${eventId}`;
}

/** Origin backoffice — link „Backoffice” z menu konta na apexie. */
export function backofficeOrigin(): string {
  const { protocol, hostname, port } = window.location;
  if (hostname.startsWith("bo.")) {
    const p = port ? `:${port}` : "";
    return `${protocol}//${hostname}${p}`;
  }
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    const p = port ? `:${port}` : "";
    return `${protocol}//bo.${hostname}${p}`;
  }
  return "https://bo.raceportal.pl";
}
