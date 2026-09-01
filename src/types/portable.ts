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

export interface ImportPreview {
  payload: PortableTourV1;
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
  includeFace: boolean;
  mode: PdfExportMode;
}

export type ExportProgress = {
  step: "prepare" | "render" | "assemble" | "attach" | "verify" | "done";
  percent: number;
  label: string;
};

export interface PortableBundle {
  payload: PortableTourV1;
  assets: LocalAsset[];
}

export interface PortableSerializedFiles {
  manifest: PortableManifestV1;
  manifestBytes: Uint8Array;
  tourBytes: Uint8Array;
  faceBytes?: Uint8Array;
}
