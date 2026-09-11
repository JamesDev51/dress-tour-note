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
import type { TourSnapshot } from "../../types/domain";
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
    ).rejects.toThrow("해시가 일치하지 않아요");
  });
});
