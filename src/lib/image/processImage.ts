import { AppError } from '../../domain/types'

const MAX_INPUT_BYTES = 20 * 1024 * 1024
const MAX_EDGE = 1600

export interface ProcessedImage {
  blob: Blob
  mimeType: 'image/webp' | 'image/jpeg'
  width: number
  height: number
  byteSize: number
}

function isHeic(file: File): boolean {
  const lower = file.name.toLowerCase()
  return (
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    lower.endsWith('.heic') ||
    lower.endsWith('.heif')
  )
}

function isSupported(file: File): boolean {
  return ['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || isHeic(file)
}

async function convertHeic(file: File): Promise<Blob> {
  try {
    const { default: heic2any } = await import('heic2any')
    const output = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 })
    return Array.isArray(output) ? (output[0] ?? file) : output
  } catch (error) {
    throw new AppError(
      'ERR-IMAGE-TYPE',
      '이 HEIC 사진을 열 수 없습니다. 사진 앱에서 JPEG로 저장한 뒤 다시 선택해주세요.',
      { cause: error },
    )
  }
}

interface DecodedSource {
  source: CanvasImageSource
  width: number
  height: number
  dispose: () => void
}

async function decodeImage(blob: Blob): Promise<DecodedSource> {
  if ('createImageBitmap' in window) {
    try {
      const bitmap = await createImageBitmap(blob, { imageOrientation: 'from-image' })
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        dispose: () => bitmap.close(),
      }
    } catch {
      // Continue with the HTMLImageElement fallback.
    }
  }

  const url = URL.createObjectURL(blob)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('이미지를 디코딩할 수 없습니다.'))
      element.src = url
    })
    return {
      source: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
      dispose: () => URL.revokeObjectURL(url),
    }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('이미지 압축에 실패했습니다.'))),
      type,
      quality,
    )
  })
}

export async function processFaceImage(file: File): Promise<ProcessedImage> {
  if (file.size > MAX_INPUT_BYTES) {
    throw new AppError('ERR-IMAGE-SIZE', '20MB 이하의 사진을 선택해주세요.')
  }
  if (!isSupported(file)) {
    throw new AppError(
      'ERR-IMAGE-TYPE',
      'JPEG, PNG, WebP 또는 HEIC 형식의 사진을 선택해주세요.',
    )
  }

  const input = isHeic(file) ? await convertHeic(file) : file
  let decoded: DecodedSource | null = null
  try {
    decoded = await decodeImage(input)
    if (!decoded.width || !decoded.height) {
      throw new Error('사진 크기를 확인할 수 없습니다.')
    }
    const scale = Math.min(1, MAX_EDGE / Math.max(decoded.width, decoded.height))
    const width = Math.max(1, Math.round(decoded.width * scale))
    const height = Math.max(1, Math.round(decoded.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { alpha: false })
    if (!context) throw new Error('이미지 처리 환경을 열 수 없습니다.')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, width, height)
    context.drawImage(decoded.source, 0, 0, width, height)

    try {
      const webp = await canvasToBlob(canvas, 'image/webp', 0.82)
      if (webp.type === 'image/webp' && webp.size > 0) {
        return {
          blob: webp,
          mimeType: 'image/webp',
          width,
          height,
          byteSize: webp.size,
        }
      }
    } catch {
      // Use JPEG fallback below.
    }

    const jpeg = await canvasToBlob(canvas, 'image/jpeg', 0.85)
    return {
      blob: jpeg,
      mimeType: 'image/jpeg',
      width,
      height,
      byteSize: jpeg.size,
    }
  } catch (error) {
    if (error instanceof AppError) throw error
    throw new AppError('ERR-IMAGE-DECODE', '사진을 열 수 없습니다. 다른 사진을 선택해주세요.', {
      cause: error,
    })
  } finally {
    decoded?.dispose()
  }
}

export async function renderSvgToCanvas(
  svgMarkup: string,
  width: number,
  height: number,
): Promise<HTMLCanvasElement> {
  const blob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('드레스 이미지를 만들 수 없습니다.'))
      element.src = url
    })
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas를 사용할 수 없습니다.')
    context.drawImage(image, 0, 0, width, height)
    return canvas
  } finally {
    URL.revokeObjectURL(url)
  }
}
