import { describe, expect, it } from "vitest";
import type { Dress } from "../../types/domain";
import { createDressDecisionPresentation } from "./decisionPresentation";

const baseDress: Dress = {
  id: "dress-left",
  tourId: "tour",
  shopId: "shop",
  order: 0,
  label: "Dress 01",
  topStyle: "strapless",
  neckline: "unknown",
  silhouette: "aLine",
  waistline: "natural",
  fabric: "lace",
  color: "ivory",
  train: "chapel",
  details: ["pearl"],
  quickTags: ["신부 픽", "편함"],
  rating: 4,
  memo: "허리가 편하고 움직이기 좋았어요.",
  isFavorite: true,
  customOptions: { neckline: "꽃잎 모양 가장자리" },
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
};

describe("active decision presentation", () => {
  it("preserves user-written reasons and memo without inventing a title", () => {
    const recorded = {
      ...baseDress,
      memoryCue: "  가슴선 레이스  ",
      likedReason: "허리가 편함",
      concern: "팔 올리기 불편함",
    };
    const p = createDressDecisionPresentation(recorded);
    expect(p.recall).toMatchObject([
      { key: "memoryCue", value: "가슴선 레이스" },
      { key: "likedReason", value: "허리가 편함" },
      { key: "concern", value: "팔 올리기 불편함" },
    ]);
    expect(recorded.memoryCue).toBe("  가슴선 레이스  ");
    expect(p.memo.value).toBe(baseDress.memo);
  });
  it("keeps missing recall blank even with an old memo", () => {
    const p = createDressDecisionPresentation(baseDress);
    expect(p.recall.every((f) => f.state === "blank")).toBe(true);
    expect(p.memo.value).toBe(baseDress.memo);
  });
  it("orders neckline before arms and keeps waist only in details", () => {
    const p = createDressDecisionPresentation(baseDress);
    expect(p.core.map((f) => f.key)).toEqual([
      "silhouette",
      "fabric",
      "neckline",
      "top",
    ]);
    expect(p.details.map((f) => f.key)).toEqual(["waistline", "details"]);
    expect(p.core.find((f) => f.key === "neckline")).toMatchObject({
      state: "unknown",
      value: "기억 안 남",
    });
    expect(p.exceptions).toContainEqual(
      expect.objectContaining({
        label: "목·가슴선 차이",
        value: "꽃잎 모양 가장자리",
      }),
    );
  });
  it("preserves both regional material choices in records", () => {
    const mixed = {
      ...baseDress,
      upperFabric: "lace" as const,
      lowerFabric: "organzaChiffon" as const,
    };
    const p = createDressDecisionPresentation(mixed);
    expect(p.core.find((f) => f.key === "fabric")).toMatchObject({
      value: "상체 레이스 · 치마 망사·쉬폰",
      state: "recorded",
    });
  });
  it("omits retired features and comfort tags without mutating old data", () => {
    const old: Dress = {
      ...baseDress,
      color: "champagne",
      train: "cathedral",
      backStyle: "corsetBack",
      backClosure: "laceUp",
      details: ["pearl", "backBow", "detachableSleeve"],
      quickTags: ["편함", "무거움", "신부 픽"],
      customOptions: { backStyle: "등이 깊음", color: "금빛" },
    };
    const before = JSON.stringify(old);
    const p = createDressDecisionPresentation(old);
    expect(p.details.map((f) => f.key)).toEqual(["waistline", "details"]);
    expect(p.dress.details).toEqual(["pearl"]);
    expect(p.decision.find((f) => f.key === "tags")?.value).toBe("신부 픽");
    expect(p.exceptions).toEqual([]);
    expect(JSON.stringify(old)).toBe(before);
  });
  it("keeps an unrecorded regional fabric explicit alongside the recorded material", () => {
    const p = createDressDecisionPresentation({
      ...baseDress,
      upperFabric: "unknown",
      lowerFabric: "organzaChiffon",
    });
    expect(p.core.find((f) => f.key === "fabric")).toMatchObject({
      value: "상체 기억 안 남 · 치마 망사·쉬폰",
      state: "unknown",
    });
  });
});
