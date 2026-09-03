import { describe, expect, it } from "vitest";
import type {
  PresentedNeckline,
  PresentedSilhouette,
  PresentedTopStyle,
} from "../dress/options";
import { dressStructureKey } from "./dressLayers";

const tops = [
  "unknown",
  "strapless",
  "offShoulder",
  "strap",
  "halter",
  "shortSleeve",
  "longSleeve",
] as const satisfies readonly PresentedTopStyle[];
const necklines = [
  "unknown",
  "straight",
  "sweetheart",
  "v",
  "square",
  "scoop",
  "asymmetric",
] as const satisfies readonly PresentedNeckline[];
const silhouettes = [
  "unknown",
  "aLine",
  "ballGown",
  "mermaid",
  "empire",
] as const satisfies readonly PresentedSilhouette[];

describe("complete dress structure keys", () => {
  it("resolves every presented top, neckline, and silhouette combination", () => {
    const keys = new Set(
      tops.flatMap((topStyle) =>
        necklines.flatMap((neckline) =>
          silhouettes.map((silhouette) =>
            dressStructureKey({
              topStyle,
              neckline,
              silhouette,
            }),
          ),
        ),
      ),
    );

    expect(keys).toHaveLength(245);
    expect(keys).toContain("strapless__sweetheart__mermaid");
    expect(keys).toContain("longSleeve__asymmetric__empire");
    expect(keys).toContain("unknown__unknown__unknown");
  });
});
