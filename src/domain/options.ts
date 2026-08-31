import type {
  BackStyle,
  ColorTone,
  DressDetail,
  DressStyle,
  Neckline,
  OptionDescriptor,
  PrimaryFabric,
  QuickTag,
  Silhouette,
  TrainLength,
  UpperStyle,
  Waistline,
} from './types'

export const upperStyleOptions: OptionDescriptor<UpperStyle>[] = [
  { value: 'strapless', label: '끈 없음', professional: 'Strapless' },
  { value: 'offShoulder', label: '어깨 아래로 내려옴', professional: 'Off-shoulder' },
  { value: 'spaghetti', label: '얇은 끈', professional: 'Spaghetti strap' },
  { value: 'wideStrap', label: '넓은 끈', professional: 'Wide strap' },
  { value: 'halter', label: '목 뒤로 연결', professional: 'Halter' },
  { value: 'oneShoulder', label: '한쪽 어깨', professional: 'One-shoulder' },
  { value: 'capSleeve', label: '어깨만 살짝 덮음', professional: 'Cap sleeve' },
  { value: 'shortSleeve', label: '짧은 소매', professional: 'Short sleeve' },
  { value: 'longSleeve', label: '긴 소매', professional: 'Long sleeve' },
  { value: 'unknown', label: '잘 모르겠음' },
]

export const necklineOptions: OptionDescriptor<Neckline>[] = [
  { value: 'sweetheart', label: '하트 모양', professional: 'Sweetheart' },
  { value: 'straight', label: '일자 모양', professional: 'Straight' },
  { value: 'vNeck', label: 'V 모양', professional: 'V-neck' },
  { value: 'square', label: '네모 모양', professional: 'Square' },
  { value: 'scoop', label: '둥근 U 모양', professional: 'Scoop' },
  { value: 'bateau', label: '쇄골을 따라 넓게', professional: 'Bateau' },
  { value: 'highNeck', label: '목까지 올라옴', professional: 'High neck' },
  { value: 'illusion', label: '살색 망사 위 라인', professional: 'Illusion' },
  { value: 'asymmetric', label: '비대칭', professional: 'Asymmetric' },
  { value: 'unknown', label: '잘 모르겠음' },
]

export const waistlineOptions: OptionDescriptor<Waistline>[] = [
  { value: 'natural', label: '허리 위치', professional: 'Natural' },
  { value: 'basque', label: '가운데가 V자로 내려옴', professional: 'Basque' },
  { value: 'dropWaist', label: '골반 쪽까지 내려옴', professional: 'Drop waist' },
  { value: 'empire', label: '가슴 바로 아래', professional: 'Empire' },
  { value: 'seamless', label: '경계가 거의 없음', professional: 'Seamless' },
  { value: 'unknown', label: '잘 모르겠음' },
]

export const silhouetteOptions: OptionDescriptor<Silhouette>[] = [
  { value: 'aLine', label: '아래로 자연스럽게 퍼짐', professional: 'A-line' },
  { value: 'ballGown', label: '허리부터 아주 풍성함', professional: 'Ball gown' },
  { value: 'fitAndFlare', label: '몸에 붙다가 허벅지부터 퍼짐', professional: 'Fit & flare' },
  { value: 'mermaid', label: '무릎까지 붙고 크게 퍼짐', professional: 'Mermaid' },
  { value: 'sheath', label: '거의 일자로 떨어짐', professional: 'Sheath' },
  { value: 'empireFlow', label: '가슴 아래부터 부드럽게 떨어짐', professional: 'Empire' },
  { value: 'shortLength', label: '종아리·발목이 보임', professional: 'Tea / Short' },
  { value: 'unknown', label: '잘 모르겠음' },
]

export const primaryFabricOptions: OptionDescriptor<PrimaryFabric>[] = [
  { value: 'mikadoSilk', label: '매끈하고 힘 있는 실크', professional: 'Mikado silk' },
  { value: 'satin', label: '윤기 있는 새틴', professional: 'Satin' },
  { value: 'lace', label: '레이스', professional: 'Lace' },
  { value: 'tulle', label: '망사처럼 가볍고 풍성', professional: 'Tulle' },
  { value: 'organza', label: '얇지만 형태가 잡힘', professional: 'Organza' },
  { value: 'chiffon', label: '가볍게 흐르는 소재', professional: 'Chiffon' },
  { value: 'glitterTulle', label: '반짝이는 망사', professional: 'Glitter tulle' },
  { value: 'unknown', label: '잘 모르겠음' },
]

