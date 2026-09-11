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
  it("preserves explicit recall reasons in priority order without inventing a title", () => {
    const recorded = {
      ...baseDress,
      memoryCue: "  등 뒤 큰 리본  ",
      likedReason: "허리가 편함",
      concern: "팔 올리기 불편함",
    };

    const presentation = createDressDecisionPresentation(recorded);

    expect(presentation).toMatchObject({
      recall: [
        { key: "memoryCue", value: "등 뒤 큰 리본", state: "recorded" },
        { key: "likedReason", value: "허리가 편함", state: "recorded" },
        { key: "concern", value: "팔 올리기 불편함", state: "recorded" },
      ],
    });
    expect(recorded.memoryCue).toBe("  등 뒤 큰 리본  ");
  });

  it("keeps missing recall blank even when an older record has a memo", () => {
    const presentation = createDressDecisionPresentation(baseDress);

    expect(presentation).toMatchObject({
      recall: [
        { key: "memoryCue", value: "미입력", state: "blank" },
        { key: "likedReason", value: "미입력", state: "blank" },
        { key: "concern", value: "미입력", state: "blank" },
      ],
      memo: { value: "허리가 편하고 움직이기 좋았어요." },
    });
  });

  it("compares saved recall differences before taxonomy", () => {
    const left = {
      ...baseDress,
      memoryCue: "등 뒤 리본",
      likedReason: "가벼움",
    };
    const right = {
      ...baseDress,
      fabric: "mikadoSatin" as const,
      memoryCue: "단추",
      likedReason: "가벼움",
    };

    const rows = compareDressPresentations(left, right);

    expect(rows.map(({ key }) => key)).toEqual(["memoryCue", "fabric"]);
  });

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

  it("separates missing observations from actual differences and decision reasons", () => {
    const right = {
      ...baseDress,
      fabric: "unknown" as const,
      color: "champagne" as const,
      concern: "무거움",
    };

    const rows = compareDressPresentations(baseDress, right);

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "fabric", group: "missing" }),
        expect.objectContaining({ key: "color", group: "observed" }),
        expect.objectContaining({ key: "concern", group: "reasons" }),
      ]),
    );
  });

  it("does not report selection order as a difference in tags or details", () => {
    const left: Dress = { ...baseDress, details: ["pearl", "buttons"] };
    const right: Dress = {
      ...left,
      details: ["buttons", "pearl"],
      quickTags: ["편함", "신부 픽"],
    };

    const rows = compareDressPresentations(left, right);

    expect(rows).toEqual([]);
  });

  it("can expose matching recorded features without pretending two empty fields are known", () => {
    const rows = compareDressPresentations(baseDress, baseDress, true);

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: "fabric",
          group: "same",
          left: {
            key: "fabric",
            label: "소재",
            value: "레이스",
            state: "recorded",
          },
        }),
        expect.objectContaining({ key: "neckline", group: "missing" }),
      ]),
    );
    expect(rows.find(({ key }) => key === "memoryCue")).toBeUndefined();
  });
});
