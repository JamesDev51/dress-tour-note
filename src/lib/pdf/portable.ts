import type {
  Dress,
  DressLookSnapshot,
  TourSnapshot,
} from "../../types/domain";
import type {
  PortableBundle,
  PortableManifest,
  PortableSerializedFiles,
  PortableTour,
} from "../../types/portable";
import { sha256Hex } from "../image/processFace";
import {
  portableManifestV1Schema,
  portableManifestV2Schema,
  portableManifestV3Schema,
  portableManifestV4Schema,
  portableManifestV5Schema,
  portableManifestV6Schema,
  portableTourV1Schema,
  portableTourV2Schema,
  portableTourV3Schema,
  portableTourV4Schema,
  portableTourV5Schema,
  portableTourV6Schema,
} from "../validation/schemas";

export const PORTABLE_MANIFEST_FILE_NAME = "gudress-manifest.json";
export const PORTABLE_TOUR_FILE_NAME = "gudress-tour.json";
export const PORTABLE_FACE_FILE_NAME = "gudress-face.webp";
export const LEGACY_PORTABLE_FILE_NAME = "gudress-data-v1.json";
export const PORTABLE_FORMAT = "gudress-portable-tour" as const;
export const PORTABLE_PDF_FORMAT = "gudress-portable-pdf" as const;
export const PORTABLE_APP_ID = "kr.gudress.web" as const;
export const SCHEMA_VERSION = 1 as const;
export const STYLING_SCHEMA_VERSION = 2 as const;
export const BACK_CLOSURE_SCHEMA_VERSION = 3 as const;
export const REGIONAL_MATERIAL_SCHEMA_VERSION = 4 as const;
export const MATERIAL_START_SCHEMA_VERSION = 5 as const;
export const SKETCH_SCHEMA_VERSION = 6 as const;
export const FORMAT_VERSION = 1 as const;
export const APP_VERSION = "1.0.0";

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(
      Object.keys(record)
        .sort()
        .map((key) => [key, sortJson(record[key])]),
    );
  }
  return value;
}

export function canonicalJson(value: unknown) {
  return JSON.stringify(sortJson(value));
}

function portableVersionFor(dresses: Dress[]) {
  const looks: DressLookSnapshot[] = dresses.flatMap((dress) => [
    dress,
    ...(dress.stylingVariants ?? []).map(({ snapshot }) => snapshot),
  ]);
  if (looks.some((look) => look.sketchStrokes !== undefined))
    return SKETCH_SCHEMA_VERSION;
  if (looks.some((look) => look.lowerFabricStart !== undefined))
    return MATERIAL_START_SCHEMA_VERSION;
  if (
    looks.some(
      (look) =>
        look.upperFabric !== undefined || look.lowerFabric !== undefined,
    )
  )
    return REGIONAL_MATERIAL_SCHEMA_VERSION;
  if (looks.some((look) => look.backClosure !== undefined))
    return BACK_CLOSURE_SCHEMA_VERSION;
  return dresses.some((dress) => dress.stylingVariants?.length)
    ? STYLING_SCHEMA_VERSION
    : SCHEMA_VERSION;
}

export function buildPortableBundle(
  snapshot: TourSnapshot,
  includeFace: boolean,
): PortableBundle {
  const face =
    includeFace && snapshot.tour.faceAssetId
      ? snapshot.assets.find((asset) => asset.id === snapshot.tour.faceAssetId)
      : undefined;
  const { lastOpenedAt: _, lastExportedAt: __, ...baseTour } = snapshot.tour;
  const tour = face ? baseTour : { ...baseTour, faceAssetId: undefined };
  const dresses = face
    ? snapshot.dresses.map((dress) => ({ ...dress }))
    : snapshot.dresses.map(({ faceTransform: _, ...dress }) => dress);
  const assets = face ? [face] : [];
  const faceFileName =
    face?.mimeType === "image/jpeg"
      ? "gudress-face.jpg"
      : PORTABLE_FACE_FILE_NAME;
  const payload: PortableTour = {
    format: PORTABLE_FORMAT,
    schemaVersion: portableVersionFor(dresses),
    appVersion: APP_VERSION,
    exportId: crypto.randomUUID(),
    exportedAt: new Date().toISOString(),
    sourceTourId: snapshot.tour.id,
    includeFace: Boolean(face),
    tour,
    shops: snapshot.shops.map((shop) => ({ ...shop })),
    dresses,
    assets: assets.map((asset) => ({
      id: asset.id,
      kind: "face",
      fileName: faceFileName,
      mimeType: asset.mimeType,
      byteLength: asset.byteLength,
      width: asset.width,
      height: asset.height,
      sha256: asset.sha256,
    })),
  };
  return { payload: parsePortablePayload(payload), assets };
}

export async function serializePortableBundle(
  bundle: PortableBundle,
): Promise<PortableSerializedFiles> {
  const tourBytes = new TextEncoder().encode(canonicalJson(bundle.payload));
  const tourSha256 = await sha256Hex(tourBytes);
  const face = bundle.assets[0];
  const faceBytes = face
    ? new Uint8Array(await face.blob.arrayBuffer())
    : undefined;
  const faceSha256 = faceBytes ? await sha256Hex(faceBytes) : null;
  const faceAttachment = bundle.payload.assets[0]?.fileName;
  if (face && faceSha256 !== face.sha256)
    throw new Error(
      "기기에 저장된 얼굴 사진 검증에 실패했어요. 사진을 다시 추가해 주세요.",
    );
  const manifest = parsePortableManifest({
    appId: PORTABLE_APP_ID,
    format: PORTABLE_PDF_FORMAT,
    formatVersion: FORMAT_VERSION,
    schemaVersion: bundle.payload.schemaVersion,
    createdAt: bundle.payload.exportedAt,
    tourAttachment: PORTABLE_TOUR_FILE_NAME,
    faceAttachment,
    tourSha256,
    faceSha256,
    generator: `gudress-web/${APP_VERSION}`,
  });
  return {
    manifest,
    manifestBytes: new TextEncoder().encode(canonicalJson(manifest)),
    tourBytes,
    faceBytes,
  };
}

