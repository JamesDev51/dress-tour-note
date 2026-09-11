import { describe, expect, it } from "vitest";
import type { Dress } from "../../types/domain";
import * as dressOptions from "./options";

type CatalogOption = {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly aliases?: readonly string[];
  readonly technical?: string;
};

function catalog(value: unknown): readonly CatalogOption[] {
  if (!Array.isArray(value)) return [];

  return value.filter(
    (option): option is CatalogOption =>
      typeof option === "object" &&
      option !== null &&
      "id" in option &&
      "label" in option &&
      "description" in option &&
      typeof option.id === "string" &&
      typeof option.label === "string" &&
      typeof option.description === "string",
  );
}

function ids(options: readonly CatalogOption[]) {
  return options.map((option) => option.id);
}

const catalogExpectations = [
  {
    exportName: "topStyleOptions",
    ids: "unknown|strapless|offShoulder|strap|spaghetti|wideStrap|halter|oneShoulder|shortSleeve|longSleeve",
    labels:
      "기억 안 남|스트랩리스|오프숄더|스트랩|스파게티 스트랩|와이드 스트랩|홀터넥|원숄더|캡 소매|롱슬리브",
  },
  {
    exportName: "necklineOptions",
    ids: "unknown|straight|sweetheart|v|square|scoop|high|illusion|asymmetric",
    labels:
      "기억 안 남|스트레이트 네크라인|스위트하트 네크라인|브이넥|스퀘어넥|스쿱넥|하이넥|일루전 네크라인|비대칭 네크라인",
  },
  {
    exportName: "silhouetteOptions",
    ids: "unknown|aLine|ballGown|empire|fitAndFlare|mermaid|sheath|teaLength",
    labels:
      "기억 안 남|A라인|볼가운|엠파이어 실루엣|피트 앤 플레어|머메이드|시스 실루엣|티 렝스",
  },
  {
    exportName: "fabricOptions",
    ids: "unknown|mikadoSatin|lace|subtleBeaded|ornateBeaded|tulle|organzaChiffon|glitterBeaded|floral3D",
    labels:
      "기억 안 남|미카도 새틴|레이스|은은한 비즈|화려한 비즈|튤|오간자·쉬폰|글리터 비즈|입체 플라워",
  },
  {
    exportName: "colorOptions",
    ids: "unknown|pureWhite|ivory|champagne",
    labels: "기억 안 남|퓨어 화이트|아이보리|샴페인",
  },
  {
    exportName: "waistlineOptions",
    ids: "unknown|natural|basque|drop|empire",
    labels:
      "기억 안 남|내추럴 웨이스트|바스크 웨이스트|드롭 웨이스트|엠파이어 웨이스트",
  },
  {
    exportName: "backStyleOptions",
    ids: "unknown|openBack|vBack|buttonBack|corsetBack|illusionBack|bowBack",
    labels: "기억 안 남|오픈 백|브이 백|버튼 백|코르셋 백|일루전 백|리본 백",
  },
  {
    exportName: "trainOptions",
    ids: "unknown|none|sweep|chapel|cathedral",
    labels: "기억 안 남|트레인 없음|스윕 트레인|채플 트레인|캐서드럴 트레인",
  },
  {
    exportName: "detailOptions",
    ids: "corset|draping|waistBow|backBow|pearl|sequin|floral|slit|sheer|detachableSleeve|overskirt|buttons",
    labels:
      "코르셋|드레이핑|허리 리본|백 리본|진주 장식|스팽글|플라워 장식|슬릿|시어|탈부착 소매|오버스커트|버튼 장식",
  },
] as const;

