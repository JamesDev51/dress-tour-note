import { describe, expect, it } from "vitest";
import type { Dress } from "../../types/domain";
import {
  colorOptions,
  dressForPresentation,
  fabricOptions,
  necklineOptions,
  silhouetteOptions,
  summarizeDress,
  topStyleOptions,
} from "./options";

function ids(options: readonly { id: string }[]) {
  return options.map((option) => option.id);
}

describe("canonical visible options", () => {
  it("exposes exactly the five active choice catalogs", () => {
    expect(ids(topStyleOptions)).toEqual([
      "unknown",
      "strapless",
      "offShoulder",
      "strap",
      "halter",
      "shortSleeve",
      "longSleeve",
    ]);
    expect(ids(necklineOptions)).toEqual([
      "unknown",
      "straight",
      "sweetheart",
      "v",
      "square",
      "scoop",
      "asymmetric",
    ]);
    expect(ids(silhouetteOptions)).toEqual([
      "unknown",
      "aLine",
      "ballGown",
      "mermaid",
      "empire",
    ]);
    expect(ids(fabricOptions)).toEqual([
      "unknown",
      "mikadoSatin",
      "lace",
      "organzaChiffon",
      "subtleBeaded",
      "ornateBeaded",
      "floral3D",
    ]);
    expect(ids(colorOptions)).toEqual([
      "unknown",
      "pureWhite",
      "ivory",
      "champagne",
    ]);
  });
});

const legacyDress: Dress = {
  id: "dress-1",
  tourId: "tour-1",
  shopId: "shop-1",
  order: 0,
  label: "Dress 01",
  topStyle: "spaghetti",
  neckline: "high",
  silhouette: "fitAndFlare",
  waistline: "empire",
  backStyle: "bowBack",
  fabric: "glitterBeaded",
  color: "ivory",
  train: "chapel",
  details: ["backBow", "pearl"],
  quickTags: ["신부 픽"],
  rating: 4,
  memo: "legacy values",
  isFavorite: true,
  faceTransform: { x: 0.1, y: -0.1, scale: 1.2, rotation: 2 },
  createdAt: "2026-09-01T00:00:00.000Z",
  updatedAt: "2026-09-01T00:00:00.000Z",
};

describe("dress presentation", () => {
  it.each([
    ["spaghetti", "strap"],
    ["wideStrap", "strap"],
    ["oneShoulder", "unknown"],
  ] as const)("maps legacy top style %s to %s", (topStyle, expected) => {
    expect(dressForPresentation({ ...legacyDress, topStyle }).topStyle).toBe(
      expected,
    );
  });

  it.each([
    ["high", "unknown"],
    ["illusion", "unknown"],
  ] as const)("maps legacy neckline %s to %s", (neckline, expected) => {
    expect(dressForPresentation({ ...legacyDress, neckline }).neckline).toBe(
      expected,
    );
  });

  it.each([
    ["fitAndFlare", "mermaid"],
    ["sheath", "unknown"],
    ["teaLength", "unknown"],
  ] as const)("maps legacy silhouette %s to %s", (silhouette, expected) => {
    expect(
      dressForPresentation({ ...legacyDress, silhouette }).silhouette,
    ).toBe(expected);
  });

  it.each([
    ["glitterBeaded", "subtleBeaded"],
    ["tulle", "unknown"],
  ] as const)("maps legacy fabric %s to %s", (fabric, expected) => {
    expect(dressForPresentation({ ...legacyDress, fabric }).fabric).toBe(
      expected,
    );
  });

  it("maps legacy choices and neutralizes retired fields without mutating input", () => {
    const before = structuredClone(legacyDress);
    const presented = dressForPresentation(legacyDress);

    expect(presented.topStyle).toBe("strap");
    expect(presented.neckline).toBe("unknown");
    expect(presented.silhouette).toBe("mermaid");
    expect(presented.fabric).toBe("subtleBeaded");
    expect(presented.waistline).toBe("unknown");
    expect(presented.backStyle).toBe("unknown");
    expect(presented.train).toBe("unknown");
    expect(presented.details).toEqual([]);
    expect(legacyDress).toEqual(before);
  });

  it("does not infer empire silhouette from a legacy empire waistline", () => {
    const dress = { ...legacyDress, silhouette: "unknown" as const };
    expect(dressForPresentation(dress).silhouette).toBe("unknown");
  });

  it("summarizes the mapped active fields and omits retired values", () => {
    expect(summarizeDress(legacyDress)).toEqual([
      "끈 있는 형태",
      "무릎부터 크게 퍼짐",
      "은은한 비즈",
      "아이보리",
    ]);
  });
});
