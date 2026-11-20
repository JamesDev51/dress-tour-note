import { describe, expect, it } from "vitest";
import type { Dress } from "../../types/domain";
import {
  cloneDressStyling,
  getPreferredStylingId,
  isDressLook,
  resolveDressLook,
  snapshotDressLook,
} from "./styling";

const base: Dress = {
  id: "dress",
  tourId: "tour",
  shopId: "shop",
  order: 0,
  label: "드레스",
  topStyle: "strapless",
  neckline: "straight",
  silhouette: "aLine",
  waistline: "unknown",
  backStyle: "openBack",
  backClosure: "buttons",
  fabric: "lace",
  color: "unknown",
  train: "unknown",
  details: ["floral"],
  quickTags: ["편함"],
  memo: "기본 메모",
  memoryCue: "기본 특징",
  likedReason: "좋음",
  concern: "우려",
  customOptions: { backStyle: "깊게 파임" },
  rating: 5,
  isFavorite: true,
  faceTransform: { x: 0, y: 0, scale: 1, rotation: 0 },
  createdAt: "2026-10-01T00:00:00.000Z",
  updatedAt: "2026-10-01T00:00:00.000Z",
};

function fixture(): Dress {
  const snapshot = snapshotDressLook(base);
  delete snapshot.memoryCue;
  delete snapshot.likedReason;
  delete snapshot.concern;
  delete snapshot.customOptions;
  delete snapshot.backStyle;
  delete snapshot.backClosure;
  snapshot.memo = "";
  snapshot.quickTags = [];
  return {
    ...base,
    preferredStylingId: "extra",
    stylingVariants: [
      {
        id: "extra",
        label: "연출 1",
        snapshot,
        createdAt: base.createdAt,
        updatedAt: base.updatedAt,
      },
    ],
  };
}

describe("styling display projections", () => {
  it("keeps a legacy look's omitted material start independent from the base position", () => {
    const record = { ...fixture(), lowerFabricStart: "thigh" as const };
    expect(snapshotDressLook(record).lowerFabricStart).toBe("thigh");
    const look = resolveDressLook(record, "extra");
    expect(Object.hasOwn(look, "lowerFabricStart")).toBe(true);
    expect(look.lowerFabricStart).toBeUndefined();
  });
  it("explicitly clears optional fields absent from another look without leaking common data into its snapshot", () => {
    const record = fixture();
    const look = resolveDressLook(record, "extra");
    expect(look).toMatchObject({
      memoryCue: undefined,
      likedReason: undefined,
      concern: undefined,
      customOptions: undefined,
      backStyle: undefined,
      backClosure: undefined,
      memo: "",
      quickTags: [],
      rating: 5,
      isFavorite: true,
      faceTransform: base.faceTransform,
    });
    for (const key of [
      "memoryCue",
      "likedReason",
      "concern",
      "customOptions",
      "backStyle",
      "backClosure",
    ])
      expect(Object.hasOwn(look, key)).toBe(true);
    const projected = snapshotDressLook(look);
    expect(projected).not.toHaveProperty("rating");
    expect(projected).not.toHaveProperty("faceTransform");
    expect(projected).not.toHaveProperty("stylingVariants");
    expect(record.memoryCue).toBe("기본 특징");
  });

  it("does not silently replace invalid look requests and interprets legacy records as base", () => {
    expect(resolveDressLook(base)).toBe(base);
    expect(getPreferredStylingId(base)).toBe("base");
    expect(isDressLook(base, "extra")).toBe(false);
    expect(() => resolveDressLook(base, "extra")).toThrow("연출");
  });

  it("deep-copies selected arrays and direct notes when cloning new identities", () => {
    const record = fixture();
    const cloned = { ...record, ...cloneDressStyling(record) };
    expect(cloned.preferredStylingId).toBe(cloned.stylingVariants![0].id);
    expect(cloned.preferredStylingId).not.toBe("extra");
    cloned.stylingVariants![0].snapshot.details.push("backBow");
    expect(record.stylingVariants![0].snapshot.details).toEqual(["floral"]);
  });
});
