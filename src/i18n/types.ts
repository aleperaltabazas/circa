export type Locale = "es" | "en";
// `Locale` keeps both values so the architecture is ready to re-add `en` later.
// `LOCALES` controls what's actually active in the app (validators, selector, tests all iterate it).
export const LOCALES: readonly Locale[] = ["es"] as const;
export const DEFAULT_LOCALE: Locale = "es";
