import { useId, type CSSProperties } from 'react'
import { getDetailedStyleLabels } from './options'
import type { DressStyle, FaceTransform } from './types'

export interface DressComposerProps {
  style: DressStyle
  faceHref?: string | null
  faceTransform?: FaceTransform | null
  className?: string
  compact?: boolean
  title?: string
}

const palette = {
  brightWhite: { base: '#fffdf9', accent: '#ffffff', stroke: '#a79b95' },
  ivory: { base: '#fff6df', accent: '#fffdf5', stroke: '#a8978c' },
  champagne: { base: '#f6e3c7', accent: '#fff3df', stroke: '#a48b78' },
  unknown: { base: '#fff9ed', accent: '#ffffff', stroke: '#a79b95' },
} as const

function esc(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function necklineTop(style: DressStyle): string {
  switch (style.neckline) {
    case 'sweetheart':
      return 'M380 330 C420 278 472 308 500 370 C528 308 580 278 620 330'
    case 'vNeck':
      return 'M380 305 L500 432 L620 305'
    case 'square':
      return 'M378 298 L432 298 L432 384 L568 384 L568 298 L622 298'
    case 'scoop':
      return 'M378 300 Q500 438 622 300'
    case 'bateau':
      return 'M374 300 Q500 350 626 300'
    case 'highNeck':
      return 'M414 264 Q500 226 586 264 L622 332'
    case 'illusion':
      return 'M380 334 C420 282 472 310 500 370 C528 310 580 282 620 334'
    case 'asymmetric':
      return 'M368 282 L624 382'
    case 'straight':
    case 'unknown':
    default:
      return 'M378 326 L622 326'
  }
}

function bodicePath(style: DressStyle, waistY: number): string {
  const top = necklineTop(style)
  const bottom =
    style.waistline === 'basque'
      ? `L500 ${waistY + 54} L394 ${waistY}`
      : `L394 ${waistY}`
  return `${top} L606 ${waistY} ${bottom} Z`
}

function waistY(style: DressStyle): number {
  switch (style.waistline) {
    case 'empire':
      return 430
    case 'dropWaist':
      return 690
    case 'basque':
      return 570
    case 'seamless':
      return 590
    case 'unknown':
    case 'natural':
    default:
      return 570
  }
}

function skirtPath(style: DressStyle, startY: number): string {
  const y = style.silhouette === 'empireFlow' ? Math.min(startY, 430) : startY
  switch (style.silhouette) {
    case 'ballGown':
      return `M395 ${y} C315 ${y + 80} 165 880 104 1325 L896 1325 C835 880 685 ${y + 80} 605 ${y} Z`
    case 'fitAndFlare':
      return `M396 ${y} C418 750 424 900 350 1010 C290 1110 230 1230 190 1325 L810 1325 C770 1230 710 1110 650 1010 C576 900 582 750 604 ${y} Z`
    case 'mermaid':
      return `M396 ${y} C418 750 432 965 390 1050 C335 1160 235 1250 160 1325 L840 1325 C765 1250 665 1160 610 1050 C568 965 582 750 604 ${y} Z`
    case 'sheath':
      return `M398 ${y} C418 760 430 990 384 1325 L616 1325 C570 990 582 760 602 ${y} Z`
    case 'empireFlow':
      return `M382 ${y} C310 620 275 940 240 1325 L760 1325 C725 940 690 620 618 ${y} Z`
    case 'shortLength':
      return `M394 ${y} C330 720 295 875 260 1035 Q500 1115 740 1035 C705 875 670 720 606 ${y} Z`
    case 'unknown':
    case 'aLine':
    default:
      return `M395 ${y} C350 700 280 1000 205 1325 L795 1325 C720 1000 650 700 605 ${y} Z`
  }
}

function trainPath(style: DressStyle): string {
  const paths: Record<string, string> = {
    short: 'M420 1080 C565 1110 745 1190 900 1328 L530 1328 Z',
    medium: 'M410 1035 C590 1080 810 1180 978 1328 L510 1328 Z',
    long: 'M400 990 C610 1045 850 1150 1000 1328 L485 1328 Z',
    veryLong: 'M390 940 C645 1005 910 1120 1000 1250 L1000 1375 L455 1375 Z',
    unknown: 'M420 1080 C565 1110 745 1190 900 1328 L530 1328 Z',
  }
  return paths[style.trainLength] ?? ''
}

function upperStyleMarkup(style: DressStyle, fill: string, stroke: string): string {
  const common = `fill="${fill}" stroke="${stroke}" stroke-width="5" stroke-linejoin="round"`
  switch (style.upperStyle) {
    case 'offShoulder':
      return `<path d="M382 325 C350 338 326 352 304 385 C325 418 355 432 392 424" ${common}/><path d="M618 325 C650 338 674 352 696 385 C675 418 645 432 608 424" ${common}/>`
    case 'spaghetti':
      return `<path d="M412 326 L448 246 M588 326 L552 246" fill="none" stroke="${stroke}" stroke-width="14" stroke-linecap="round"/>`
    case 'wideStrap':
      return `<path d="M390 326 L430 244 L474 260 L454 342 Z" ${common}/><path d="M610 326 L570 244 L526 260 L546 342 Z" ${common}/>`
    case 'halter':
      return `<path d="M395 330 L462 242 Q500 222 538 242 L605 330 L555 380 L500 298 L445 380 Z" ${common}/>`
    case 'oneShoulder':
      return `<path d="M368 284 L424 238 L624 382 L604 438 L500 352 L414 334 Z" ${common}/>`
    case 'capSleeve':
      return `<path d="M386 322 Q322 310 304 362 Q332 402 390 406 Z" ${common}/><path d="M614 322 Q678 310 696 362 Q668 402 610 406 Z" ${common}/>`
    case 'shortSleeve':
      return `<path d="M386 320 Q300 300 284 380 L300 510 Q350 532 390 488 Z" ${common}/><path d="M614 320 Q700 300 716 380 L700 510 Q650 532 610 488 Z" ${common}/>`
    case 'longSleeve':
      return `<path d="M386 320 Q300 300 286 386 L264 795 Q310 820 344 790 L390 488 Z" ${common}/><path d="M614 320 Q700 300 714 386 L736 795 Q690 820 656 790 L610 488 Z" ${common}/>`
    case 'strapless':
    case 'unknown':
    default:
      return ''
  }
}

function fabricDefs(prefix: string, base: string, accent: string): string {
  return `
    <linearGradient id="${prefix}-satin" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${base}"/><stop offset="0.42" stop-color="${accent}"/><stop offset="0.68" stop-color="${base}"/><stop offset="1" stop-color="${accent}"/>
    </linearGradient>
    <pattern id="${prefix}-lace" width="70" height="70" patternUnits="userSpaceOnUse">
      <rect width="70" height="70" fill="${base}"/><path d="M8 35 Q35 2 62 35 Q35 68 8 35Z" fill="none" stroke="#c9b8ad" stroke-width="4"/><circle cx="35" cy="35" r="8" fill="#eaded5"/>
    </pattern>
    <pattern id="${prefix}-tulle" width="32" height="32" patternUnits="userSpaceOnUse">
      <rect width="32" height="32" fill="${base}"/><path d="M0 0L32 32M32 0L0 32" stroke="#d7ccc5" stroke-width="1.5" opacity=".65"/>
    </pattern>
    <pattern id="${prefix}-glitter" width="46" height="46" patternUnits="userSpaceOnUse">
      <rect width="46" height="46" fill="${base}"/><circle cx="8" cy="11" r="3" fill="#d6b46a"/><circle cx="31" cy="25" r="4" fill="#f7dfa1"/><circle cx="17" cy="39" r="2.5" fill="#c9a45b"/>
    </pattern>
    <pattern id="${prefix}-organza" width="90" height="90" patternUnits="userSpaceOnUse">
      <rect width="90" height="90" fill="${base}"/><path d="M0 25 Q45 0 90 25M0 65 Q45 40 90 65" fill="none" stroke="${accent}" stroke-width="9" opacity=".55"/>
    </pattern>
    <clipPath id="${prefix}-face-mask"><ellipse cx="500" cy="150" rx="87" ry="108"/></clipPath>
  `
}

function fabricFill(style: DressStyle, prefix: string, base: string): string {
  switch (style.primaryFabric) {
    case 'satin':
      return `url(#${prefix}-satin)`
    case 'lace':
      return `url(#${prefix}-lace)`
    case 'tulle':
    case 'chiffon':
      return `url(#${prefix}-tulle)`
    case 'organza':
      return `url(#${prefix}-organza)`
    case 'glitterTulle':
      return `url(#${prefix}-glitter)`
    case 'mikadoSilk':
    case 'unknown':
    default:
      return base
  }
}

function detailMarkup(style: DressStyle, stroke: string, base: string): string {
  const items: string[] = []
  const waist = waistY(style)
  const details = new Set(style.details)
  if (details.has('beading')) {
    for (let x = 410; x <= 590; x += 36) {
      for (let y = 360; y < waist - 10; y += 48) {
        items.push(`<circle cx="${x}" cy="${y}" r="7" fill="#d3ab62" opacity=".9"/>`)
      }
    }
  }
  if (details.has('pearl')) {
    for (let x = 420; x <= 580; x += 40) {
      items.push(`<circle cx="${x}" cy="${waist - 35}" r="9" fill="#fff" stroke="#cfc6bf" stroke-width="3"/>`)
    }
  }
  if (details.has('laceApplique') || details.has('floral3D')) {
    const radius = details.has('floral3D') ? 22 : 14
    ;[
      [430, 405],
      [530, 455],
      [470, 535],
      [580, 620],
      [360, 760],
      [640, 900],
      [470, 1050],
    ].forEach(([x, y]) => {
      items.push(`<g transform="translate(${x} ${y})"><circle r="${radius}" fill="#fffaf4" stroke="#cbb8ac" stroke-width="3"/><path d="M0 -${radius * 1.6}L0 ${radius * 1.6}M-${radius * 1.6} 0L${radius * 1.6} 0" stroke="#d7c6bc" stroke-width="5" stroke-linecap="round"/></g>`)
    })
  }
  if (details.has('bow')) {
    items.push(`<g transform="translate(500 ${waist + 10})"><path d="M0 0 C-75 -62 -132 -48 -116 18 C-96 78 -40 48 0 14 C40 48 96 78 116 18 C132 -48 75 -62 0 0Z" fill="${base}" stroke="${stroke}" stroke-width="5"/><circle r="24" fill="#fff" stroke="${stroke}" stroke-width="5"/></g>`)
  }
  if (details.has('draping')) {
    for (let y = 410; y < Math.min(waist + 180, 820); y += 54) {
      items.push(`<path d="M380 ${y} Q500 ${y + 65} 620 ${y - 12}" fill="none" stroke="#c9b8ae" stroke-width="10" opacity=".72"/>`)
    }
  }
  if (details.has('ruching')) {
    for (let y = 390; y < waist; y += 36) {
      items.push(`<path d="M398 ${y} Q500 ${y + 20} 602 ${y}" fill="none" stroke="#c9b8ae" stroke-width="7" opacity=".7"/>`)
    }
  }
  if (details.has('slit') && !['ballGown', 'empireFlow'].includes(style.silhouette)) {
    items.push(`<path d="M548 900 Q535 1090 590 1322" fill="none" stroke="#9b8a80" stroke-width="10"/><path d="M554 902 Q575 1090 610 1317" fill="none" stroke="#fff" stroke-width="5"/>`)
  }
  if (details.has('pockets')) {
    items.push(`<path d="M328 735 Q372 790 425 738M672 735 Q628 790 575 738" fill="none" stroke="${stroke}" stroke-width="8" stroke-linecap="round"/>`)
  }
  if (details.has('embroidery')) {
    items.push(`<path d="M380 880 Q470 760 530 875 T655 845 M330 1040 Q430 920 520 1035 T700 1005" fill="none" stroke="#c6a46b" stroke-width="8" opacity=".8"/>`)
  }
  if (details.has('overskirt')) {
    items.push(`<path d="M395 ${waist} C310 760 220 1030 150 1325 M605 ${waist} C690 760 780 1030 850 1325" fill="none" stroke="#bdaea5" stroke-width="12" opacity=".8"/>`)
  }
  if (details.has('corset')) {
    for (let x = 420; x <= 580; x += 40) {
      items.push(`<path d="M${x} 360 L${x + (500 - x) * 0.18} ${waist - 12}" stroke="#b8a79d" stroke-width="6" opacity=".85"/>`)
    }
  }
  return items.join('')
}

function faceMarkup(
  prefix: string,
  faceHref: string | null | undefined,
  transform: FaceTransform | null | undefined,
): string {
  const visible = Boolean(faceHref && transform?.visibleInPreview !== false)
  if (!visible || !faceHref) {
    return `<ellipse cx="500" cy="150" rx="87" ry="108" fill="#f0c8b5" stroke="#9b7567" stroke-width="5"/><path d="M432 130 Q500 50 568 130 L558 78 Q500 28 442 78Z" fill="#49352e"/><circle cx="472" cy="150" r="5" fill="#60453a"/><circle cx="528" cy="150" r="5" fill="#60453a"/><path d="M478 194 Q500 208 522 194" fill="none" stroke="#af6f69" stroke-width="5" stroke-linecap="round"/>`
  }
  const x = (transform?.x ?? 0) * 95
  const y = (transform?.y ?? 0) * 115
  const scale = transform?.scale ?? 1
  const rotation = transform?.rotation ?? 0
  const width = 210 * scale
  const height = 250 * scale
  const left = 500 - width / 2 + x
  const top = 150 - height / 2 + y
  return `<g clip-path="url(#${prefix}-face-mask)"><image href="${esc(faceHref)}" x="${left}" y="${top}" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice" transform="rotate(${rotation} 500 150)"/></g><ellipse cx="500" cy="150" rx="87" ry="108" fill="none" stroke="#9b7567" stroke-width="5"/>`
}

function backStyleMarkup(style: DressStyle, fill: string, stroke: string): string {
  if (style.backStyle === 'unknown') return ''
  const dressBody = `<path d="M38 96 Q92 58 146 96 L156 262 L28 262 Z" fill="${fill}" stroke="${stroke}" stroke-width="5"/>`
  const skin = '#efc6b2'
  let detail = ''
  switch (style.backStyle) {
    case 'lowV':
      detail = `<path d="M42 95 L92 192 L142 95 Z" fill="${skin}" stroke="${stroke}" stroke-width="4"/>`
      break
    case 'openBack':
      detail = `<ellipse cx="92" cy="137" rx="49" ry="70" fill="${skin}" stroke="${stroke}" stroke-width="4"/>`
      break
    case 'corsetLaceUp':
      detail = `<path d="M55 92 L55 210 M129 92 L129 210" stroke="${stroke}" stroke-width="4"/><path d="M57 105 L127 126 L57 148 L127 170 L57 192" fill="none" stroke="#a86e68" stroke-width="5"/>`
      break
    case 'buttons':
      detail = Array.from({ length: 7 }, (_, index) => `<circle cx="92" cy="${104 + index * 20}" r="5" fill="#fff" stroke="${stroke}" stroke-width="2"/>`).join('')
      break
    case 'illusionBack':
      detail = `<path d="M42 94 Q92 50 142 94 L132 206 Q92 226 52 206 Z" fill="${skin}" fill-opacity=".38" stroke="#c7aea1" stroke-width="4"/><path d="M52 108 Q92 78 132 108" fill="none" stroke="#bea99d" stroke-width="4" stroke-dasharray="7 7"/>`
      break
    case 'closed':
    default:
      detail = `<path d="M48 108 Q92 78 136 108" fill="none" stroke="#fff" stroke-width="7" opacity=".75"/>`
  }
  return `<g transform="translate(766 302)"><rect x="-22" y="-42" width="228" height="346" rx="34" fill="#fff" fill-opacity=".9" stroke="#e4d8d1" stroke-width="4"/><text x="92" y="-12" text-anchor="middle" fill="#8f7770" font-size="24" font-family="sans-serif" font-weight="700">BACK</text><g transform="translate(0 2)"><ellipse cx="92" cy="43" rx="31" ry="39" fill="${skin}" stroke="#9b7567" stroke-width="4"/><path d="M64 24 Q92 -1 120 24" fill="none" stroke="#49352e" stroke-width="18" stroke-linecap="round"/>${dressBody}${detail}<path d="M28 260 L2 298 L182 298 L156 260 Z" fill="${fill}" stroke="${stroke}" stroke-width="5"/></g></g>`
}

function waistMarkup(style: DressStyle, stroke: string): string {
  const y = waistY(style)
  if (style.waistline === 'seamless') return ''
  if (style.waistline === 'basque') {
    return `<path d="M394 ${y} L500 ${y + 54} L606 ${y}" fill="none" stroke="${stroke}" stroke-width="8"/>`
  }
  return `<path d="M394 ${y} Q500 ${y + (style.waistline === 'empire' ? 8 : 0)} 606 ${y}" fill="none" stroke="${stroke}" stroke-width="8"/>`
}

export function buildDressSvgInner(
  style: DressStyle,
  options: {
    prefix: string
    faceHref?: string | null
    faceTransform?: FaceTransform | null
  },
): string {
  const colors = palette[style.colorTone]
  const prefix = options.prefix.replace(/[^a-zA-Z0-9_-]/g, '') || 'dress'
  const fill = fabricFill(style, prefix, colors.base)
  const waist = waistY(style)
  const train = style.trainLength === 'none' ? '' : trainPath(style)
  const short = style.silhouette === 'shortLength'
  const bodyBottom = short ? 1040 : 1325

  return `
    <defs>${fabricDefs(prefix, colors.base, colors.accent)}</defs>
    <g id="train-back">${train ? `<path d="${train}" fill="${fill}" stroke="${colors.stroke}" stroke-width="7" opacity=".95"/>` : ''}</g>
    <g id="mannequin">
      <path d="M388 314 Q330 336 304 420 L256 780 Q280 812 322 790 L372 490 L395 580 L605 580 L628 490 L678 790 Q720 812 744 780 L696 420 Q670 336 612 314Z" fill="#efc6b2" stroke="#9b7567" stroke-width="6"/>
      <path d="M464 232 L464 304 L536 304 L536 232" fill="#efc6b2" stroke="#9b7567" stroke-width="5"/>
      ${faceMarkup(prefix, options.faceHref, options.faceTransform)}
      ${short ? '<path d="M416 1020 L404 1288 Q432 1318 465 1288 L482 1035 M584 1020 L596 1288 Q568 1318 535 1288 L518 1035" fill="#efc6b2" stroke="#9b7567" stroke-width="7"/>' : ''}
    </g>
    <g id="skirt-base"><path d="${skirtPath(style, waist)}" fill="${fill}" stroke="${colors.stroke}" stroke-width="8" stroke-linejoin="round"/></g>
    <g id="bodice-base"><path d="${bodicePath(style, waist)}" fill="${fill}" stroke="${colors.stroke}" stroke-width="8" stroke-linejoin="round"/></g>
    <g id="upper-style">${upperStyleMarkup(style, fill, colors.stroke)}</g>
    <g id="neckline-mask">
      ${style.neckline === 'illusion' ? `<path d="M414 264 Q500 226 586 264 L620 334 C580 282 528 310 500 370 C472 310 420 282 380 334Z" fill="#efc6b2" fill-opacity=".38" stroke="#c7aea1" stroke-width="4"/>` : ''}
    </g>
    <g id="fabric-texture">
      ${style.primaryFabric === 'chiffon' ? `<path d="M420 ${waist + 40} Q470 850 430 ${bodyBottom}M500 ${waist + 20}Q530 880 500 ${bodyBottom}M580 ${waist + 40}Q530 850 570 ${bodyBottom}" fill="none" stroke="#d7c8be" stroke-width="8" opacity=".65"/>` : ''}
      ${style.primaryFabric === 'mikadoSilk' ? `<path d="M430 ${waist + 60} Q500 800 570 ${waist + 60}" fill="none" stroke="#fff" stroke-width="16" opacity=".65"/>` : ''}
    </g>
    <g id="details">${detailMarkup(style, colors.stroke, colors.base)}</g>
    <g id="back-style">${backStyleMarkup(style, fill, colors.stroke)}</g>
    <g id="waistline">${waistMarkup(style, colors.stroke)}</g>
    <g id="outline-highlight"><path d="M418 ${waist + 35} Q500 ${waist + 78} 582 ${waist + 35}" fill="none" stroke="#fff" stroke-width="9" opacity=".55"/></g>
  `
}

export function buildDressSvgDocument(
  style: DressStyle,
  options: {
    prefix?: string
    faceHref?: string | null
    faceTransform?: FaceTransform | null
    background?: string
  } = {},
): string {
  const prefix = options.prefix ?? 'export-dress'
  const background = options.background
    ? `<rect width="1000" height="1400" rx="44" fill="${esc(options.background)}"/>`
    : ''
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1400" width="1000" height="1400">${background}${buildDressSvgInner(style, { prefix, faceHref: options.faceHref, faceTransform: options.faceTransform })}</svg>`
}

export function DressComposer({
  style,
  faceHref,
  faceTransform,
  className = '',
  compact = false,
  title,
}: DressComposerProps) {
  const reactId = useId()
  const prefix = reactId.replaceAll(':', '')
  const labels = getDetailedStyleLabels(style)
  const ariaLabel = title ?? `드레스 스케치: ${labels.map((item) => item.value).join(', ')}`
  const css = {
    '--composer-background': compact ? 'transparent' : '#fbf7f4',
  } as CSSProperties

  return (
    <svg
      className={`dress-composer ${compact ? 'dress-composer--compact' : ''} ${className}`}
      style={css}
      viewBox="0 0 1000 1400"
      role="img"
      aria-label={ariaLabel}
      preserveAspectRatio="xMidYMid meet"
    >
      {!compact && <rect width="1000" height="1400" rx="44" fill="var(--composer-background)" />}
      <g
        dangerouslySetInnerHTML={{
          __html: buildDressSvgInner(style, { prefix, faceHref, faceTransform }),
        }}
      />
    </svg>
  )
}
