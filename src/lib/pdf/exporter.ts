import { PDFDocument } from 'pdf-lib'
import {
  APP_ID,
  APP_VERSION,
  DATA_FILENAME,
  EDITABLE_PDF_FORMAT,
  MANIFEST_FILENAME,
  SCHEMA_VERSION,
  AppError,
  type Dress,
  type EditablePdfManifest,
  type ExportOptions,
  type LocalAsset,
  type Shop,
  type TourAggregate,
} from '../../domain/types'
import {
  getDetailedStyleLabels,
  getQuickTagLabel,
  getStyleLabels,
} from '../../domain/options'
import { buildDressSvgDocument } from '../../domain/composer'
import {
  blobToDataUrl,
  blobToUint8Array,
  formatDate,
  sanitizeFilename,
  stableStringify,
} from '../../shared/utils'
import { flushPendingSaves } from '../autosave/saveQueue'
import { sha256Hex } from '../crypto/checksum'
import { getTourAggregate } from '../db/repositories'
import { renderSvgToCanvas } from '../image/processImage'
import { createExportPayload } from './payload'

const PAGE_WIDTH = 1240
const PAGE_HEIGHT = 1754
const PAGE_MARGIN = 76
const PDF_WIDTH = 595.28
const PDF_HEIGHT = 841.89

interface CoverPageDescriptor {
  type: 'cover'
}
interface SummaryPageDescriptor {
  type: 'summary'
}
interface ShopPageDescriptor {
  type: 'shop'
  shop: Shop
  dresses: Dress[]
  firstForShop: boolean
}
interface FavoritesPageDescriptor {
  type: 'favorites'
  dresses: Dress[]
  first: boolean
}
type PageDescriptor =
  | CoverPageDescriptor
  | SummaryPageDescriptor
  | ShopPageDescriptor
  | FavoritesPageDescriptor

function setFont(context: CanvasRenderingContext2D, size: number, weight = 400): void {
  context.font = `${weight} ${size}px -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", sans-serif`
  context.textBaseline = 'top'
}

function wrapLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const paragraphs = text.replaceAll('\r', '').split('\n')
  const lines: string[] = []
  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push('')
      continue
    }
    const words = paragraph.split(/\s+/)
    let line = ''
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word
      if (context.measureText(candidate).width <= maxWidth) {
        line = candidate
        continue
      }
      if (line) lines.push(line)
      if (context.measureText(word).width <= maxWidth) {
        line = word
        continue
      }
      let chunk = ''
      for (const character of Array.from(word)) {
        const chunkCandidate = `${chunk}${character}`
        if (context.measureText(chunkCandidate).width > maxWidth && chunk) {
          lines.push(chunk)
          chunk = character
        } else {
          chunk = chunkCandidate
        }
      }
      line = chunk
    }
    if (line) lines.push(line)
  }
  return lines
}

function drawWrappedText(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines = Number.POSITIVE_INFINITY,
): number {
  const lines = wrapLines(context, text, maxWidth)
  const visible = lines.slice(0, maxLines)
  if (lines.length > visible.length && visible.length > 0) {
    const lastIndex = visible.length - 1
    let last = visible[lastIndex] ?? ''
    while (last && context.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1)
    visible[lastIndex] = `${last}…`
  }
  visible.forEach((line, index) => context.fillText(line, x, y + index * lineHeight))
  return visible.length * lineHeight
}

function roundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  context.beginPath()
  context.roundRect(x, y, width, height, radius)
}

function drawPill(
  context: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color = '#f2e5df',
): number {
  setFont(context, 22, 600)
  const width = context.measureText(text).width + 34
  context.fillStyle = color
  roundedRect(context, x, y, width, 42, 21)
  context.fill()
  context.fillStyle = '#6f4d42'
  context.fillText(text, x + 17, y + 8)
  return width
}

