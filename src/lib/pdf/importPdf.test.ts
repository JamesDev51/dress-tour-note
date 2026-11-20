// @vitest-environment node

import { PDFDocument } from "pdf-lib";
import { describe, expect, it } from "vitest";
import type { TourSnapshot } from "../../types/domain";
import { sha256Hex } from "../image/processFace";
import { inspectPortablePdf } from "./importPdf";
import { snapshotDressLook } from "../dress/styling";
import { appendPortableTrailer } from "./portableTrailer";
import {
  portableManifestV1Schema,
  portableManifestV2Schema,
  portableTourV1Schema,
  portableTourV2Schema,
} from "../validation/schemas";
import {
  buildPortableBundle,
  PORTABLE_MANIFEST_FILE_NAME,
  serializePortableBundle,
} from "./portable";

const now = "2026-08-31T00:00:00.000Z";

function snapshot(): TourSnapshot {
  return {
    tour: {
      id: "tour-roundtrip",
      title: "PDF 왕복 테스트",
      status: "draft",
      createdAt: now,
      updatedAt: now,
      lastOpenedAt: now,
    },
    shops: [
      {
        id: "shop-roundtrip",
        tourId: "tour-roundtrip",
        name: "테스트 브라이덜",
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
    ],
    dresses: [
      {
        id: "dress-roundtrip",
        tourId: "tour-roundtrip",
        shopId: "shop-roundtrip",
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
        memoryCue: "실크 광택과 낮은 허리선",
        likedReason: "움직일 때 가볍고 상체가 정돈되어 보였음",
        concern: "가슴선이 조금 떠서 수선 여부를 확인해야 함",
        customOptions: {
          neckline: "스캘럽 가장자리",
          backStyle: "등 파임이 더 깊음",
          details: "꽃잎 크기가 작음",
        },
        memo: "왕복 보존 메모",
        isFavorite: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    assets: [],
  };
}

function bytesToArrayBuffer(bytes: Uint8Array) {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;
}

function fileFrom(bytes: Uint8Array, name = "gudress.pdf") {
  return new File([bytesToArrayBuffer(bytes)], name, {
    type: "application/pdf",
  });
}

async function makePortablePdf(
  source: TourSnapshot,
  includeFace: boolean,
  faceOverride?: Uint8Array | null,
) {
  const serialized = await serializePortableBundle(
    buildPortableBundle(source, includeFace),
  );
  const pdf = await PDFDocument.create();
  pdf.addPage([300, 300]);
  await pdf.attach(
    Buffer.from(serialized.manifestBytes),
    PORTABLE_MANIFEST_FILE_NAME,
    {
      mimeType: "application/json",
    },
  );
  await pdf.attach(
    Buffer.from(serialized.tourBytes),
    serialized.manifest.tourAttachment,
    { mimeType: "application/json" },
  );
  const faceBytes =
    faceOverride === undefined ? serialized.faceBytes : faceOverride;
  if (faceBytes && serialized.manifest.faceAttachment) {
    await pdf.attach(
      Buffer.from(faceBytes),
      serialized.manifest.faceAttachment,
      { mimeType: "image/webp" },
    );
  }
  return fileFrom(await pdf.save());
}

describe("inspectPortablePdf", () => {
  it.each([
    { schemaVersion: 4, baseStart: undefined, variantStart: undefined },
    { schemaVersion: 5, baseStart: "hip", variantStart: "knee" },
  ] as const)(
    "restores regional-material v$schemaVersion records through attachments and the unchanged trailer",
    async ({ schemaVersion, baseStart, variantStart }) => {
      const source = snapshot();
      const base = source.dresses[0];
      base.upperFabric = "lace";
      base.lowerFabric = "organzaChiffon";
      base.lowerFabricStart = baseStart;
      base.stylingVariants = [
        {
          id: "mixed-variant",
          label: "새틴 상체",
          createdAt: now,
          updatedAt: now,
          snapshot: snapshotDressLook({
            ...base,
            upperFabric: "mikadoSatin",
            lowerFabricStart: variantStart,
          }),
        },
      ];
      base.preferredStylingId = "mixed-variant";
      const serialized = await serializePortableBundle(
        buildPortableBundle(source, false),
      );
      const pdf = await PDFDocument.create();
      pdf.addPage([300, 300]);
      for (const file of [
        await makePortablePdf(source, false),
        fileFrom(appendPortableTrailer(await pdf.save(), serialized)),
      ]) {
        const restored = await inspectPortablePdf(file);
        expect(restored.payload.schemaVersion).toBe(schemaVersion);
        expect(restored.payload.dresses[0]).toMatchObject({
          upperFabric: "lace",
          lowerFabric: "organzaChiffon",
          preferredStylingId: "mixed-variant",
          stylingVariants: [
            {
              snapshot: {
                upperFabric: "mikadoSatin",
                lowerFabric: "organzaChiffon",
              },
            },
          ],
        });
        expect(restored.payload.dresses[0].lowerFabricStart).toBe(baseStart);
        expect(
          restored.payload.dresses[0].stylingVariants![0].snapshot
            .lowerFabricStart,
        ).toBe(variantStart);
        expect(restored.integrityVerified).toBe(true);
        expect(restored.faceIncluded).toBe(false);
      }
    },
  );
  it("restores v2 snapshots through both attachments and the unchanged v1 trailer", async () => {
    const source = snapshot();
    const base = source.dresses[0];
    base.stylingVariants = [
      {
        id: "variant-1",
        label: "어깨 천 추가",
        createdAt: now,
        updatedAt: now,
        snapshot: snapshotDressLook({
          ...base,
          topStyle: "longSleeve",
          memo: "다른 연출 메모",
          memoryCue: undefined,
        }),
      },
    ];
    base.preferredStylingId = "variant-1";
    const bundle = buildPortableBundle(source, false);
    const serialized = await serializePortableBundle(bundle);
    expect(portableTourV1Schema.safeParse(bundle.payload).success).toBe(false);
    expect(
      portableManifestV1Schema.safeParse(serialized.manifest).success,
    ).toBe(false);
    const pdf = await PDFDocument.create();
    pdf.addPage([300, 300]);
    const bytes = appendPortableTrailer(await pdf.save(), serialized);
    expect(new TextDecoder().decode(bytes)).toContain("%GUDRESS-PORTABLE-V1");
    for (const file of [
      await makePortablePdf(source, false),
      fileFrom(bytes),
    ]) {
      const restored = await inspectPortablePdf(file);
      expect(restored.payload.schemaVersion).toBe(2);
      expect(restored.payload.dresses[0]).toMatchObject({
        preferredStylingId: "variant-1",
        stylingVariants: [
          {
            id: "variant-1",
            label: "어깨 천 추가",
            snapshot: { topStyle: "longSleeve", memo: "다른 연출 메모" },
          },
        ],
      });
      expect(
        restored.payload.dresses[0].stylingVariants?.[0].snapshot.memoryCue,
      ).toBeUndefined();
      expect(restored.dressCount).toBe(1);
      expect(restored.favoriteCount).toBe(1);
    }
  });

  it("reads the manifest and tour attachment written by pdf-lib", async () => {
    const result = await inspectPortablePdf(
      await makePortablePdf(snapshot(), false),
    );
    expect(result.payload.tour.title).toBe("PDF 왕복 테스트");
    expect(result.payload.dresses[0].memo).toBe("왕복 보존 메모");
    expect(result.payload.dresses[0]).toMatchObject({
      memoryCue: "실크 광택과 낮은 허리선",
      likedReason: "움직일 때 가볍고 상체가 정돈되어 보였음",
      concern: "가슴선이 조금 떠서 수선 여부를 확인해야 함",
    });
    expect(result.payload.dresses[0].customOptions).toEqual({
      neckline: "스캘럽 가장자리",
      backStyle: "등 파임이 더 깊음",
      details: "꽃잎 크기가 작음",
    });
    expect(result.assetBytes.size).toBe(0);
  });

  it("accepts an old v1 PDF with no custom observation notes", async () => {
    const source = snapshot();
    source.dresses[0].customOptions = undefined;

    const result = await inspectPortablePdf(
      await makePortablePdf(source, false),
    );
    expect(result.payload.schemaVersion).toBe(1);
    expect(result.payload.dresses[0].customOptions).toBeUndefined();
    expect(result.payload.dresses[0].quickTags).toEqual(["신부 픽"]);
  });

  it("round-trips the optional local face attachment", async () => {
    const source = snapshot();
    const faceBytes = new TextEncoder().encode("test-face-bytes");
    const faceBlob = new Blob([bytesToArrayBuffer(faceBytes)], {
      type: "image/webp",
    });
    source.tour.faceAssetId = "face-roundtrip";
    source.dresses[0].faceTransform = {
      x: 0.25,
      y: -0.1,
      scale: 1.3,
      rotation: 2,
    };
    source.assets.push({
      id: "face-roundtrip",
      tourId: source.tour.id,
      kind: "face",
      mimeType: "image/webp",
      blob: faceBlob,
      width: 20,
      height: 20,
      byteLength: faceBytes.byteLength,
      sha256: await sha256Hex(faceBytes),
      createdAt: now,
    });

    const result = await inspectPortablePdf(
      await makePortablePdf(source, true),
    );
    expect(result.assetBytes.size).toBe(1);
    expect(result.payload.tour.faceAssetId).toBe("face-roundtrip");
    expect(result.payload.dresses[0].faceTransform?.scale).toBe(1.3);
    expect(
      new TextDecoder().decode(result.assetBytes.get("face-roundtrip")),
    ).toBe("test-face-bytes");
  });

  it("restores the dress data without a face when the declared face attachment is missing", async () => {
    // Given a valid v1 payload that declares a face but whose PDF attachment is missing
    const source = snapshot();
    const faceBytes = new TextEncoder().encode("test-face-bytes");
    source.tour.faceAssetId = "face-roundtrip";
    source.dresses[0].faceTransform = {
      x: 0,
      y: 0,
      scale: 1,
      rotation: 0,
    };
    source.assets.push({
      id: "face-roundtrip",
      tourId: source.tour.id,
      kind: "face",
      mimeType: "image/webp",
      blob: new Blob([bytesToArrayBuffer(faceBytes)], { type: "image/webp" }),
      width: 20,
      height: 20,
      byteLength: faceBytes.byteLength,
      sha256: await sha256Hex(faceBytes),
      createdAt: now,
    });

    // When the recoverable PDF is inspected without that attachment
    const result = await inspectPortablePdf(
      await makePortablePdf(source, true, null),
    );

    // Then the record stays readable and the missing private asset is reported
    expect(result.payload.dresses[0].memo).toBe("왕복 보존 메모");
    expect(result.faceIncluded).toBe(false);
    expect(result.assetBytes.size).toBe(0);
    expect(result.faceWarning).toContain("얼굴 파일이 없어");
  });

  it("restores the dress data without a face when the face hash mismatches", async () => {
    // Given a v1 payload whose attached face bytes differ from the manifest hash
    const source = snapshot();
    const faceBytes = new TextEncoder().encode("test-face-bytes");
    source.tour.faceAssetId = "face-roundtrip";
    source.assets.push({
      id: "face-roundtrip",
      tourId: source.tour.id,
      kind: "face",
      mimeType: "image/webp",
      blob: new Blob([bytesToArrayBuffer(faceBytes)], { type: "image/webp" }),
      width: 20,
      height: 20,
      byteLength: faceBytes.byteLength,
      sha256: await sha256Hex(faceBytes),
      createdAt: now,
    });

    // When the recoverable PDF is inspected with mismatched face bytes
    const result = await inspectPortablePdf(
      await makePortablePdf(source, true, new TextEncoder().encode("wrong")),
    );

    // Then the record stays readable and the untrusted face bytes are discarded
    expect(result.payload.dresses[0].memo).toBe("왕복 보존 메모");
    expect(result.faceIncluded).toBe(false);
    expect(result.assetBytes.size).toBe(0);
    expect(result.faceWarning).toContain("얼굴 파일 검증에 실패");
  });

  it("rejects a normal PDF without the recovery manifest", async () => {
    const pdf = await PDFDocument.create();
    pdf.addPage([300, 300]);
    await expect(
      inspectPortablePdf(fileFrom(await pdf.save(), "view-only.pdf")),
    ).rejects.toThrow(
      "기록을 가져올 수 있는 드레스노트 백업용 PDF가 아니에요.",
    );
  });
});

it("restores independent opening and closure through v3 PDF attachments and the unchanged trailer", async () => {
  const source = snapshot();
  const base = source.dresses[0];
  base.backStyle = "vBack";
  base.backClosure = "buttons";
  base.stylingVariants = [
    {
      id: "v3-look",
      label: "등 끈 연출",
      createdAt: now,
      updatedAt: now,
      snapshot: snapshotDressLook({
        ...base,
        backClosure: "laceUp",
        memoryCue: "교차 끈",
        memo: "",
      }),
    },
  ];
  base.preferredStylingId = "v3-look";
  const bundle = buildPortableBundle(source, false);
  const serialized = await serializePortableBundle(bundle);
  expect(portableTourV2Schema.safeParse(bundle.payload).success).toBe(false);
  expect(portableManifestV2Schema.safeParse(serialized.manifest).success).toBe(
    false,
  );
  const pdf = await PDFDocument.create();
  pdf.addPage([300, 300]);
  const bytes = appendPortableTrailer(await pdf.save(), serialized);
  for (const file of [await makePortablePdf(source, false), fileFrom(bytes)]) {
    const restored = await inspectPortablePdf(file);
    expect(restored.payload.schemaVersion).toBe(3);
    expect(restored.payload.dresses[0]).toMatchObject({
      backStyle: "vBack",
      backClosure: "buttons",
      preferredStylingId: "v3-look",
      stylingVariants: [
        {
          snapshot: {
            backStyle: "vBack",
            backClosure: "laceUp",
            memoryCue: "교차 끈",
          },
        },
      ],
    });
    expect(restored.integrityVerified).toBe(true);
    expect(restored.faceIncluded).toBe(false);
    expect(restored.assetBytes.size).toBe(0);
  }
});
