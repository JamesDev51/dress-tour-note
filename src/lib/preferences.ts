export type AppTheme = "cream" | "clean";
export type AppFont = "sans" | "serif";
export interface AppPreferences {
  theme: AppTheme;
  font: AppFont;
}
export const PREF_KEY = "gudress.preferences.v1";
export const DEFAULT_PREFERENCES: AppPreferences = {
  theme: "cream",
  font: "sans",
};
export function readPreferences(): AppPreferences {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const v = JSON.parse(raw) as Partial<AppPreferences>;
    return {
      theme: v.theme === "clean" ? "clean" : "cream",
      font: v.font === "serif" ? "serif" : "sans",
    };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}
export function writePreferences(next: AppPreferences) {
  localStorage.setItem(PREF_KEY, JSON.stringify(next));
  window.dispatchEvent(
    new CustomEvent("gudress-preferences", { detail: next }),
  );
}
export function clearPreferences() {
  localStorage.removeItem(PREF_KEY);
  window.dispatchEvent(
    new CustomEvent("gudress-preferences", { detail: DEFAULT_PREFERENCES }),
  );
}
