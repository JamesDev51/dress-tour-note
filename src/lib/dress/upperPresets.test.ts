import { describe, expect, it } from "vitest";
import {
  ADDITIONAL_UPPER_PRESETS,
  findUpperPreset,
  PRIMARY_UPPER_PRESETS,
  UPPER_PRESETS,
} from "./upperPresets";

describe("upper-body choices", () => {
  it("defines the agreed six primary and four additional pairs", () => {
    expect(
      PRIMARY_UPPER_PRESETS.map(({ topStyle, neckline }) => [
        topStyle,
        neckline,
      ]),
    ).toEqual([
      ["strapless", "straight"],
      ["strapless", "sweetheart"],
      ["spaghetti", "straight"],
      ["offShoulder", "sweetheart"],
      ["shortSleeve", "scoop"],
      ["longSleeve", "high"],
    ]);
    expect(
      ADDITIONAL_UPPER_PRESETS.map(({ topStyle, neckline }) => [
        topStyle,
        neckline,
      ]),
    ).toEqual([
      ["strap", "scoop"],
      ["wideStrap", "square"],
      ["halter", "high"],
      ["oneShoulder", "asymmetric"],
    ]);
    expect(new Set(UPPER_PRESETS.map(({ id }) => id)).size).toBe(10);
  });
  it("matches both fields and leaves custom or unknown pairs unmatched", () => {
    expect(findUpperPreset("strapless", "sweetheart")?.id).toBe(
      "strapless-sweetheart",
    );
    expect(findUpperPreset("longSleeve", "sweetheart")).toBeUndefined();
    expect(findUpperPreset("unknown", "unknown")).toBeUndefined();
  });
});
