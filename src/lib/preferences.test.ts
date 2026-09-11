import { beforeEach, describe, expect, it } from "vitest";
import { clearPreferences, PREF_KEY } from "./preferences";

describe("preferences", () => {
  beforeEach(() => localStorage.clear());
  it("clears the legacy preference record", () => {
    localStorage.setItem(PREF_KEY, JSON.stringify({ theme: "cream" }));
    clearPreferences();
    expect(localStorage.getItem(PREF_KEY)).toBeNull();
  });
});
