/**
 * @raceportal/api-types — publiczny punkt wejścia pakietu.
 *
 * Wspólne typy i helpery domenowe współdzielone przez frontendy (web Vite/React,
 * mobile Expo) oraz testy. Backend (Spring Boot) jest źródłem prawdy runtime;
 * ten pakiet pilnuje spójności kontraktu po stronie TypeScript (statusy, wydarzenia,
 * auta, kategorie, dopasowanie klasy do kategorii, awatary).
 *
 * Technologie: TypeScript (pure ESM/CJS przez bundler konsumenta), bez Reacta —
 * tylko typy i funkcje czyste, żeby dało się używać w Vitest/Node i w UI.
 *
 * Pomysł (alt): generowanie typów ze OpenAPI/Swagger backendu (openapi-typescript),
 * zamiast ręcznej synchronizacji z encjami Javy.
 */
export * from "./types";
export * from "./eventCategories";
export * from "./carMatch";
export * from "./avatars";