describe("image-first dress catalog", () => {
  it.each(catalogExpectations)(
    "exposes the complete $exportName IDs with presentation metadata",
    ({ exportName, ids: expectedIds, labels: expectedLabels }) => {
      const options = catalog(Reflect.get(dressOptions, exportName));

      expect(ids(options)).toEqual(expectedIds.split("|"));
      expect(options.map((option) => option.label)).toEqual(
        expectedLabels.split("|"),
      );
      expect(new Set(options.map((option) => option.label)).size).toBe(
        options.length,
      );
      expect(
        new Set(options.flatMap((option) => option.aliases ?? [])).size,
      ).toBe(options.flatMap((option) => option.aliases ?? []).length);

      for (const option of options) {
        expect(option.label).toMatch(/[가-힣]/);
        expect(option.description).toMatch(/\S/);
        expect(option.description).not.toContain("\n");
        expect(option.description.length).toBeLessThanOrEqual(80);
      }
    },
  );

  it("keeps 기억 안 남 text-backed and does not resolve arbitrary IDs", () => {
    const topStyles = catalog(Reflect.get(dressOptions, "topStyleOptions"));
    const unknown = topStyles.find((option) => option.id === "unknown");

    expect(unknown).toMatchObject({
      label: "기억 안 남",
      description: expect.any(String),
    });
    expect(unknown).not.toHaveProperty("image");
    expect(dressOptions.optionLabel(topStyles, "not-a-catalog-id")).toBe(
      "기억 안 남",
    );
  });

  it("rejects malformed IDs at the catalog boundary while display stays safe", () => {
    const topStyles = catalog(Reflect.get(dressOptions, "topStyleOptions"));
    const isCatalogId = Reflect.get(dressOptions, "isCatalogId");
    const assertCatalogId = Reflect.get(dressOptions, "assertCatalogId");

    expect(isCatalogId).toBeTypeOf("function");
    expect(assertCatalogId).toBeTypeOf("function");
    if (
      typeof isCatalogId !== "function" ||
      typeof assertCatalogId !== "function"
    ) {
      return;
    }

    expect(isCatalogId(topStyles, "strapless")).toBe(true);
    expect(isCatalogId(topStyles, "not-a-catalog-id")).toBe(false);
    expect(() => assertCatalogId(topStyles, "not-a-catalog-id")).toThrow(
      "Unknown dress option ID: not-a-catalog-id",
    );
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
  it("preserves raw legacy choices without mutating the input", () => {
    const before = structuredClone(legacyDress);

    expect(dressOptions.dressForPresentation(legacyDress)).toEqual(legacyDress);
    expect(legacyDress).toEqual(before);
  });

  it("returns category-labelled core, detail, and exception summaries", () => {
    const formatter = Reflect.get(dressOptions, "formatDressPresentation");
    expect(formatter).toBeTypeOf("function");
    if (typeof formatter !== "function") return;

    expect(
      formatter({
        ...legacyDress,
        customOptions: { neckline: "목선에 잔꽃 레이스" },
      }),
    ).toEqual({
      core: [
        {
          category: "top",
          categoryLabel: "상의 디자인",
          value: "스파게티 스트랩",
        },
        { category: "neckline", categoryLabel: "네크라인", value: "하이넥" },
        {
          category: "silhouette",
          categoryLabel: "실루엣",
          value: "피트 앤 플레어",
        },
        { category: "fabric", categoryLabel: "소재", value: "글리터 비즈" },
        { category: "color", categoryLabel: "색상", value: "아이보리" },
      ],
      details: [
        {
          category: "waistline",
          categoryLabel: "허리선",
          value: "엠파이어 웨이스트",
        },
        { category: "backStyle", categoryLabel: "등 디자인", value: "리본 백" },
        { category: "train", categoryLabel: "트레인", value: "채플 트레인" },
        { category: "details", categoryLabel: "디테일", value: "백 리본" },
        { category: "details", categoryLabel: "디테일", value: "진주 장식" },
      ],
      exceptions: [
        {
          category: "neckline",
          categoryLabel: "네크라인",
          value: "하이넥",
          note: "목선에 잔꽃 레이스",
        },
      ],
    });
  });

  it("summarizes raw selections and labels a closest-choice note", () => {
    expect(
      dressOptions.summarizeDress({
        ...legacyDress,
        customOptions: { neckline: "목선에 잔꽃 레이스" },
      }),
    ).toEqual([
      "스파게티 스트랩",
      "하이넥",
      "피트 앤 플레어",
      "글리터 비즈",
      "아이보리",
      "엠파이어 웨이스트",
      "리본 백",
      "채플 트레인",
      "백 리본",
      "진주 장식",
      "네크라인: 하이넥 (목선에 잔꽃 레이스)",
    ]);
  });
});
