import { describe, expect, it } from "vitest";
import { portableTourV1Schema } from "./schemas";
const now = "2026-08-31T00:00:00.000Z";
function base() {
  return {
    format: "gudress-portable-tour",
    schemaVersion: 1,
    appVersion: "1.0.0",
    exportId: "e",
    exportedAt: now,
    sourceTourId: "t",
    includeFace: false,
    tour: {
      id: "t",
      title: "테스트",
      status: "draft",
      createdAt: now,
      updatedAt: now,
    },
    shops: [
      {
        id: "s",
        tourId: "t",
        name: "샵",
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
    ],
    dresses: [
      {
        id: "d",
        tourId: "t",
        shopId: "s",
        order: 0,
        label: "Dress 01",
        topStyle: "unknown",
        neckline: "unknown",
        silhouette: "unknown",
        waistline: "unknown",
        fabric: "unknown",
        color: "unknown",
        train: "unknown",
        details: [],
        quickTags: [],
        memo: "",
        isFavorite: false,
        createdAt: now,
        updatedAt: now,
      },
    ],
    assets: [],
  };
}
describe("portable schema compatibility", () => {
  it("accepts an old v1 dress without backStyle", () => {
    expect(
      portableTourV1Schema.parse(base()).dresses[0].backStyle,
    ).toBeUndefined();
  });
  it("accepts new optional backStyle", () => {
    const value = base();
    (
      value.dresses[0] as (typeof value.dresses)[0] & { backStyle: string }
    ).backStyle = "buttonBack";
    expect(portableTourV1Schema.parse(value).dresses[0].backStyle).toBe(
      "buttonBack",
    );
  });
  it("rejects cross-tour references", () => {
    const value = base();
    value.dresses[0].shopId = "missing";
    expect(() => portableTourV1Schema.parse(value)).toThrow();
  });
});
