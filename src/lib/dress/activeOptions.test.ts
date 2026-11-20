import { describe, expect, it } from "vitest";
import {
  activeAppearance,
  activeDetailOptions,
  activeFabricOptions,
  activeQuickTagOptions,
  activeSilhouetteOptions,
  lowerFabricFor,
  materialLabel,
  upperFabricFor,
} from "./activeOptions";
import type { Dress } from "../../types/domain";

describe("active recording options", () => {
  it("uses one shared material unless a region is explicitly different", () => {
    const same = { fabric: "lace" as const };
    expect(upperFabricFor(same)).toBe("lace");
    expect(lowerFabricFor(same)).toBe("lace");
    const mixed = { ...same, lowerFabric: "organzaChiffon" as const };
    expect(materialLabel(mixed)).toBe("상체 레이스 · 치마 망사·쉬폰");
    expect(materialLabel({ fabric: "tulle" })).toBe("망사·쉬폰");
  });

  it("omits retired choices and merges the two similar sheer materials", () => {
    expect(activeSilhouetteOptions.some(({ id }) => id === "teaLength")).toBe(
      false,
    );
    expect(activeFabricOptions.some(({ id }) => id === "tulle")).toBe(false);
    expect(
      activeFabricOptions.filter(({ label }) => label === "망사·쉬폰"),
    ).toHaveLength(1);
    expect(
      activeDetailOptions.some(
        ({ id }) => id === "backBow" || id === "detachableSleeve",
      ),
    ).toBe(false);
    expect(activeQuickTagOptions.map(({ id }) => id)).not.toEqual(
      expect.arrayContaining(["가벼움", "편함", "조임", "흘러내림"]),
    );
  });

  it("adapts legacy appearance without mutating its stored fields", () => {
    const old = {
      id: "old",
      fabric: "tulle",
      silhouette: "teaLength",
      color: "champagne",
      train: "cathedral",
      backStyle: "corsetBack",
      backClosure: "laceUp",
      faceTransform: { x: 1, y: 2, scale: 1, rotation: 0 },
      details: ["backBow", "detachableSleeve", "pearl"],
      quickTags: ["불편함", "상체 예쁨"],
      customOptions: { backStyle: "legacy back", details: "꽃이 겹침" },
    } as Dress;
    const before = JSON.stringify(old);
    expect(
      activeAppearance({ ...old, silhouette: "fitAndFlare" }).silhouette,
    ).toBe("mermaid");
    const active = activeAppearance(old);
    expect(active).toMatchObject({
      fabric: "organzaChiffon",
      silhouette: "aLine",
      color: "pureWhite",
      train: "none",
      backStyle: "unknown",
      details: ["pearl"],
      quickTags: ["상체 예쁨"],
      customOptions: { details: "꽃이 겹침" },
    });
    expect(active).not.toHaveProperty("faceTransform");
    expect(active).not.toHaveProperty("backClosure");
    expect(active.customOptions).not.toHaveProperty("backStyle");
    expect(JSON.stringify(old)).toBe(before);
  });
});
