import { describe, expect, it } from "vitest";
import {
  buildPortableBundle,
  LEGACY_PORTABLE_FILE_NAME,
  parsePortablePayload,
  PORTABLE_APP_ID,
  PORTABLE_FACE_FILE_NAME,
  PORTABLE_FORMAT,
  PORTABLE_MANIFEST_FILE_NAME,
  PORTABLE_PDF_FORMAT,
  PORTABLE_TOUR_FILE_NAME,
  SCHEMA_VERSION,
  serializePortableBundle,
  verifyPortableTourBytes,
} from "./portable";
import type { SketchStroke, TourSnapshot } from "../../types/domain";
import { snapshotDressLook } from "../dress/styling";
const now = "2026-08-31T00:00:00.000Z";
const snapshot: TourSnapshot = {
  tour: {
    id: "t",
    title: "테스트 투어",
    status: "draft",
    faceAssetId: "a",
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
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
      topStyle: "offShoulder",
      neckline: "sweetheart",
      silhouette: "aLine",
      waistline: "natural",
      backStyle: "buttonBack",
      fabric: "lace",
      color: "ivory",
      train: "chapel",
      details: [],
      quickTags: ["신부 픽"],
      memoryCue: "기억할 특징".repeat(8).slice(0, 80),
      likedReason: "좋았던 점".repeat(32).slice(0, 160),
      concern: "아쉬운 점".repeat(32).slice(0, 160),
      customOptions: {
        top: "얇은 진주 끈",
        waistline: "곡선 절개",
        backStyle: "등 파임이 더 깊음",
        train: "채플보다 조금 짧음",
        details: "꽃잎 크기가 작음",
      },
      memo: "좋음",
      isFavorite: true,
      coreRecordedAt: now,
      faceTransform: { x: 0, y: 0, scale: 1, rotation: 0 },
      createdAt: now,
      updatedAt: now,
    },
  ],
  assets: [
    {
      id: "a",
      tourId: "t",
      kind: "face",
      mimeType: "image/webp",
      blob: new Blob(["face"]),
      width: 100,
      height: 100,
      byteLength: 4,
      sha256: "0".repeat(64),
      createdAt: now,
    },
  ],
};
describe("portable payload", () => {
  it.each(["base", "variant"])(
    "round-trips the %s sketch at its normalized coordinates in v6",
    async (location) => {
      const strokes: SketchStroke[] = [
        { width: 1, points: [[0, 1]] },
        {
          width: 2,
          points: [
            [0.125, 0.567],
            [1, 0],
          ],
        },
        { width: 4, points: [[1, 1]] },
      ];
      const base = snapshot.dresses[0];
      const record =
        location === "base"
          ? { ...base, sketchStrokes: strokes }
          : {
              ...base,
              stylingVariants: [
                {
                  id: "sketch",
                  label: "꽃 레이스",
                  createdAt: now,
                  updatedAt: now,
                  snapshot: {
                    ...snapshotDressLook(base),
                    sketchStrokes: strokes,
                  },
                },
              ],
            };
      const bundle = buildPortableBundle(
        { ...snapshot, dresses: [record] },
        false,
      );
      const files = await serializePortableBundle(bundle);
      expect(files.manifest).toMatchObject({
        schemaVersion: 6,
        formatVersion: 1,
      });
      const restored = await verifyPortableTourBytes(
        files.manifest,
        files.tourBytes,
      );
      const dress = restored.dresses[0];
      expect(
        location === "base"
          ? dress.sketchStrokes
          : dress.stylingVariants?.[0].snapshot.sketchStrokes,
      ).toEqual(strokes);
      for (const schemaVersion of [1, 2, 3, 4, 5]) {
        expect(() =>
          parsePortablePayload({ ...restored, schemaVersion }),
        ).toThrow();
      }
    },
  );

  it.each(
    [
      [{ width: 3, points: [[0, 1]] }],
      [{ width: 1, points: [[-0.01, 0]] }],
      [{ width: 1, points: [[0, 1.01]] }],
      [{ width: 1, points: [[0]] }],
      [{ width: 1, points: [] }],
      [{ width: 1, points: Array(513).fill([0, 0]) }],
      Array(101).fill({ width: 2, points: [[0, 0]] }),
    ].map((strokes) => ({ strokes })),
  )("rejects invalid or oversized sketch data %#", ({ strokes }) => {
    const blank = buildPortableBundle(snapshot, false).payload;
    expect(() =>
      parsePortablePayload({
        ...blank,
        schemaVersion: 6,
        dresses: [{ ...blank.dresses[0], sketchStrokes: strokes }],
      }),
    ).toThrow();
  });

  it.each(["waist", "hip", "thigh", "knee"] as const)(
    "round-trips explicit %s material starts as v5 and rejects downgrade loss",
    async (lowerFabricStart) => {
      const bundle = buildPortableBundle(
        {
          ...snapshot,
          dresses: [{ ...snapshot.dresses[0], lowerFabricStart }],
        },
        false,
      );
      expect(bundle.payload.schemaVersion).toBe(5);
      const files = await serializePortableBundle(bundle);
      expect(files.manifest.schemaVersion).toBe(5);
      const restored = await verifyPortableTourBytes(
        files.manifest,
        files.tourBytes,
      );
      expect(restored.dresses[0].lowerFabricStart).toBe(lowerFabricStart);
      expect(files.manifest.formatVersion).toBe(1);
      await expect(
        verifyPortableTourBytes(
          { ...files.manifest, schemaVersion: 4 },
          files.tourBytes,
        ),
      ).rejects.toThrow("버전");
      for (const schemaVersion of [1, 2, 3, 4])
        expect(() =>
          parsePortablePayload({ ...restored, schemaVersion }),
        ).toThrow();
    },
  );
  it.each([1, 2, 3, 4] as const)(
    "keeps the omitted waist default readable in legacy schema %s",
    (schemaVersion) => {
      const legacy = buildPortableBundle(snapshot, false).payload;
      const restored = parsePortablePayload({ ...legacy, schemaVersion });
      expect(restored.dresses[0].lowerFabricStart).toBeUndefined();
      expect(
        buildPortableBundle({ ...snapshot, dresses: restored.dresses }, false)
          .payload.schemaVersion,
      ).toBe(1);
    },
  );
  it("uses v5 for an additional look's start without changing the omitted base default", async () => {
    const record = {
      ...snapshot.dresses[0],
      stylingVariants: [
        {
          id: "lower-start-look",
          label: "골반 아래 쉬폰",
          createdAt: now,
          updatedAt: now,
          snapshot: {
            ...snapshotDressLook(snapshot.dresses[0]),
            lowerFabricStart: "hip" as const,
          },
        },
      ],
    };
    const bundle = buildPortableBundle(
      { ...snapshot, dresses: [record] },
      false,
    );
    expect(bundle.payload.schemaVersion).toBe(5);
    const files = await serializePortableBundle(bundle);
    const restored = await verifyPortableTourBytes(
      files.manifest,
      files.tourBytes,
    );
    expect(restored.dresses[0].lowerFabricStart).toBeUndefined();
    expect(
      restored.dresses[0].stylingVariants![0].snapshot.lowerFabricStart,
    ).toBe("hip");
    for (const schemaVersion of [1, 2, 3, 4])
      expect(() =>
        parsePortablePayload({ ...restored, schemaVersion }),
      ).toThrow();
    const invalid = JSON.parse(JSON.stringify(restored));
    invalid.dresses[0].stylingVariants[0].snapshot.lowerFabricStart = "ankle";
    expect(() => parsePortablePayload(invalid)).toThrow();
  });
  it("round-trips mixed upper/skirt materials as v4 and rejects older-schema downgrades", async () => {
    const mixed: TourSnapshot = {
      ...snapshot,
      dresses: [
        {
          ...snapshot.dresses[0],
          upperFabric: "lace",
          lowerFabric: "organzaChiffon",
        },
      ],
    };
    const bundle = buildPortableBundle(mixed, false);
    expect(bundle.payload.schemaVersion).toBe(4);
    const files = await serializePortableBundle(bundle);
    expect(files.manifest.schemaVersion).toBe(4);
    const restored = await verifyPortableTourBytes(
      files.manifest,
      files.tourBytes,
    );
    expect(restored.dresses[0]).toMatchObject({
      upperFabric: "lace",
      lowerFabric: "organzaChiffon",
    });
    for (const schemaVersion of [1, 2, 3])
      expect(() =>
        parsePortablePayload({ ...restored, schemaVersion }),
      ).toThrow();
  });
  it("uses v4 when only an additional look has regional materials and validates both regions", async () => {
    const original = snapshot.dresses[0];
    const record = {
      ...original,
      stylingVariants: [
        {
          id: "mixed-look",
          label: "레이스와 쉬폰",
          createdAt: now,
          updatedAt: now,
          snapshot: snapshotDressLook({
            ...original,
            upperFabric: "lace",
            lowerFabric: "organzaChiffon",
          }),
        },
      ],
      preferredStylingId: "mixed-look",
    };
    const bundle = buildPortableBundle(
      { ...snapshot, dresses: [record] },
      false,
    );
    const files = await serializePortableBundle(bundle);
    const restored = await verifyPortableTourBytes(
      files.manifest,
      files.tourBytes,
    );
    expect(restored.schemaVersion).toBe(4);
    expect(restored.dresses[0].upperFabric).toBeUndefined();
    expect(restored.dresses[0].stylingVariants?.[0].snapshot).toMatchObject({
      upperFabric: "lace",
      lowerFabric: "organzaChiffon",
    });
    for (const schemaVersion of [1, 2, 3])
      expect(() =>
        parsePortablePayload({ ...restored, schemaVersion }),
      ).toThrow();
    const invalid = JSON.parse(JSON.stringify(restored));
    invalid.dresses[0].stylingVariants[0].snapshot.lowerFabric =
      "not-a-material";
    expect(() => parsePortablePayload(invalid)).toThrow();
    expect(snapshot.dresses[0]).not.toHaveProperty("stylingVariants");
  });
  it("keeps v1 compatibility identifiers unchanged", () => {
    expect({
      legacyFile: LEGACY_PORTABLE_FILE_NAME,
      manifestFile: PORTABLE_MANIFEST_FILE_NAME,
      tourFile: PORTABLE_TOUR_FILE_NAME,
      faceFile: PORTABLE_FACE_FILE_NAME,
      format: PORTABLE_FORMAT,
      pdfFormat: PORTABLE_PDF_FORMAT,
      appId: PORTABLE_APP_ID,
      schemaVersion: SCHEMA_VERSION,
    }).toEqual({
      legacyFile: "gudress-data-v1.json",
      manifestFile: "gudress-manifest.json",
      tourFile: "gudress-tour.json",
      faceFile: "gudress-face.webp",
      format: "gudress-portable-tour",
      pdfFormat: "gudress-portable-pdf",
      appId: "kr.gudress.web",
      schemaVersion: 1,
    });
  });

  it("face excluded removes every reference and byte candidate", () => {
    const out = buildPortableBundle(snapshot, false);
    expect(out.assets).toHaveLength(0);
    expect(out.payload.assets).toHaveLength(0);
    expect(out.payload.tour.faceAssetId).toBeUndefined();
    expect(out.payload.dresses[0].faceTransform).toBeUndefined();
    expect(out.payload.includeFace).toBe(false);
  });
  it("face included preserves asset ref and back style", () => {
    const out = buildPortableBundle(snapshot, true);
    expect(out.assets).toHaveLength(1);
    expect(out.payload.assets[0].id).toBe("a");
    expect(
      parsePortablePayload(JSON.parse(JSON.stringify(out.payload))).dresses[0]
        .backStyle,
    ).toBe("buttonBack");
  });
  it("canonical v1 serialization preserves optional observations", async () => {
    const serialized = await serializePortableBundle(
      buildPortableBundle(snapshot, false),
    );
    const parsed = await verifyPortableTourBytes(
      serialized.manifest,
      serialized.tourBytes,
    );
    expect(parsed.dresses[0]).toMatchObject({
      coreRecordedAt: now,
      customOptions: snapshot.dresses[0].customOptions,
      quickTags: ["신부 픽"],
      memoryCue: snapshot.dresses[0].memoryCue,
      likedReason: snapshot.dresses[0].likedReason,
      concern: snapshot.dresses[0].concern,
    });
  });
  it("keeps legacy option IDs raw in portable v1 payloads", () => {
    const source: TourSnapshot = {
      ...snapshot,
      dresses: [
        {
          ...snapshot.dresses[0],
          topStyle: "spaghetti",
          neckline: "high",
          silhouette: "fitAndFlare",
          waistline: "empire",
          backStyle: "bowBack",
          fabric: "glitterBeaded",
          train: "chapel",
          details: ["backBow"],
        },
      ],
    };

    const out = buildPortableBundle(source, false);
    expect(out.payload.dresses[0]).toMatchObject({
      topStyle: "spaghetti",
      neckline: "high",
      silhouette: "fitAndFlare",
      waistline: "empire",
      backStyle: "bowBack",
      fabric: "glitterBeaded",
      train: "chapel",
      details: ["backBow"],
    });
  });
  it("rejects a tampered raw tour attachment by hash", async () => {
    const serialized = await serializePortableBundle(
      buildPortableBundle(snapshot, false),
    );
    const tampered = new Uint8Array(serialized.tourBytes);
    tampered[0] = tampered[0] ^ 1;

    await expect(
      verifyPortableTourBytes(serialized.manifest, tampered),
    ).rejects.toThrow("기록이 손상되었거나 변경됐어요");
  });
});

