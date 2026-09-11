import { describe, expect, it } from "vitest";
import type { Dress } from "../../types/domain";
import {
  compareDressPresentations,
  createDressDecisionPresentation,
} from "./decisionPresentation";

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

describe("decision presentation", () => {
  it("keeps official terms, explicit unknowns, and category-labelled exceptions consistent", () => {
    const presentation = createDressDecisionPresentation(baseDress);

    expect(presentation.core).toEqual([
      expect.objectContaining({ label: "상의 디자인", value: "스트랩리스" }),
      expect.objectContaining({
        label: "네크라인",
        value: "기억 안 남",
        state: "unknown",
      }),
      expect.objectContaining({ label: "실루엣", value: "A라인" }),
    ]);
    expect(presentation.exceptions).toContainEqual(
      expect.objectContaining({
        label: "네크라인 차이",
        value: "꽃잎 모양 가장자리",
      }),
    );
    expect(presentation.decision).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "후보", value: "후보" }),
        expect.objectContaining({ label: "별점", value: "4 / 5" }),
      ]),
    );
  });

  it("returns only differing fields and distinguishes unknown from blank", () => {
    const right: Dress = {
      ...baseDress,
      id: "dress-right",
      backStyle: "unknown",
      isFavorite: false,
      rating: undefined,
      customOptions: {},
    };

    const rows = compareDressPresentations(baseDress, right);

    expect(rows.map(({ label }) => label)).toEqual([
      "등 디자인",
      "후보",
      "별점",
      "네크라인 차이",
    ]);
    expect(rows[0]).toMatchObject({
      left: { value: "미입력", state: "blank" },
      right: { value: "기억 안 남", state: "unknown" },
    });
    expect(rows[1]).toMatchObject({
      left: { value: "후보" },
      right: { value: "후보 아님" },
    });
  });
});