function baseCanvas(): { canvas: HTMLCanvasElement; context: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas')
  canvas.width = PAGE_WIDTH
  canvas.height = PAGE_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('PDF 페이지를 만들 수 없습니다.')
  context.fillStyle = '#fffdf9'
  context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
  context.fillStyle = '#3c302c'
  return { canvas, context }
}

function drawFooter(
  context: CanvasRenderingContext2D,
  pageNumber: number,
  totalPages: number,
): void {
  context.strokeStyle = '#e5dcd7'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(PAGE_MARGIN, PAGE_HEIGHT - 76)
  context.lineTo(PAGE_WIDTH - PAGE_MARGIN, PAGE_HEIGHT - 76)
  context.stroke()
  setFont(context, 18, 400)
  context.fillStyle = '#8a7b74'
  context.fillText('실제 드레스와 완전히 같지 않은 기억용 추정 이미지입니다.', PAGE_MARGIN, PAGE_HEIGHT - 52)
  const page = `${pageNumber} / ${totalPages}`
  context.fillText(
    page,
    PAGE_WIDTH - PAGE_MARGIN - context.measureText(page).width,
    PAGE_HEIGHT - 52,
  )
}

function buildPageDescriptors(aggregate: TourAggregate, options: ExportOptions): PageDescriptor[] {
  const descriptors: PageDescriptor[] = [{ type: 'cover' }, { type: 'summary' }]
  for (const shop of aggregate.shops) {
    const dresses = aggregate.dresses
      .filter((dress) => dress.shopId === shop.id)
      .sort((a, b) => a.order - b.order)
    if (dresses.length === 0) {
      descriptors.push({ type: 'shop', shop, dresses: [], firstForShop: true })
      continue
    }
    let firstForShop = true
    let index = 0
    while (index < dresses.length) {
      const current = dresses[index]
      if (!current) break
      const longMemo = options.includeDressMemo && current.memo.length > 550
      const next = dresses[index + 1]
      const nextLong = Boolean(next && options.includeDressMemo && next.memo.length > 550)
      const chunk = longMemo || nextLong || !next ? [current] : [current, next]
      descriptors.push({ type: 'shop', shop, dresses: chunk, firstForShop })
      firstForShop = false
      index += chunk.length
    }
  }
  if (options.includeFavoritesSummary) {
    const favorites = aggregate.dresses.filter((dress) => dress.isFavorite)
    for (let index = 0; index < favorites.length; index += 2) {
      descriptors.push({
        type: 'favorites',
        dresses: favorites.slice(index, index + 2),
        first: index === 0,
      })
    }
  }
  return descriptors
}