describe("portable styling v2", () => {
  function withStyling(): TourSnapshot {
    const base = snapshot.dresses[0];
    return {
      ...snapshot,
      dresses: [
        {
          ...base,
          preferredStylingId: "look-1",
          stylingVariants: [
            {
              id: "look-1",
              label: "어깨 감쌈",
              createdAt: now,
              updatedAt: now,
              snapshot: {
                topStyle: "offShoulder",
                neckline: "sweetheart",
                silhouette: "aLine",
                waistline: "unknown",
                backStyle: "bowBack",
                fabric: "lace",
                color: "unknown",
                train: "unknown",
                details: ["backBow"],
                customOptions: { top: "가느다란 시스루 어깨 천" },
                memoryCue: "뒷리본이 있는 연출",
                likedReason: "어깨가 정리됨",
                concern: "팔 움직임",
                memo: "연출 메모",
                quickTags: ["어깨가 정리됨"],
              },
            },
          ],
        },
      ],
    };
  }

  it("round-trips independent snapshots and preferred reference in v2 while retaining format v1", async () => {
    const source = withStyling();
    const bundle = buildPortableBundle(source, false);
    expect(bundle.payload.schemaVersion).toBe(2);
    const files = await serializePortableBundle(bundle);
    expect(files.manifest).toMatchObject({
      schemaVersion: 2,
      formatVersion: 1,
    });
    const parsed = await verifyPortableTourBytes(
      files.manifest,
      files.tourBytes,
    );
    expect(parsed.dresses[0]).toMatchObject({
      preferredStylingId: "look-1",
      memoryCue: source.dresses[0].memoryCue,
      stylingVariants: source.dresses[0].stylingVariants,
    });
    expect(new TextDecoder().decode(files.tourBytes)).not.toContain(
      "faceTransform",
    );
    expect(new TextDecoder().decode(files.tourBytes)).not.toContain(
      "faceAssetId",
    );
    expect(files.faceBytes).toBeUndefined();
  });

  it("writes v1 when all extra looks are removed", () => {
    const source = withStyling();
    source.dresses[0].stylingVariants = [];
    source.dresses[0].preferredStylingId = undefined;
    const bundle = buildPortableBundle(source, false);
    expect(bundle.payload.schemaVersion).toBe(1);
    expect(bundle.payload.dresses[0]).not.toHaveProperty("stylingVariants");
  });

  it("rejects missing and duplicate references, reserved IDs, over-limit snapshots, and nested face fields", () => {
    const valid = buildPortableBundle(withStyling(), false).payload;
    const invalid = (change: (dress: Record<string, unknown>) => void) => {
      const payload = JSON.parse(JSON.stringify(valid));
      change(payload.dresses[0]);
      expect(() => parsePortablePayload(payload)).toThrow();
    };
    invalid((dress) => {
      dress.preferredStylingId = "missing";
    });
    invalid((dress) => {
      const variants = dress.stylingVariants as unknown[];
      variants.push(variants[0]);
    });
    invalid((dress) => {
      dress.stylingVariants = Array.from({ length: 9 }, (_, i) => ({
        ...(dress.stylingVariants as object[])[0],
        id: `v${i}`,
      }));
    });
    for (const field of [
      "faceTransform",
      "faceAssetId",
      "rating",
      "isFavorite",
    ]) {
      invalid((dress) => {
        const variants = dress.stylingVariants as {
          snapshot: Record<string, unknown>;
        }[];
        variants[0].snapshot[field] =
          field === "faceTransform"
            ? { x: 0, y: 0, scale: 1, rotation: 0 }
            : "private";
      });
    }
    invalid((dress) => {
      (dress.stylingVariants as { id: string }[])[0].id = "base";
    });
    invalid((dress) => {
      (dress.stylingVariants as { label: string }[])[0].label = "가".repeat(31);
    });
  });

  it("rejects mismatched payload and manifest versions even with a correct hash", async () => {
    const files = await serializePortableBundle(
      buildPortableBundle(withStyling(), false),
    );
    await expect(
      verifyPortableTourBytes(
        { ...files.manifest, schemaVersion: 1 },
        files.tourBytes,
      ),
    ).rejects.toThrow("버전");
  });
});

