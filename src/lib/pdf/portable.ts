import type { TourSnapshot } from '../../types/domain';
import type {
  PortableBundle,
  PortableManifestV1,
  PortableSerializedFiles,
  PortableTourV1,
} from '../../types/portable';
import { sha256Hex } from '../image/processFace';
import { portableManifestV1Schema, portableTourV1Schema } from '../validation/schemas';

export const PORTABLE_MANIFEST_FILE_NAME = 'gudress-manifest.json';
export const PORTABLE_TOUR_FILE_NAME = 'gudress-tour.json';
export const PORTABLE_FACE_FILE_NAME = 'gudress-face.webp';
export const LEGACY_PORTABLE_FILE_NAME = 'gudress-data-v1.json';
export const PORTABLE_FORMAT = 'gudress-portable-tour' as const;
export const PORTABLE_PDF_FORMAT = 'gudress-portable-pdf' as const;
export const PORTABLE_APP_ID = 'kr.gudress.web' as const;
export const SCHEMA_VERSION = 1 as const;
export const FORMAT_VERSION = 1 as const;
export const APP_VERSION = '1.0.0';

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortJson);
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return Object.fromEntries(Object.keys(record).sort().map((key) => [key, sortJson(record[key])]));
  }
  return value;
}

export function canonicalJson(value: unknown) {
  return JSON.stringify(sortJson(value));
}

export function buildPortableBundle(snapshot: TourSnapshot, includeFace: boolean): PortableBundle {
  const face = includeFace && snapshot.tour.faceAssetId ? snapshot.assets.find((asset) => asset.id === snapshot.tour.faceAssetId) : undefined;
  const { lastOpenedAt: _, lastExportedAt: __, ...baseTour } = snapshot.tour;
  const tour = face ? baseTour : { ...baseTour, faceAssetId: undefined };
  const dresses = face ? snapshot.dresses.map((dress) => ({ ...dress })) : snapshot.dresses.map(({ faceTransform: _, ...dress }) => dress);
  const assets = face ? [face] : [];
  const faceFileName = face?.mimeType === 'image/jpeg' ? 'gudress-face.jpg' : PORTABLE_FACE_FILE_NAME;
  const payload: PortableTourV1 = {
    format: PORTABLE_FORMAT,
    schemaVersion: SCHEMA_VERSION,
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
      kind: 'face',
      fileName: faceFileName,
      mimeType: asset.mimeType,
      byteLength: asset.byteLength,
      width: asset.width,
      height: asset.height,
      sha256: asset.sha256,
    })),
  };
  return { payload: portableTourV1Schema.parse(payload), assets };
}

export async function serializePortableBundle(bundle: PortableBundle): Promise<PortableSerializedFiles> {
  const tourBytes = new TextEncoder().encode(canonicalJson(bundle.payload));
  const tourSha256 = await sha256Hex(tourBytes);
  const face = bundle.assets[0];
  const faceBytes = face ? new Uint8Array(await face.blob.arrayBuffer()) : undefined;
  const faceSha256 = faceBytes ? await sha256Hex(faceBytes) : null;
  const faceAttachment = bundle.payload.assets[0]?.fileName;
  if (face && faceSha256 !== face.sha256) throw new Error('기기에 저장된 얼굴 사진 검증에 실패했어요. 사진을 다시 추가해 주세요.');
  const manifest: PortableManifestV1 = portableManifestV1Schema.parse({
    appId: PORTABLE_APP_ID,
    format: PORTABLE_PDF_FORMAT,
    formatVersion: FORMAT_VERSION,
    schemaVersion: SCHEMA_VERSION,
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

export function parsePortablePayload(input: unknown) {
  return portableTourV1Schema.parse(input);
}

export function parsePortableManifest(input: unknown) {
  return portableManifestV1Schema.parse(input);
}

export async function verifyPortableTourBytes(manifest: PortableManifestV1, tourBytes: Uint8Array): Promise<PortableTourV1> {
  if ((await sha256Hex(tourBytes)) !== manifest.tourSha256) throw new Error('PDF의 투어 데이터 해시가 일치하지 않아요. 파일이 손상되었거나 변경됐어요.');
  let raw: unknown;
  try {
    raw = JSON.parse(new TextDecoder().decode(tourBytes));
  } catch {
    throw new Error('PDF의 투어 데이터를 읽을 수 없어요.');
  }
  const payload = parsePortablePayload(raw);
  if (payload.schemaVersion !== manifest.schemaVersion) throw new Error('PDF 내부 데이터 버전이 서로 일치하지 않아요.');
  const faceRef = payload.assets[0];
  if (manifest.faceAttachment) {
    if (!faceRef || faceRef.fileName !== manifest.faceAttachment || faceRef.sha256 !== manifest.faceSha256) throw new Error('PDF의 얼굴 사진 정보가 서로 일치하지 않아요.');
  } else if (payload.includeFace || payload.assets.length > 0 || payload.tour.faceAssetId) {
    throw new Error('PDF의 얼굴 사진 정보가 손상됐어요.');
  }
  return payload;
}

export async function verifyPortableFaceBytes(manifest: PortableManifestV1, faceBytes: Uint8Array) {
  if (!manifest.faceAttachment || !manifest.faceSha256) throw new Error('이 PDF에는 얼굴 사진이 포함되어 있지 않아요.');
  if ((await sha256Hex(faceBytes)) !== manifest.faceSha256) throw new Error('PDF의 얼굴 사진 검증에 실패했어요.');
}
