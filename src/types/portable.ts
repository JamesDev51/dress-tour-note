import type { Dress, Id, LocalAsset, Shop, Tour } from "./domain";

export interface PortableAssetRef {
  id: Id;
  kind: "face";
  fileName: string;
  mimeType: "image/webp" | "image/jpeg";
  byteLength: number;
  width: number;
  height: number;
  sha256: string;
}

export interface PortableTourV1 {
  format: "gudress-portable-tour";
  schemaVersion: 1;
  appVersion: string;
  exportId: Id;
  exportedAt: string;
  sourceTourId: Id;
  includeFace: boolean;
  tour: Omit<Tour, "lastOpenedAt" | "lastExportedAt">;
  shops: Shop[];
  dresses: Dress[];
  assets: PortableAssetRef[];
}

export interface PortableManifestV1 {
  appId: "kr.gudress.web";
  format: "gudress-portable-pdf";
  formatVersion: 1;
  schemaVersion: 1;
  createdAt: string;
  tourAttachment: "gudress-tour.json";
  faceAttachment?: string;
  tourSha256: string;
  faceSha256: string | null;
  generator: string;
}

export interface PortableTourV2 extends Omit<PortableTourV1, "schemaVersion"> {
  schemaVersion: 2;
}
export interface PortableManifestV2 extends Omit<
  PortableManifestV1,
  "schemaVersion"
> {
  schemaVersion: 2;
}
export interface PortableTourV3 extends Omit<PortableTourV1, "schemaVersion"> {
  schemaVersion: 3;
}
export interface PortableManifestV3 extends Omit<
  PortableManifestV1,
  "schemaVersion"
> {
  schemaVersion: 3;
}
export interface PortableTourV4 extends Omit<PortableTourV1, "schemaVersion"> {
  schemaVersion: 4;
}
export interface PortableManifestV4 extends Omit<
  PortableManifestV1,
  "schemaVersion"
> {
  schemaVersion: 4;
}
export interface PortableTourV5 extends Omit<PortableTourV1, "schemaVersion"> {
  schemaVersion: 5;
}
export interface PortableManifestV5 extends Omit<
  PortableManifestV1,
  "schemaVersion"
> {
  schemaVersion: 5;
}
export interface PortableTourV6 extends Omit<PortableTourV1, "schemaVersion"> {
  schemaVersion: 6;
}
export interface PortableManifestV6 extends Omit<
  PortableManifestV1,
  "schemaVersion"
> {
  schemaVersion: 6;
}
export type PortableTour =
  | PortableTourV1
  | PortableTourV2
  | PortableTourV3
  | PortableTourV4
  | PortableTourV5
  | PortableTourV6;
export type PortableManifest =
  | PortableManifestV1
  | PortableManifestV2
  | PortableManifestV3
  | PortableManifestV4
  | PortableManifestV5
  | PortableManifestV6;

export interface ImportPreview {
  payload: PortableTour;
  hasConflict: boolean;
  faceIncluded: boolean;
  faceWarning?: string;
  shopCount: number;
  dressCount: number;
  favoriteCount: number;
  assetBytes: Map<string, Uint8Array>;
  integrityVerified: boolean;
  legacyFormat: boolean;
}

export type ImportStrategy = "copy" | "overwrite";
export type PdfExportMode = "portable" | "viewOnly";

export interface ExportOptions {
  /** Ignored for current exports; retained for older callers. */
  includeFace?: boolean;
  mode: PdfExportMode;
}

export type ExportProgress = {
  step: "prepare" | "render" | "assemble" | "attach" | "verify" | "done";
  percent: number;
  label: string;
};

export interface PortableBundle {
  payload: PortableTour;
  assets: LocalAsset[];
}

export interface PortableSerializedFiles {
  manifest: PortableManifest;
  manifestBytes: Uint8Array;
  tourBytes: Uint8Array;
  faceBytes?: Uint8Array;
}
