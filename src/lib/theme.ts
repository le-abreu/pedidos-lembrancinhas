export type ThemePreference = "LIGHT" | "DARK";
export type ThemeAttribute = "light" | "dark";

const THEME_PREFERENCES = new Set<ThemePreference>(["LIGHT", "DARK"]);

export function normalizeThemePreference(value: unknown): ThemePreference {
  return typeof value === "string" && THEME_PREFERENCES.has(value as ThemePreference)
    ? (value as ThemePreference)
    : "LIGHT";
}

export function themePreferenceToAttribute(value: unknown): ThemeAttribute {
  return normalizeThemePreference(value).toLowerCase() as ThemeAttribute;
}
