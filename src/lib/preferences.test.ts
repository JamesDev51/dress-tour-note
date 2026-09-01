import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearPreferences,
  DEFAULT_PREFERENCES,
  PREF_KEY,
  readPreferences,
  writePreferences,
} from "./preferences";

describe("preferences", () => {
  beforeEach(() => localStorage.clear());
  it("uses safe defaults for missing or broken local data", () => {
    expect(readPreferences()).toEqual(DEFAULT_PREFERENCES);
    localStorage.setItem(PREF_KEY, "{broken");
    expect(readPreferences()).toEqual(DEFAULT_PREFERENCES);
  });
  it("persists only supported theme/font values", () => {
    writePreferences({ theme: "clean", font: "serif" });
    expect(readPreferences()).toEqual({ theme: "clean", font: "serif" });
    localStorage.setItem(
      PREF_KEY,
      JSON.stringify({ theme: "evil", font: "comic" }),
    );
    expect(readPreferences()).toEqual(DEFAULT_PREFERENCES);
  });
  it("clears the preference record", () => {
    const spy = vi.spyOn(window, "dispatchEvent");
    writePreferences({ theme: "clean", font: "serif" });
    clearPreferences();
    expect(localStorage.getItem(PREF_KEY)).toBeNull();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
