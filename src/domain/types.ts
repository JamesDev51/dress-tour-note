export type ISODateTime = string
export type UUID = string

export const SCHEMA_VERSION = 1
export const APP_ID = 'com.mmingjjung.gudeureseu'
export const EDITABLE_PDF_FORMAT = 'gudeureseu-editable-pdf'
export const MANIFEST_FILENAME = 'gudeureseu-manifest.json'
export const DATA_FILENAME = 'gudeureseu-tour.json'
export const APP_VERSION = '1.0.0'

export const upperStyles = [
  'strapless',
  'offShoulder',
  'spaghetti',
  'wideStrap',
  'halter',
  'oneShoulder',
  'capSleeve',
  'shortSleeve',
  'longSleeve',
  'unknown',
] as const
export type UpperStyle = (typeof upperStyles)[number]

export const necklines = [
  'sweetheart',
  'straight',
  'vNeck',
  'square',
  'scoop',
  'bateau',
  'highNeck',
  'illusion',
  'asymmetric',
  'unknown',
] as const
export type Neckline = (typeof necklines)[number]

export const waistlines = [
  'natural',
  'basque',
  'dropWaist',
  'empire',
  'seamless',
  'unknown',
] as const
export type Waistline = (typeof waistlines)[number]

export const silhouettes = [
  'aLine',
  'ballGown',
  'fitAndFlare',
  'mermaid',
  'sheath',
  'empireFlow',
  'shortLength',
  'unknown',
] as const
export type Silhouette = (typeof silhouettes)[number]

export const primaryFabrics = [
  'mikadoSilk',
  'satin',
  'lace',
  'tulle',
  'organza',
  'chiffon',
  'glitterTulle',
  'unknown',
] as const
export type PrimaryFabric = (typeof primaryFabrics)[number]

export const dressDetails = [
  'beading',
  'pearl',
  'laceApplique',
  'floral3D',
  'bow',
  'draping',
  'ruching',
  'slit',
  'pockets',
  'embroidery',
  'overskirt',
  'corset',
  'minimal',
] as const
export type DressDetail = (typeof dressDetails)[number]

export const trainLengths = ['none', 'short', 'medium', 'long', 'veryLong', 'unknown'] as const
export type TrainLength = (typeof trainLengths)[number]

export const backStyles = [
  'closed',
  'lowV',
  'openBack',
  'corsetLaceUp',
  'buttons',
  'illusionBack',
  'unknown',
] as const
export type BackStyle = (typeof backStyles)[number]

export const colorTones = ['brightWhite', 'ivory', 'champagne', 'unknown'] as const
export type ColorTone = (typeof colorTones)[number]

export const quickTags = [
  'upperPretty',
  'slimming',
  'shoulderPretty',
  'faceBright',
  'looksSlim',
  'photoFriendly',
  'comfortable',
  'heavy',
  'hardToMove',
  'tightBodice',
  'tooVoluminous',
  'lowVolume',
  'notMyStyle',
  'bridePick',
  'companionPick',
  'bothPick',
  'retryWanted',
] as const
export type QuickTag = (typeof quickTags)[number]

export interface FaceTransform {
  assetId: UUID | null
  x: number
  y: number
  scale: number
  rotation: number
  mask: 'oval'
  visibleInPreview: boolean
  includeInPdf: boolean
}

export interface Tour {
  id: UUID
  schemaVersion: number
  title: string
  brideName: string
  tourDate: string
  memo: string
  status: 'active' | 'completed'
  faceConfig: FaceTransform
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface Shop {
  id: UUID
  tourId: UUID
  name: string
  appointmentTime: string | null
  memo: string
  order: number
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface DressStyle {
  upperStyle: UpperStyle
  neckline: Neckline
  waistline: Waistline
  silhouette: Silhouette
  primaryFabric: PrimaryFabric
  details: DressDetail[]
  trainLength: TrainLength
  backStyle: BackStyle
  colorTone: ColorTone
}

export interface Dress {
  id: UUID
  tourId: UUID
  shopId: UUID
  name: string
  order: number
  style: DressStyle
  quickTags: QuickTag[]
  memo: string
  isFavorite: boolean
  clientRevision: number
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface LocalAsset {
  id: UUID
  tourId: UUID
  type: 'face'
  mimeType: 'image/webp' | 'image/jpeg'
  blob: Blob
  width: number
  height: number
  byteSize: number
  createdAt: ISODateTime
  updatedAt: ISODateTime
}

export interface AppSetting {
  key: string
  value: unknown
}

export interface TourAggregate {
  tour: Tour
  shops: Shop[]
  dresses: Dress[]
  assets: LocalAsset[]
}

export interface TourSummary {
  tour: Tour
  shopCount: number
  dressCount: number
  favoriteCount: number
}

export interface OptionDescriptor<T extends string> {
  value: T
  label: string
  professional?: string
  description?: string
}

export interface ExportOptions {
  includeFace: boolean
  includeShopMemo: boolean
  includeDressMemo: boolean
  includeFavoritesSummary: boolean
}

export interface AssetReference {
  id: UUID
  file: string
  type: 'face'
  mimeType: 'image/webp' | 'image/jpeg'
  width: number
  height: number
  byteSize: number
}

export interface ExportPayload {
  tour: Tour
  shops: Shop[]
  dresses: Dress[]
  assetRefs: AssetReference[]
}

export interface ManifestAsset {
  file: string
  mimeType: string
  sha256: string
  byteSize: number
}

export interface EditablePdfManifest {
  appId: typeof APP_ID
  format: typeof EDITABLE_PDF_FORMAT
  schemaVersion: number
  exportVersion: string
  projectId: UUID
  exportedAt: ISODateTime
  dataFile: string
  assets: ManifestAsset[]
  summary: {
    title: string
    tourDate: string
    shopCount: number
    dressCount: number
    hasFace: boolean
  }
}

export interface ImportedAssetBytes extends AssetReference {
  bytes: Uint8Array
}

export interface ParsedEditablePdf {
  manifest: EditablePdfManifest
  payload: ExportPayload
  assets: ImportedAssetBytes[]
  fileName: string
}

export interface ImportPreview {
  parsed: ParsedEditablePdf
  hasConflict: boolean
}

export type ImportMode = 'copy' | 'overwrite'

export type SaveState = 'saved' | 'saving' | 'error' | 'quotaExceeded'

export type AppErrorCode =
  | 'ERR-DB-OPEN'
  | 'ERR-DB-QUOTA'
  | 'ERR-PDF-NOT-EDITABLE'
  | 'ERR-PDF-ATTACHMENT'
  | 'ERR-PDF-CHECKSUM'
  | 'ERR-PDF-VERSION'
  | 'ERR-IMAGE-TYPE'
  | 'ERR-IMAGE-SIZE'
  | 'ERR-IMAGE-DECODE'
  | 'ERR-EXPORT'
  | 'ERR-ROUTE-NOT-FOUND'

export class AppError extends Error {
  readonly code: AppErrorCode

  constructor(code: AppErrorCode, message: string, options?: ErrorOptions) {
    super(message, options)
    this.name = 'AppError'
    this.code = code
  }
}