async function drawDressCard(
  context: CanvasRenderingContext2D,
  dress: Dress,
  shop: Shop,
  aggregate: TourAggregate,
  faceHref: string | null,
  options: ExportOptions,
  y: number,
  height: number,
): Promise<void> {
  const x = PAGE_MARGIN
  const width = PAGE_WIDTH - PAGE_MARGIN * 2
  context.fillStyle = '#ffffff'
  context.strokeStyle = dress.isFavorite ? '#a35c52' : '#e4dad5'
  context.lineWidth = dress.isFavorite ? 5 : 2
  roundedRect(context, x, y, width, height, 32)
  context.fill()
  context.stroke()

  const imageHeight = Math.min(height - 72, 520)
  const imageWidth = Math.round((imageHeight * 5) / 7)
  const imageX = x + 30
  const imageY = y + 30
  const svg = buildDressSvgDocument(dress.style, {
    prefix: `pdf-${dress.id.replaceAll('-', '')}`,
    faceHref,
    faceTransform: aggregate.tour.faceConfig,
    background: '#faf6f3',
  })
  const dressCanvas = await renderSvgToCanvas(svg, imageWidth * 2, imageHeight * 2)
  context.drawImage(dressCanvas, imageX, imageY, imageWidth, imageHeight)

  const textX = imageX + imageWidth + 38
  const textWidth = width - imageWidth - 108
  setFont(context, 31, 700)
  context.fillStyle = '#3f322e'
  context.fillText(`${dress.isFavorite ? '♥ ' : ''}${dress.name}`, textX, imageY + 2)
  setFont(context, 20, 500)
  context.fillStyle = '#8b756c'
  context.fillText(shop.name, textX, imageY + 48)

  let cursorY = imageY + 90
  let pillX = textX
  for (const label of getStyleLabels(dress.style).slice(0, 5)) {
    const pillWidth = drawPill(context, label, pillX, cursorY)
    if (pillX + pillWidth > textX + textWidth - 10) {
      pillX = textX
      cursorY += 54
    } else {
      pillX += pillWidth + 10
    }
  }
  cursorY += 66

  const details = getDetailedStyleLabels(dress.style)
  setFont(context, 21, 500)
  for (const row of details.slice(0, 6)) {
    context.fillStyle = '#8a766d'
    context.fillText(row.label, textX, cursorY)
    context.fillStyle = '#3e342f'
    drawWrappedText(context, row.value, textX + 118, cursorY, textWidth - 118, 29, 2)
    cursorY += 36
  }

  if (dress.quickTags.length > 0) {
    cursorY += 8
    setFont(context, 20, 600)
    context.fillStyle = '#a15c51'
    drawWrappedText(
      context,
      dress.quickTags.map(getQuickTagLabel).join(' · '),
      textX,
      cursorY,
      textWidth,
      30,
      3,
    )
    cursorY += Math.min(90, wrapLines(context, dress.quickTags.map(getQuickTagLabel).join(' · '), textWidth).length * 30)
  }

  if (options.includeDressMemo && dress.memo.trim()) {
    cursorY += 12
    setFont(context, 19, 400)
    context.fillStyle = '#51443f'
    drawWrappedText(
      context,
      dress.memo,
      textX,
      cursorY,
      textWidth,
      29,
      Math.max(4, Math.floor((imageY + height - 36 - cursorY) / 29)),
    )
  }
}

