/**
 * Typy domenowe API dla mobile — re-export ze współdzielonego pakietu.
 *
 * Rola w architekturze: jedno źródło prawdy kontraktu JSON (`@raceportal/api-types`)
 * dla web, mobile i testów; Metro mapuje alias w `metro.config.js`.
 *
 * Technologie: TypeScript, pakiet monorepo `packages/api-types`.
 *
 * Pomysł (alt): OpenAPI → wygenerowane klienty (openapi-typescript / Orval);
 * osobne DTO tylko pod mobile (dryf kontraktu — unikamy).
 */
/** Re-export shared domain types — source of truth: @raceportal/api-types */
export * from "@raceportal/api-types";
