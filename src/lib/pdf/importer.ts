import pdfWorkerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url'
import {
  APP_ID,
  DATA_FILENAME,
  EDITABLE_PDF_FORMAT,
  MANIFEST_FILENAME,
  SCHEMA_VERSION,
  AppError,
  type EditablePdfManifest,
  type ImportMode,
  type ImportPreview,
  type ImportedAssetBytes,
  type ParsedEditablePdf,
} from '../../domain/types'
import { sha256Hex } from '../crypto/checksum'
import { getTour, replaceTourAggregate } from '../db/repositories'
import {
  migrateExportPayload,
  parseExportPayload,
  payloadToAggregate,
  remapPayloadIds,
} from './payload'

const MAX_PDF_BYTES = 50 * 1024 * 1024

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function parseManifest(value: unknown): EditablePdfManifest {
  if (!isRecord(value) || !isRecord(value.summary) || !Array.isArray(value.assets)) {
    throw new AppError('ERR-PDF-NOT-EDITABLE', '편집 가능한 드레스투어 PDF가 아닙니다.')
  }
  if (value.appId !== APP_ID || value.format !== EDITABLE_PDF_FORMAT) {
    throw new AppError('ERR-PDF-NOT-EDITABLE', '편집 가능한 드레스투어 PDF가 아닙니다.')
  }
  if (typeof value.schemaVersion !== 'number' || value.schemaVersion > SCHEMA_VERSION) {
    throw new AppError('ERR-PDF-VERSION', '더 최신 버전에서 만든 파일입니다.')
  }
  const summary = value.summary
  if (
    typeof value.exportVersion !== 'string' ||
    typeof value.projectId !== 'string' ||
    typeof value.exportedAt !== 'string' ||
    typeof value.dataFile !== 'string' ||
    typeof summary.title !== 'string' ||
    typeof summary.tourDate !== 'string' ||
    typeof summary.shopCount !== 'number' ||
    typeof summary.dressCount !== 'number' ||
    typeof summary.hasFace !== 'boolean'
  ) {
    throw new AppError('ERR-PDF-NOT-EDITABLE', 'PDF 안의 기록 정보가 올바르지 않습니다.')
  }
  for (const asset of value.assets) {
    if (
      !isRecord(asset) ||
      typeof asset.file !== 'string' ||
      typeof asset.mimeType !== 'string' ||
      typeof asset.sha256 !== 'string' ||
      typeof asset.byteSize !== 'number'
    ) {
      throw new AppError('ERR-PDF-NOT-EDITABLE', 'PDF 안의 파일 목록이 올바르지 않습니다.')
    }
  }
  return value as unknown as EditablePdfManifest
}

async function getPdfAttachments(bytes: Uint8Array): Promise<Map<string, Uint8Array>> {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  const task = pdfjs.getDocument({ data: bytes })
  try {
    const document = await task.promise
    const attachments = await document.getAttachments()
    const map = new Map<string, Uint8Array>()
    if (attachments) {
      for (const [key, attachment] of Object.entries(attachments)) {
        const content = attachment.content
        map.set(attachment.filename || key, new Uint8Array(content))
      }
    }
    await document.destroy()
    return map
  } catch (error) {
    throw new AppError('ERR-PDF-NOT-EDITABLE', 'PDF 파일을 열 수 없습니다.', { cause: error })
  } finally {
    await task.destroy().catch(() => undefined)
  }
}

export async function inspectEditablePdf(file: File): Promise<ImportPreview> {
  if (file.size > MAX_PDF_BYTES) {
    throw new AppError('ERR-PDF-NOT-EDITABLE', '50MB 이하의 원본 PDF를 선택해주세요.')
  }
  const bytes = new Uint8Array(await file.arrayBuffer())
  const signature = new TextDecoder('ascii').decode(bytes.subarray(0, 5))
  if (signature !== '%PDF-') {
    throw new AppError('ERR-PDF-NOT-EDITABLE', 'PDF 파일을 선택해주세요.')
  }

  const attachments = await getPdfAttachments(bytes)
  const manifestBytes = attachments.get(MANIFEST_FILENAME)
  if (!manifestBytes) {
    throw new AppError(
      'ERR-PDF-NOT-EDITABLE',
      '이 파일에는 편집 가능한 드레스투어 데이터가 없습니다.',
    )
  }

  let manifest: EditablePdfManifest
  try {
    manifest = parseManifest(JSON.parse(new TextDecoder().decode(manifestBytes)))
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('ERR-PDF-NOT-EDITABLE', 'PDF 안의 기록 정보를 읽을 수 없습니다.', {
      cause: error,
    })
  }

  const dataBytes = attachments.get(manifest.dataFile || DATA_FILENAME)
  if (!dataBytes) {
    throw new AppError(
      'ERR-PDF-ATTACHMENT',
      '원본 PDF가 아니거나 파일이 변형되었습니다. 원본 파일을 선택해주세요.',
    )
  }

  for (const asset of manifest.assets) {
    const content = attachments.get(asset.file)
    if (!content || content.byteLength !== asset.byteSize) {
      throw new AppError('ERR-PDF-ATTACHMENT', 'PDF에 필요한 데이터가 빠져 있습니다.')
    }
    const checksum = await sha256Hex(content)
    if (checksum !== asset.sha256) {
      throw new AppError('ERR-PDF-CHECKSUM', '파일 일부가 손상되어 불러올 수 없습니다.')
    }
  }

  let payload
  try {
    payload = migrateExportPayload(parseExportPayload(JSON.parse(new TextDecoder().decode(dataBytes))))
  } catch (error) {
    const message = error instanceof Error ? error.message : '기록 형식이 올바르지 않습니다.'
    if (message.includes('최신')) {
      throw new AppError('ERR-PDF-VERSION', '더 최신 버전에서 만든 파일입니다.', { cause: error })
    }
    throw new AppError('ERR-PDF-CHECKSUM', 'PDF 안의 기록 데이터가 올바르지 않습니다.', {
      cause: error,
    })
  }

  const importedAssets: ImportedAssetBytes[] = payload.assetRefs.map((reference) => {
    const content = attachments.get(reference.file)
    if (!content) {
      throw new AppError('ERR-PDF-ATTACHMENT', 'PDF에 얼굴 사진 데이터가 빠져 있습니다.')
    }
    return { ...reference, bytes: content }
  })

  const parsed: ParsedEditablePdf = {
    manifest,
    payload,
    assets: importedAssets,
    fileName: file.name,
  }
  return {
    parsed,
    hasConflict: Boolean(await getTour(manifest.projectId)),
  }
}

export async function importParsedPdf(
  parsed: ParsedEditablePdf,
  mode: ImportMode,
): Promise<string> {
  const sourcePayload = mode === 'copy' ? remapPayloadIds(parsed.payload) : parsed.payload
  const assetIdMap = new Map<string, string>()
  if (mode === 'copy') {
    parsed.payload.assetRefs.forEach((source, index) => {
      const target = sourcePayload.assetRefs[index]
      if (target) assetIdMap.set(source.id, target.id)
    })
  }
  const assets = parsed.assets.map((asset) => ({
    ...asset,
    id: mode === 'copy' ? (assetIdMap.get(asset.id) ?? asset.id) : asset.id,
  }))
  const aggregate = payloadToAggregate(sourcePayload, assets)
  await replaceTourAggregate(aggregate, mode)
  return aggregate.tour.id
}