async function renderDescriptor(
  descriptor: PageDescriptor,
  aggregate: TourAggregate,
  options: ExportOptions,
  faceHref: string | null,
  pageNumber: number,
  totalPages: number,
): Promise<HTMLCanvasElement> {
  const { canvas, context } = baseCanvas()
  const { tour, shops, dresses } = aggregate

  if (descriptor.type === 'cover') {
    context.fillStyle = '#f4e7e1'
    context.fillRect(0, 0, PAGE_WIDTH, PAGE_HEIGHT)
    context.fillStyle = '#fffaf6'
    roundedRect(context, PAGE_MARGIN, PAGE_MARGIN, PAGE_WIDTH - PAGE_MARGIN * 2, PAGE_HEIGHT - 220, 46)
    context.fill()
    setFont(context, 30, 700)
    context.fillStyle = '#9c5c52'
    context.fillText('그드레스', PAGE_MARGIN + 60, PAGE_MARGIN + 60)
    setFont(context, 63, 800)
    context.fillStyle = '#392e2a'
    drawWrappedText(
      context,
      tour.title,
      PAGE_MARGIN + 60,
      PAGE_MARGIN + 180,
      PAGE_WIDTH - PAGE_MARGIN * 2 - 120,
      82,
      3,
    )
    setFont(context, 29, 500)
    context.fillStyle = '#7e6860'
    let y = PAGE_MARGIN + 475
    if (tour.brideName) {
      context.fillText(`신부  ${tour.brideName}`, PAGE_MARGIN + 60, y)
      y += 58
    }
    context.fillText(`투어 날짜  ${formatDate(tour.tourDate)}`, PAGE_MARGIN + 60, y)
    y += 58
    context.fillText(`드레스샵 ${shops.length}곳 · 드레스 ${dresses.length}벌`, PAGE_MARGIN + 60, y)
    y += 100
    context.strokeStyle = '#dfd1ca'
    context.lineWidth = 3
    context.beginPath()
    context.moveTo(PAGE_MARGIN + 60, y)
    context.lineTo(PAGE_WIDTH - PAGE_MARGIN - 60, y)
    context.stroke()
    setFont(context, 24, 400)
    context.fillStyle = '#74635c'
    drawWrappedText(
      context,
      '사진 촬영이 어려운 드레스투어에서 선택한 특징을 바탕으로 만든 기록입니다.',
      PAGE_MARGIN + 60,
      y + 50,
      PAGE_WIDTH - PAGE_MARGIN * 2 - 120,
      38,
    )
    setFont(context, 20, 400)
    context.fillStyle = '#98867f'
    drawWrappedText(
      context,
      '이 원본 PDF는 그드레스 웹앱에서 다시 불러와 수정할 수 있습니다. 인쇄하거나 다른 서비스로 재저장하면 편집 데이터가 사라질 수 있습니다.',
      PAGE_MARGIN + 60,
      PAGE_HEIGHT - 350,
      PAGE_WIDTH - PAGE_MARGIN * 2 - 120,
      32,
    )
  }

  if (descriptor.type === 'summary') {
    setFont(context, 44, 800)
    context.fillStyle = '#3e312d'
    context.fillText('투어 한눈에 보기', PAGE_MARGIN, PAGE_MARGIN)
    setFont(context, 23, 500)
    context.fillStyle = '#826d64'
    context.fillText(`${formatDate(tour.tourDate)} · 후보 ${dresses.filter((dress) => dress.isFavorite).length}벌`, PAGE_MARGIN, PAGE_MARGIN + 65)
    let y = PAGE_MARGIN + 145
    if (tour.memo) {
      context.fillStyle = '#f7efeb'
      roundedRect(context, PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN * 2, 190, 28)
      context.fill()
      setFont(context, 22, 700)
      context.fillStyle = '#7d554b'
      context.fillText('투어 메모', PAGE_MARGIN + 28, y + 24)
      setFont(context, 20, 400)
      context.fillStyle = '#4a3e39'
      drawWrappedText(
        context,
        tour.memo,
        PAGE_MARGIN + 28,
        y + 68,
        PAGE_WIDTH - PAGE_MARGIN * 2 - 56,
        30,
        3,
      )
      y += 222
    }
    for (const [index, shop] of shops.entries()) {
      const shopDresses = dresses.filter((dress) => dress.shopId === shop.id)
      context.fillStyle = '#ffffff'
      context.strokeStyle = '#e6dcd7'
      context.lineWidth = 2
      roundedRect(context, PAGE_MARGIN, y, PAGE_WIDTH - PAGE_MARGIN * 2, 114, 22)
      context.fill()
      context.stroke()
      setFont(context, 21, 700)
      context.fillStyle = '#a15d52'
      context.fillText(`${index + 1}`, PAGE_MARGIN + 26, y + 39)
      setFont(context, 27, 700)
      context.fillStyle = '#3f332e'
      context.fillText(shop.name, PAGE_MARGIN + 70, y + 24)
      setFont(context, 19, 400)
      context.fillStyle = '#8a7770'
      const info = `${shop.appointmentTime ? `${shop.appointmentTime} · ` : ''}드레스 ${shopDresses.length}벌 · 후보 ${shopDresses.filter((dress) => dress.isFavorite).length}벌`
      context.fillText(info, PAGE_MARGIN + 70, y + 65)
      y += 132
      if (y > PAGE_HEIGHT - 210) break
    }
  }

  if (descriptor.type === 'shop') {
    setFont(context, 21, 700)
    context.fillStyle = '#a25d52'
    context.fillText('DRESS SHOP', PAGE_MARGIN, PAGE_MARGIN)
    setFont(context, 40, 800)
    context.fillStyle = '#3c302c'
    context.fillText(descriptor.shop.name, PAGE_MARGIN, PAGE_MARGIN + 38)
    setFont(context, 21, 400)
    context.fillStyle = '#806b63'
    const sub = [descriptor.shop.appointmentTime, `드레스 ${aggregate.dresses.filter((dress) => dress.shopId === descriptor.shop.id).length}벌`]
      .filter(Boolean)
      .join(' · ')
    context.fillText(sub, PAGE_MARGIN, PAGE_MARGIN + 96)
    let y = PAGE_MARGIN + 145
    if (descriptor.firstForShop && options.includeShopMemo && descriptor.shop.memo) {
      setFont(context, 19, 400)
      context.fillStyle = '#6c5a53'
      const used = drawWrappedText(
        context,
        descriptor.shop.memo,
        PAGE_MARGIN,
        y,
        PAGE_WIDTH - PAGE_MARGIN * 2,
        29,
        3,
      )
      y += used + 24
    }
    if (descriptor.dresses.length === 0) {
      context.fillStyle = '#f7efeb'
      roundedRect(context, PAGE_MARGIN, y + 40, PAGE_WIDTH - PAGE_MARGIN * 2, 280, 32)
      context.fill()
      setFont(context, 28, 700)
      context.fillStyle = '#80675e'
      context.fillText('기록한 드레스가 없습니다.', PAGE_MARGIN + 40, y + 145)
    } else if (descriptor.dresses.length === 1) {
      await drawDressCard(
        context,
        descriptor.dresses[0]!,
        descriptor.shop,
        aggregate,
        faceHref,
        options,
        y,
        PAGE_HEIGHT - y - 120,
      )
    } else {
      const available = PAGE_HEIGHT - y - 120
      const gap = 28
      const height = (available - gap) / 2
      await drawDressCard(
        context,
        descriptor.dresses[0]!,
        descriptor.shop,
        aggregate,
        faceHref,
        options,
        y,
        height,
      )
      await drawDressCard(
        context,
        descriptor.dresses[1]!,
        descriptor.shop,
        aggregate,
        faceHref,
        options,
        y + height + gap,
        height,
      )
    }
  }

  if (descriptor.type === 'favorites') {
    setFont(context, 21, 700)
    context.fillStyle = '#a25d52'
    context.fillText('MY FAVORITES', PAGE_MARGIN, PAGE_MARGIN)
    setFont(context, 40, 800)
    context.fillStyle = '#3c302c'
    context.fillText(descriptor.first ? '최종 후보 모아보기' : '최종 후보 모아보기 (계속)', PAGE_MARGIN, PAGE_MARGIN + 38)
    const y = PAGE_MARGIN + 120
    const available = PAGE_HEIGHT - y - 120
    const gap = 28
    const height = descriptor.dresses.length === 1 ? available : (available - gap) / 2
    for (const [index, dress] of descriptor.dresses.entries()) {
      const shop = aggregate.shops.find((item) => item.id === dress.shopId)
      if (!shop) continue
      await drawDressCard(
        context,
        dress,
        shop,
        aggregate,
        faceHref,
        options,
        y + index * (height + gap),
        height,
      )
    }
  }

  drawFooter(context, pageNumber, totalPages)
  return canvas
}

function canvasToPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        reject(new Error('PDF 페이지 이미지를 만들 수 없습니다.'))
        return
      }
      resolve(new Uint8Array(await blob.arrayBuffer()))
    }, 'image/png')
  })
}

export interface ExportResult {
  blob: Blob
  filename: string
}

export async function exportTourToPdf(
  tourId: string,
  options: ExportOptions,
): Promise<ExportResult> {
  try {
    await flushPendingSaves(tourId)
    const aggregate = await getTourAggregate(tourId)
    if (!aggregate || aggregate.dresses.length === 0) {
      throw new Error('내보낼 드레스 기록이 없습니다.')
    }

    const includeFace = Boolean(
      options.includeFace &&
        aggregate.tour.faceConfig.includeInPdf &&
        aggregate.tour.faceConfig.assetId,
    )
    const { payload, assets } = createExportPayload(aggregate, includeFace)
    const faceAsset = assets[0] as LocalAsset | undefined
    const faceHref = faceAsset ? await blobToDataUrl(faceAsset.blob) : null
    const descriptors = buildPageDescriptors(aggregate, options)
    const pdf = await PDFDocument.create()

    for (const [index, descriptor] of descriptors.entries()) {
      const canvas = await renderDescriptor(
        descriptor,
        aggregate,
        options,
        faceHref,
        index + 1,
        descriptors.length,
      )
      const image = await pdf.embedPng(await canvasToPngBytes(canvas))
      const page = pdf.addPage([PDF_WIDTH, PDF_HEIGHT])
      page.drawImage(image, { x: 0, y: 0, width: PDF_WIDTH, height: PDF_HEIGHT })
    }

    const dataBytes = new TextEncoder().encode(stableStringify(payload))
    const manifestAssets: EditablePdfManifest['assets'] = [
      {
        file: DATA_FILENAME,
        mimeType: 'application/json',
        sha256: await sha256Hex(dataBytes),
        byteSize: dataBytes.byteLength,
      },
    ]

    await pdf.attach(dataBytes, DATA_FILENAME, {
      mimeType: 'application/json',
      description: '그드레스 편집용 투어 데이터',
      creationDate: new Date(),
      modificationDate: new Date(),
    })

    for (const [index, asset] of assets.entries()) {
      const reference = payload.assetRefs[index]
      if (!reference) continue
      const bytes = await blobToUint8Array(asset.blob)
      manifestAssets.push({
        file: reference.file,
        mimeType: asset.mimeType,
        sha256: await sha256Hex(bytes),
        byteSize: bytes.byteLength,
      })
      await pdf.attach(bytes, reference.file, {
        mimeType: asset.mimeType,
        description: '그드레스 얼굴 사진',
        creationDate: new Date(),
        modificationDate: new Date(),
      })
    }

    const manifest: EditablePdfManifest = {
      appId: APP_ID,
      format: EDITABLE_PDF_FORMAT,
      schemaVersion: SCHEMA_VERSION,
      exportVersion: APP_VERSION,
      projectId: aggregate.tour.id,
      exportedAt: new Date().toISOString(),
      dataFile: DATA_FILENAME,
      assets: manifestAssets,
      summary: {
        title: aggregate.tour.title,
        tourDate: aggregate.tour.tourDate,
        shopCount: aggregate.shops.length,
        dressCount: aggregate.dresses.length,
        hasFace: Boolean(faceAsset),
      },
    }
    await pdf.attach(new TextEncoder().encode(stableStringify(manifest)), MANIFEST_FILENAME, {
      mimeType: 'application/json',
      description: '그드레스 편집 파일 안내',
      creationDate: new Date(),
      modificationDate: new Date(),
    })

    pdf.setTitle(aggregate.tour.title)
    pdf.setAuthor('그드레스')
    pdf.setSubject('드레스투어 기록')
    pdf.setKeywords(['드레스투어', '그드레스', '웨딩드레스'])
    pdf.setCreator(`그드레스 ${APP_VERSION}`)
    pdf.setProducer('pdf-lib')
    pdf.setCreationDate(new Date())
    pdf.setModificationDate(new Date())

    const bytes = await pdf.save({ useObjectStreams: false })
    const blob = new Blob([Uint8Array.from(bytes).buffer], { type: 'application/pdf' })
    const owner = aggregate.tour.brideName || aggregate.tour.title
    const filename = `${sanitizeFilename(owner)}_드레스투어_${aggregate.tour.tourDate}.pdf`
    return { blob, filename }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('ERR-EXPORT', 'PDF를 만들지 못했습니다. 기록은 안전하게 저장되어 있습니다.', {
      cause: error,
    })
  }
}
