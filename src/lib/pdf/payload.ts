import {
  SCHEMA_VERSION,
  backStyles,
  colorTones,
  dressDetails,
  necklines,
  primaryFabrics,
  quickTags,
  silhouettes,
  trainLengths,
  upperStyles,
  waistlines,
  type AssetReference,
  type Dress,
  type ExportPayload,
  type ImportedAssetBytes,
  type LocalAsset,
  type Shop,
  type Tour,
  type TourAggregate,
} from '../../domain/types'
import { makeId, nowIso } from '../../shared/utils'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean'
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function enumValue<T extends readonly string[]>(values: T, value: unknown): value is T[number] {
  return isString(value) && values.includes(value)
}

function validateFaceConfig(value: unknown): value is Tour['faceConfig'] {
  if (!isRecord(value)) return false
  return (
    (value.assetId === null || isString(value.assetId)) &&
    isNumber(value.x) &&
    isNumber(value.y) &&
    isNumber(value.scale) &&
    isNumber(value.rotation) &&
    value.mask === 'oval' &&
    isBoolean(value.visibleInPreview) &&
    isBoolean(value.includeInPdf)
  )
}

function validateTour(value: unknown): value is Tour {
  if (!isRecord(value)) return false
  return (
    isString(value.id) &&
    isNumber(value.schemaVersion) &&
    isString(value.title) &&
    isString(value.brideName) &&
    isString(value.tourDate) &&
    isString(value.memo) &&
    (value.status === 'active' || value.status === 'completed') &&
    validateFaceConfig(value.faceConfig) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  )
}

function validateShop(value: unknown): value is Shop {
  if (!isRecord(value)) return false
  return (
    isString(value.id) &&
    isString(value.tourId) &&
    isString(value.name) &&
    (value.appointmentTime === null || isString(value.appointmentTime)) &&
    isString(value.memo) &&
    isNumber(value.order) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  )
}

function validateDress(value: unknown): value is Dress {
  if (!isRecord(value) || !isRecord(value.style)) return false
  const style = value.style
  return (
    isString(value.id) &&
    isString(value.tourId) &&
    isString(value.shopId) &&
    isString(value.name) &&
    isNumber(value.order) &&
    enumValue(upperStyles, style.upperStyle) &&
    enumValue(necklines, style.neckline) &&
    enumValue(waistlines, style.waistline) &&
    enumValue(silhouettes, style.silhouette) &&
    enumValue(primaryFabrics, style.primaryFabric) &&
    Array.isArray(style.details) &&
    style.details.every((item) => enumValue(dressDetails, item)) &&
    enumValue(trainLengths, style.trainLength) &&
    enumValue(backStyles, style.backStyle) &&
    enumValue(colorTones, style.colorTone) &&
    Array.isArray(value.quickTags) &&
    value.quickTags.every((item) => enumValue(quickTags, item)) &&
    isString(value.memo) &&
    isBoolean(value.isFavorite) &&
    (value.clientRevision === undefined || isNumber(value.clientRevision)) &&
    isString(value.createdAt) &&
    isString(value.updatedAt)
  )
}

function validateAssetReference(value: unknown): value is AssetReference {
  if (!isRecord(value)) return false
  return (
    isString(value.id) &&
    isString(value.file) &&
    value.type === 'face' &&
    (value.mimeType === 'image/webp' || value.mimeType === 'image/jpeg') &&
    isNumber(value.width) &&
    isNumber(value.height) &&
    isNumber(value.byteSize)
  )
}

export function parseExportPayload(value: unknown): ExportPayload {
  if (!isRecord(value)) throw new Error('투어 데이터 형식이 올바르지 않습니다.')
  if (!validateTour(value.tour)) throw new Error('투어 정보가 올바르지 않습니다.')
  if (!Array.isArray(value.shops) || !value.shops.every(validateShop)) {
    throw new Error('샵 정보가 올바르지 않습니다.')
  }
  if (!Array.isArray(value.dresses) || !value.dresses.every(validateDress)) {
    throw new Error('드레스 정보가 올바르지 않습니다.')
  }
  if (!Array.isArray(value.assetRefs) || !value.assetRefs.every(validateAssetReference)) {
    throw new Error('사진 정보가 올바르지 않습니다.')
  }

  const payload: ExportPayload = {
    tour: { ...value.tour },
    shops: value.shops,
    dresses: value.dresses.map((dress) => ({ ...dress, clientRevision: dress.clientRevision ?? 0 })),
    assetRefs: value.assetRefs,
  }
  validatePayloadReferences(payload)
  return payload
}

