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
  it("accepts an old v1 dress without a core acknowledgement", () => {
    expect(
      portableTourV1Schema.parse(base()).dresses[0].coreRecordedAt,
    ).toBeUndefined();
  });
  it("accepts a valid core acknowledgement and rejects malformed timestamps", () => {
    const valid = base();
    Object.assign(valid.dresses[0], { coreRecordedAt: now });
    expect(portableTourV1Schema.parse(valid).dresses[0].coreRecordedAt).toBe(
      now,
    );

    const malformed = base();
    Object.assign(malformed.dresses[0], { coreRecordedAt: "completed" });
    expect(() => portableTourV1Schema.parse(malformed)).toThrow();
  });
  it("accepts an old v1 dress without backStyle", () => {
    expect(
      portableTourV1Schema.parse(base()).dresses[0].backStyle,
    ).toBeUndefined();
  });
  it("parses trimmed recall fields at their limits and keeps legacy omission", () => {
    // Given a v1 dress with boundary-length recall fields
    const value = base();
    Object.assign(value.dresses[0], {
      memoryCue: `  ${"기".repeat(80)}  `,
      likedReason: `  ${"좋".repeat(160)}  `,
      concern: `  ${"아".repeat(160)}  `,
    });

    // When the portable boundary parses the dress
    const parsed = portableTourV1Schema.parse(value).dresses[0];

    // Then recall text is trimmed exactly and omission remains absent
    expect(parsed).toMatchObject({
      memoryCue: "기".repeat(80),
      likedReason: "좋".repeat(160),
      concern: "아".repeat(160),
    });
    expect(
      portableTourV1Schema.parse(base()).dresses[0].memoryCue,
    ).toBeUndefined();
  });
  it.each([
    ["memoryCue", 81],
    ["likedReason", 161],
    ["concern", 161],
  ] as const)("rejects over-limit %s recall text", (field, length) => {
    // Given a v1 dress with one oversized untrusted recall field
    const value = base();
    Object.assign(value.dresses[0], { [field]: "가".repeat(length) });

    // When and then the portable boundary parses it, validation rejects it
    expect(() => portableTourV1Schema.parse(value)).toThrow();
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
  it("accepts the four additive canonical IDs under schema v1", () => {
    const value = base();
    Object.assign(value.dresses[0], {
      topStyle: "strap",
      silhouette: "empire",
      fabric: "subtleBeaded",
    });
    expect(portableTourV1Schema.parse(value).dresses[0]).toMatchObject({
      topStyle: "strap",
      silhouette: "empire",
      fabric: "subtleBeaded",
    });
    Object.assign(value.dresses[0], { fabric: "ornateBeaded" });
    expect(portableTourV1Schema.parse(value).dresses[0].fabric).toBe(
      "ornateBeaded",
    );
  });
  it("round-trips optional direct option notes under schema v1", () => {
    const value = base();
    Object.assign(value.dresses[0], {
      customOptions: { top: "얇은 진주 끈", fabric: "잔잔한 비즈" },
    });
    expect(portableTourV1Schema.parse(value).dresses[0].customOptions).toEqual({
      top: "얇은 진주 끈",
      fabric: "잔잔한 비즈",
    });
  });
  it("accepts every optional observation category and all additive quick tags", () => {
    const value = base();
    const customOptions = {
      top: "얇은 진주 끈",
      neckline: "스캘럽 가장자리",
      silhouette: "A라인보다 폭이 좁음",
      fabric: "잔잔한 비즈",
      color: "아이보리보다 따뜻함",
      waistline: "곡선 절개",
      backStyle: "등 파임이 더 깊음",
      train: "채플보다 조금 짧음",
      details: "꽃잎 크기가 작음",
    };
    const quickTags = [
      "가벼움",
      "편함",
      "조임",
      "흘러내림",
      "까슬거림",
      "팔이 부각됨",
      "목이 길어 보임",
      "어깨가 정리됨",
      "상체가 짧아 보임",
      "골반이 강조됨",
    ];
    Object.assign(value.dresses[0], { customOptions, quickTags });

    expect(portableTourV1Schema.parse(value).dresses[0]).toMatchObject({
      customOptions,
      quickTags,
    });
  });
  it("trims valid notes and rejects blank overlong or unknown-category notes", () => {
    const valid = base();
    Object.assign(valid.dresses[0], {
      customOptions: { details: `  ${"가".repeat(80)}  ` },
    });
    expect(
      portableTourV1Schema.parse(valid).dresses[0].customOptions?.details,
    ).toBe("가".repeat(80));

    const blank = base();
    Object.assign(blank.dresses[0], { customOptions: { top: "   " } });
    expect(() => portableTourV1Schema.parse(blank)).toThrow();

    const overlong = base();
    Object.assign(overlong.dresses[0], {
      customOptions: { top: "가".repeat(81) },
    });
    expect(() => portableTourV1Schema.parse(overlong)).toThrow();

    const unknown = base();
    Object.assign(unknown.dresses[0], {
      customOptions: { companionName: "홍길동" },
    });
    expect(() => portableTourV1Schema.parse(unknown)).toThrow();

    const unknownTag = base();
    Object.assign(unknownTag.dresses[0], {
      quickTags: ["동행인 이름: 홍길동"],
    });
    expect(() => portableTourV1Schema.parse(unknownTag)).toThrow();
  });
  it("rejects an unknown option ID at the portable boundary", () => {
    const value = base();
    Object.assign(value.dresses[0], { topStyle: "not-a-canonical-choice" });
    expect(() => portableTourV1Schema.parse(value)).toThrow();
  });
  it("rejects cross-tour references", () => {
    const value = base();
    value.dresses[0].shopId = "missing";
    expect(() => portableTourV1Schema.parse(value)).toThrow();
  });
});