export const detailOptions: OptionDescriptor<DressDetail>[] = [
  { value: 'beading', label: '비즈·반짝이' },
  { value: 'pearl', label: '진주' },
  { value: 'laceApplique', label: '레이스 장식' },
  { value: 'floral3D', label: '입체 꽃' },
  { value: 'bow', label: '리본' },
  { value: 'draping', label: '사선 주름·드레이핑' },
  { value: 'ruching', label: '잔주름' },
  { value: 'slit', label: '치마 트임' },
  { value: 'pockets', label: '주머니' },
  { value: 'embroidery', label: '자수' },
  { value: 'overskirt', label: '탈부착 오버스커트' },
  { value: 'corset', label: '코르셋 절개' },
  { value: 'minimal', label: '장식 거의 없음' },
]

export const trainLengthOptions: OptionDescriptor<TrainLength>[] = [
  { value: 'none', label: '끌리는 부분 없음' },
  { value: 'short', label: '조금 끌림' },
  { value: 'medium', label: '보통 길이' },
  { value: 'long', label: '많이 김' },
  { value: 'veryLong', label: '엄청 김' },
  { value: 'unknown', label: '잘 모르겠음' },
]

export const backStyleOptions: OptionDescriptor<BackStyle>[] = [
  { value: 'closed', label: '등이 많이 가려짐' },
  { value: 'lowV', label: '등이 V자로 파임' },
  { value: 'openBack', label: '등이 크게 열림' },
  { value: 'corsetLaceUp', label: '끈으로 조이는 코르셋' },
  { value: 'buttons', label: '등 중앙 단추' },
  { value: 'illusionBack', label: '살색 망사·시스루' },
  { value: 'unknown', label: '잘 모르겠음' },
]

export const colorToneOptions: OptionDescriptor<ColorTone>[] = [
  { value: 'brightWhite', label: '밝은 흰색' },
  { value: 'ivory', label: '아이보리' },
  { value: 'champagne', label: '샴페인·베이지 기운' },
  { value: 'unknown', label: '잘 모르겠음' },
]

export const quickTagOptions: OptionDescriptor<QuickTag>[] = [
  { value: 'upperPretty', label: '상체가 예쁨' },
  { value: 'slimming', label: '허리가 얇아 보임' },
  { value: 'shoulderPretty', label: '어깨가 예쁨' },
  { value: 'faceBright', label: '얼굴이 살아남' },
  { value: 'looksSlim', label: '날씬해 보임' },
  { value: 'photoFriendly', label: '사진발 좋을 듯' },
  { value: 'comfortable', label: '움직이기 편함' },
  { value: 'heavy', label: '생각보다 무거움' },
  { value: 'hardToMove', label: '움직이기 불편함' },
  { value: 'tightBodice', label: '상체가 답답함' },
  { value: 'tooVoluminous', label: '치마가 너무 풍성함' },
  { value: 'lowVolume', label: '볼륨이 아쉬움' },
  { value: 'notMyStyle', label: '내 스타일 아님' },
  { value: 'bridePick', label: '신부 픽' },
  { value: 'companionPick', label: '동행인 픽' },
  { value: 'bothPick', label: '둘 다 픽' },
  { value: 'retryWanted', label: '재피팅 희망' },
]

export const defaultDressStyle: DressStyle = {
  upperStyle: 'unknown',
  neckline: 'unknown',
  waistline: 'unknown',
  silhouette: 'unknown',
  primaryFabric: 'unknown',
  details: [],
  trainLength: 'unknown',
  backStyle: 'unknown',
  colorTone: 'ivory',
}

export const defaultFaceTransform = {
  assetId: null,
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  mask: 'oval' as const,
  visibleInPreview: true,
  includeInPdf: true,
}

const maps = {
  upperStyle: new Map(upperStyleOptions.map((option) => [option.value, option.label])),
  neckline: new Map(necklineOptions.map((option) => [option.value, option.label])),
  waistline: new Map(waistlineOptions.map((option) => [option.value, option.label])),
  silhouette: new Map(silhouetteOptions.map((option) => [option.value, option.label])),
  primaryFabric: new Map(primaryFabricOptions.map((option) => [option.value, option.label])),
  trainLength: new Map(trainLengthOptions.map((option) => [option.value, option.label])),
  backStyle: new Map(backStyleOptions.map((option) => [option.value, option.label])),
  colorTone: new Map(colorToneOptions.map((option) => [option.value, option.label])),
  detail: new Map(detailOptions.map((option) => [option.value, option.label])),
  quickTag: new Map(quickTagOptions.map((option) => [option.value, option.label])),
}

