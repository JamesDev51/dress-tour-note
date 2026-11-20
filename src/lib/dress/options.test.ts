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
      "기억 안 남|끈 없음|어깨 감쌈|일반 끈|가는 끈|넓은 끈|목 뒤로 연결|한쪽 어깨|짧은 소매|긴 소매",
  },
  {
    exportName: "necklineOptions",
    ids: "unknown|straight|sweetheart|v|square|scoop|high|illusion|asymmetric",
    labels:
      "기억 안 남|일자 가슴선|하트 가슴선|브이넥|사각 목선|둥근 목선|목까지 덮임|망사로 덮인 목선|사선 목·가슴선",
  },
  {
    exportName: "silhouetteOptions",
    ids: "unknown|aLine|ballGown|empire|fitAndFlare|mermaid|sheath|teaLength",
    labels:
      "기억 안 남|A라인|벨라인|가슴 아래부터 퍼짐|피트 앤 플레어|머메이드|슬림라인|발목 위 길이",
  },
  {
    exportName: "fabricOptions",
    ids: "unknown|mikadoSatin|lace|subtleBeaded|ornateBeaded|tulle|organzaChiffon|glitterBeaded|floral3D",
    labels:
      "기억 안 남|실크|레이스|은은한 비즈|화려한 비즈|망사|얇고 흐르는 원단|글리터 비즈|입체 꽃",
  },
  {
    exportName: "colorOptions",
    ids: "unknown|pureWhite|ivory|champagne",
    labels: "기억 안 남|흰색|아이보리|샴페인",
  },
  {
    exportName: "waistlineOptions",
    ids: "unknown|natural|basque|drop|empire",
    labels:
      "기억 안 남|기본 허리선|V자·곡선 허리선|골반 쪽 허리선|가슴 아래 허리선",
  },
  {
    exportName: "backStyleOptions",
    ids: "unknown|openBack|vBack|buttonBack|corsetBack|illusionBack|bowBack",
    labels:
      "기억 안 남|등이 넓게 파임|V자로 파인 등|등 단추|등 뒤 묶는 끈|망사로 덮인 등|뒤 리본",
  },
  {
    exportName: "trainOptions",
    ids: "unknown|none|sweep|chapel|cathedral",
    labels: "기억 안 남|끌림 없음|짧게 끌림|중간 길이로 끌림|길게 끌림",
  },
  {
    exportName: "detailOptions",
    ids: "corset|draping|waistBow|backBow|pearl|sequin|floral|slit|sheer|detachableSleeve|overskirt|buttons",
    labels:
      "코르셋|겹쳐진 주름|허리 리본|뒤 리본|진주 장식|스팽글|꽃 장식|치마 트임|비치는 부분|탈부착 소매|덧치마|단추 장식",
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
          category: "silhouette",
          categoryLabel: "전체 모양",
          value: "피트 앤 플레어",
        },
        {
          category: "fabric",
          categoryLabel: "소재·표면",
          value: "글리터 비즈",
        },
        { category: "top", categoryLabel: "끈·소매", value: "가는 끈" },
        {
          category: "neckline",
          categoryLabel: "목·가슴선",
          value: "목까지 덮임",
        },
        { category: "color", categoryLabel: "색상", value: "아이보리" },
      ],
      details: [
        {
          category: "waistline",
          categoryLabel: "허리선",
          value: "가슴 아래 허리선",
        },
        {
          category: "train",
          categoryLabel: "뒤로 끌리는 길이",
          value: "중간 길이로 끌림",
        },
        {
          category: "details",
          categoryLabel: "장식과 세부 특징",
          value: "뒤 리본",
        },
        {
          category: "details",
          categoryLabel: "장식과 세부 특징",
          value: "진주 장식",
        },
      ],
      exceptions: [
        {
          category: "neckline",
          categoryLabel: "목·가슴선",
          value: "목까지 덮임",
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
      "피트 앤 플레어",
      "글리터 비즈",
      "가는 끈",
      "목까지 덮임",
      "아이보리",
      "가슴 아래 허리선",
      "중간 길이로 끌림",
      "뒤 리본",
      "진주 장식",
      "목·가슴선: 목까지 덮임 (목선에 잔꽃 레이스)",
    ]);
  });
});