export class UnsupportedPortableVersionError extends Error {
  constructor() {
    super("지원하지 않는 드레스노트 PDF 버전이에요.");
    this.name = "UnsupportedPortableVersionError";
  }
}

function schemaVersion(input: unknown) {
  const version =
    input && typeof input === "object" && "schemaVersion" in input
      ? input.schemaVersion
      : undefined;
  if (
    version !== SCHEMA_VERSION &&
    version !== STYLING_SCHEMA_VERSION &&
    version !== BACK_CLOSURE_SCHEMA_VERSION &&
    version !== REGIONAL_MATERIAL_SCHEMA_VERSION &&
    version !== MATERIAL_START_SCHEMA_VERSION &&
    version !== SKETCH_SCHEMA_VERSION
  )
    throw new UnsupportedPortableVersionError();
  return version;
}

export function parsePortablePayload(input: unknown) {
  const version = schemaVersion(input);
  // The v1 schema strips fields it predates. Reject later look data before that
  // projection can silently discard newer material fields inside a styling.
  if (
    version === SCHEMA_VERSION &&
    input &&
    typeof input === "object" &&
    "dresses" in input &&
    Array.isArray(input.dresses)
  ) {
    const hasLaterLooks = input.dresses.some(
      (dress) =>
        dress &&
        typeof dress === "object" &&
        (("stylingVariants" in dress &&
          dress.stylingVariants !== undefined &&
          (!Array.isArray(dress.stylingVariants) ||
            dress.stylingVariants.length > 0)) ||
          ("preferredStylingId" in dress &&
            dress.preferredStylingId !== undefined)),
    );
    if (hasLaterLooks)
      throw new Error("추가 연출은 PDF 데이터 버전 2 이상이 필요해요.");
  }
  switch (version) {
    case SKETCH_SCHEMA_VERSION:
      return portableTourV6Schema.parse(input);
    case MATERIAL_START_SCHEMA_VERSION:
      return portableTourV5Schema.parse(input);
    case REGIONAL_MATERIAL_SCHEMA_VERSION:
      return portableTourV4Schema.parse(input);
    case BACK_CLOSURE_SCHEMA_VERSION:
      return portableTourV3Schema.parse(input);
    case STYLING_SCHEMA_VERSION:
      return portableTourV2Schema.parse(input);
    default:
      return portableTourV1Schema.parse(input);
  }
}

export function parsePortableManifest(input: unknown) {
  switch (schemaVersion(input)) {
    case SKETCH_SCHEMA_VERSION:
      return portableManifestV6Schema.parse(input);
    case MATERIAL_START_SCHEMA_VERSION:
      return portableManifestV5Schema.parse(input);
    case REGIONAL_MATERIAL_SCHEMA_VERSION:
      return portableManifestV4Schema.parse(input);
    case BACK_CLOSURE_SCHEMA_VERSION:
      return portableManifestV3Schema.parse(input);
    case STYLING_SCHEMA_VERSION:
      return portableManifestV2Schema.parse(input);
    default:
      return portableManifestV1Schema.parse(input);
  }
}

export async function verifyPortableTourBytes(
  manifest: PortableManifest,
  tourBytes: Uint8Array,
): Promise<PortableTour> {
  if ((await sha256Hex(tourBytes)) !== manifest.tourSha256)
    throw new Error(
      "PDF에 담긴 기록이 손상되었거나 변경됐어요. 원본 파일을 다시 선택해 주세요.",
    );
  let raw: unknown;
  try {
    raw = JSON.parse(new TextDecoder().decode(tourBytes));
  } catch {
    throw new Error("PDF에 담긴 기록을 읽을 수 없어요.");
  }
  const payload = parsePortablePayload(raw);
  if (payload.schemaVersion !== manifest.schemaVersion)
    throw new Error("PDF 내부 데이터 버전이 서로 일치하지 않아요.");
  const faceRef = payload.assets[0];
  if (manifest.faceAttachment) {
    if (
      !faceRef ||
      faceRef.fileName !== manifest.faceAttachment ||
      faceRef.sha256 !== manifest.faceSha256
    )
      throw new Error("PDF의 얼굴 사진 정보가 서로 일치하지 않아요.");
  } else if (
    payload.includeFace ||
    payload.assets.length > 0 ||
    payload.tour.faceAssetId
  ) {
    throw new Error("PDF의 얼굴 사진 정보가 손상됐어요.");
  }
  return payload;
}

export async function verifyPortableFaceBytes(
  manifest: PortableManifest,
  faceBytes: Uint8Array,
) {
  if (!manifest.faceAttachment || !manifest.faceSha256)
    throw new Error("이 PDF에는 얼굴 사진이 포함되어 있지 않아요.");
  if ((await sha256Hex(faceBytes)) !== manifest.faceSha256)
    throw new Error("PDF의 얼굴 사진 검증에 실패했어요.");
}
