export const PREF_KEY = "gudress.preferences.v1";
export function clearPreferences() {
  localStorage.removeItem(PREF_KEY);
}