export function getStyleLabels(style: DressStyle): string[] {
  return [
    maps.upperStyle.get(style.upperStyle) ?? '잘 모르겠음',
    maps.neckline.get(style.neckline) ?? '잘 모르겠음',
    maps.silhouette.get(style.silhouette) ?? '잘 모르겠음',
    maps.primaryFabric.get(style.primaryFabric) ?? '잘 모르겠음',
    maps.trainLength.get(style.trainLength) ?? '잘 모르겠음',
  ]
}

export function getDetailedStyleLabels(style: DressStyle): Array<{ label: string; value: string }> {
  return [
    { label: '어깨·소매', value: maps.upperStyle.get(style.upperStyle) ?? '잘 모르겠음' },
    { label: '가슴선', value: maps.neckline.get(style.neckline) ?? '잘 모르겠음' },
    { label: '허리선', value: maps.waistline.get(style.waistline) ?? '잘 모르겠음' },
    { label: '치마', value: maps.silhouette.get(style.silhouette) ?? '잘 모르겠음' },
    { label: '소재', value: maps.primaryFabric.get(style.primaryFabric) ?? '잘 모르겠음' },
    {
      label: '디테일',
      value:
        style.details.length > 0
          ? style.details.map((value) => maps.detail.get(value) ?? value).join(', ')
          : '선택 없음',
    },
    { label: '트레인', value: maps.trainLength.get(style.trainLength) ?? '잘 모르겠음' },
    { label: '뒷모습', value: maps.backStyle.get(style.backStyle) ?? '잘 모르겠음' },
    { label: '색감', value: maps.colorTone.get(style.colorTone) ?? '잘 모르겠음' },
  ]
}

export function getQuickTagLabel(tag: QuickTag): string {
  return maps.quickTag.get(tag) ?? tag
}

export function toggleDressDetail(current: DressDetail[], value: DressDetail): DressDetail[] {
  if (value === 'minimal') {
    return current.includes('minimal') ? [] : ['minimal']
  }
  const withoutMinimal = current.filter((item) => item !== 'minimal')
  return withoutMinimal.includes(value)
    ? withoutMinimal.filter((item) => item !== value)
    : [...withoutMinimal, value]
}

export interface CompatibilityResult {
  style: DressStyle
  changedMessage?: string
}

export function applyCompatibilityRules(
  style: DressStyle,
  changed: keyof DressStyle,
): CompatibilityResult {
  let next = { ...style, details: [...style.details] }
  let changedMessage: string | undefined

  if (changed === 'upperStyle' && next.upperStyle === 'halter') {
    const allowed: Neckline[] = ['highNeck', 'vNeck', 'scoop']
    if (!allowed.includes(next.neckline)) {
      next = { ...next, neckline: 'vNeck' }
      changedMessage = '홀터넥과 가장 비슷한 V 모양으로 바꿨어요.'
    }
  }

  if (changed === 'upperStyle' && next.upperStyle === 'oneShoulder') {
    if (next.neckline !== 'asymmetric') {
      next = { ...next, neckline: 'asymmetric' }
      changedMessage = '한쪽 어깨 모양에 맞춰 가슴선을 비대칭으로 바꿨어요.'
    }
  }

  if (changed === 'neckline' && next.upperStyle === 'halter') {
    const allowed: Neckline[] = ['highNeck', 'vNeck', 'scoop']
    if (!allowed.includes(next.neckline)) {
      next = { ...next, neckline: 'vNeck' }
      changedMessage = '홀터넥에서는 이 모양이 어려워 V 모양으로 표시했어요.'
    }
  }

  if (changed === 'neckline' && next.upperStyle === 'oneShoulder') {
    if (next.neckline !== 'asymmetric') {
      next = { ...next, neckline: 'asymmetric' }
      changedMessage = '한쪽 어깨 모양에서는 비대칭 가슴선으로 표시해요.'
    }
  }

  return { style: next, changedMessage }
}

export function copyDefaultStyle(): DressStyle {
  return { ...defaultDressStyle, details: [] }
}