export function validatePayloadReferences(payload: ExportPayload): void {
  const shopIds = new Set(payload.shops.map((shop) => shop.id))
  const assetIds = new Set(payload.assetRefs.map((asset) => asset.id))
  if (payload.shops.some((shop) => shop.tourId !== payload.tour.id)) {
    throw new Error('샵이 다른 투어를 참조합니다.')
  }
  if (
    payload.dresses.some(
      (dress) => dress.tourId !== payload.tour.id || !shopIds.has(dress.shopId),
    )
  ) {
    throw new Error('드레스 참조가 올바르지 않습니다.')
  }
  if (payload.tour.faceConfig.assetId && !assetIds.has(payload.tour.faceConfig.assetId)) {
    throw new Error('얼굴 사진 참조가 올바르지 않습니다.')
  }
  if (new Set(payload.shops.map((shop) => shop.id)).size !== payload.shops.length) {
    throw new Error('샵 ID가 중복됩니다.')
  }
  if (new Set(payload.dresses.map((dress) => dress.id)).size !== payload.dresses.length) {
    throw new Error('드레스 ID가 중복됩니다.')
  }
}

export function migrateExportPayload(payload: ExportPayload): ExportPayload {
  if (payload.tour.schemaVersion > SCHEMA_VERSION) {
    throw new Error('지원하지 않는 최신 데이터 버전입니다.')
  }
  let current = structuredClone(payload)
  while (current.tour.schemaVersion < SCHEMA_VERSION) {
    const version = current.tour.schemaVersion
    if (version === 0) {
      current = {
        ...current,
        tour: { ...current.tour, schemaVersion: 1 },
        dresses: current.dresses.map((dress) => ({ ...dress, clientRevision: 0 })),
      }
      continue
    }
    throw new Error(`지원하지 않는 데이터 버전입니다: ${version}`)
  }
  return current
}

export function remapPayloadIds(payload: ExportPayload): ExportPayload {
  const tourId = makeId()
  const shopMap = new Map(payload.shops.map((shop) => [shop.id, makeId()]))
  const dressMap = new Map(payload.dresses.map((dress) => [dress.id, makeId()]))
  const assetMap = new Map(payload.assetRefs.map((asset) => [asset.id, makeId()]))
  const timestamp = nowIso()
  return {
    tour: {
      ...payload.tour,
      id: tourId,
      faceConfig: {
        ...payload.tour.faceConfig,
        assetId: payload.tour.faceConfig.assetId
          ? (assetMap.get(payload.tour.faceConfig.assetId) ?? null)
          : null,
      },
      createdAt: timestamp,
      updatedAt: timestamp,
    },
    shops: payload.shops.map((shop) => ({
      ...shop,
      id: shopMap.get(shop.id) ?? makeId(),
      tourId,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
    dresses: payload.dresses.map((dress) => ({
      ...dress,
      id: dressMap.get(dress.id) ?? makeId(),
      tourId,
      shopId: shopMap.get(dress.shopId) ?? dress.shopId,
      clientRevision: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    })),
    assetRefs: payload.assetRefs.map((asset) => ({
      ...asset,
      id: assetMap.get(asset.id) ?? makeId(),
    })),
  }
}

export function payloadToAggregate(
  payload: ExportPayload,
  importedAssets: ImportedAssetBytes[],
): TourAggregate {
  const timestamp = nowIso()
  const byOriginalId = new Map(importedAssets.map((asset) => [asset.id, asset]))
  const assets: LocalAsset[] = payload.assetRefs.map((reference) => {
    const imported = byOriginalId.get(reference.id)
    if (!imported) throw new Error(`사진 파일이 없습니다: ${reference.file}`)
    return {
      id: reference.id,
      tourId: payload.tour.id,
      type: 'face',
      mimeType: reference.mimeType,
      blob: new Blob([Uint8Array.from(imported.bytes).buffer], { type: reference.mimeType }),
      width: reference.width,
      height: reference.height,
      byteSize: imported.bytes.byteLength,
      createdAt: timestamp,
      updatedAt: timestamp,
    }
  })
  return {
    tour: payload.tour,
    shops: payload.shops,
    dresses: payload.dresses.map((dress) => ({ ...dress, clientRevision: dress.clientRevision ?? 0 })),
    assets,
  }
}

export function createExportPayload(
  aggregate: TourAggregate,
  includeFace: boolean,
): { payload: ExportPayload; assets: LocalAsset[] } {
  const faceAsset = includeFace
    ? aggregate.assets.find((asset) => asset.id === aggregate.tour.faceConfig.assetId)
    : undefined
  const tour = {
    ...aggregate.tour,
    faceConfig: {
      ...aggregate.tour.faceConfig,
      assetId: faceAsset?.id ?? null,
      includeInPdf: Boolean(faceAsset),
    },
  }
  const assets = faceAsset ? [faceAsset] : []
  return {
    payload: {
      tour,
      shops: aggregate.shops.map((shop) => ({ ...shop })),
      dresses: aggregate.dresses.map((dress) => ({
        ...dress,
        style: { ...dress.style, details: [...dress.style.details] },
        quickTags: [...dress.quickTags],
      })),
      assetRefs: assets.map((asset) => ({
        id: asset.id,
        file: `face-${asset.id}.${asset.mimeType === 'image/webp' ? 'webp' : 'jpg'}`,
        type: 'face',
        mimeType: asset.mimeType,
        width: asset.width,
        height: asset.height,
        byteSize: asset.byteSize,
      })),
    },
    assets,
  }
}