describe("independent back details in portable v3", () => {
  it.each(["unknown", "none", "buttons", "laceUp"] as const)(
    "preserves an explicit %s closure and V opening, with face exclusion",
    async (backClosure) => {
      const source: TourSnapshot = {
        ...snapshot,
        dresses: [{ ...snapshot.dresses[0], backStyle: "vBack", backClosure }],
      };
      const files = await serializePortableBundle(
        buildPortableBundle(source, false),
      );
      expect(files.manifest).toMatchObject({
        schemaVersion: 3,
        formatVersion: 1,
      });
      const restored = await verifyPortableTourBytes(
        files.manifest,
        files.tourBytes,
      );
      expect(restored.dresses[0]).toMatchObject({
        backStyle: "vBack",
        backClosure,
      });
      expect(restored.dresses[0].faceTransform).toBeUndefined();
      expect(restored.tour.faceAssetId).toBeUndefined();
      expect(files.faceBytes).toBeUndefined();
      expect(() =>
        parsePortablePayload({ ...restored, schemaVersion: 1 }),
      ).toThrow();
      expect(() =>
        parsePortablePayload({ ...restored, schemaVersion: 2 }),
      ).toThrow();
    },
  );

  it("uses v3 for a closure only on an additional look and retains independent snapshots", async () => {
    const dress = snapshot.dresses[0];
    const source: TourSnapshot = {
      ...snapshot,
      dresses: [
        {
          ...dress,
          preferredStylingId: "v3-look",
          stylingVariants: [
            {
              id: "v3-look",
              label: "V자 등과 단추",
              createdAt: now,
              updatedAt: now,
              snapshot: {
                topStyle: dress.topStyle,
                neckline: dress.neckline,
                silhouette: dress.silhouette,
                waistline: dress.waistline,
                fabric: dress.fabric,
                color: dress.color,
                train: dress.train,
                details: [],
                backStyle: "vBack",
                backClosure: "buttons",
                memo: "",
                quickTags: [],
              },
            },
          ],
        },
      ],
    };
    const files = await serializePortableBundle(
      buildPortableBundle(source, false),
    );
    const restored = await verifyPortableTourBytes(
      files.manifest,
      files.tourBytes,
    );
    expect(restored.schemaVersion).toBe(3);
    expect(restored.dresses[0].backClosure).toBeUndefined();
    expect(restored.dresses[0].backStyle).toBe("buttonBack");
    expect(restored.dresses[0].stylingVariants?.[0].snapshot).toMatchObject({
      backStyle: "vBack",
      backClosure: "buttons",
      memo: "",
      quickTags: [],
    });
    const malformed = JSON.parse(JSON.stringify(restored));
    malformed.dresses[0].stylingVariants[0].snapshot.backClosure = "invalid";
    expect(() => parsePortablePayload(malformed)).toThrow();
    malformed.dresses[0].stylingVariants[0].snapshot.backClosure = "none";
    malformed.dresses[0].preferredStylingId = "missing";
    expect(() => parsePortablePayload(malformed)).toThrow();
  });
});
