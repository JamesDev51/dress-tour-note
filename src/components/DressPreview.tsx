import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { DressComposer } from '../domain/composer'
import {
  getQuickTagLabel,
  getStyleLabels,
  type CompatibilityResult,
} from '../domain/options'
import type {
  Dress,
  DressDetail,
  DressStyle,
  FaceTransform,
  LocalAsset,
  OptionDescriptor,
  Shop,
} from '../domain/types'
import { useObjectUrl } from '../shared/hooks'
import { Pill } from '../shared/ui'
import { truncate } from '../shared/utils'

export function DressPreview({
  style,
  faceAsset,
  faceConfig,
  title,
  compact = false,
}: {
  style: DressStyle
  faceAsset?: LocalAsset | null
  faceConfig?: FaceTransform | null
  title?: string
  compact?: boolean
}) {
  const faceHref = useObjectUrl(faceAsset?.blob)
  return (
    <DressComposer
      style={style}
      faceHref={faceHref}
      faceTransform={faceConfig}
      title={title}
      compact={compact}
    />
  )
}

export function DressCard({
  dress,
  shop,
  faceAsset,
  faceConfig,
  to,
  selected,
  onFavorite,
  actions,
}: {
  dress: Dress
  shop: Shop
  faceAsset?: LocalAsset | null
  faceConfig?: FaceTransform | null
  to?: string
  selected?: boolean
  onFavorite?: () => void
  actions?: ReactNode
}) {
  const content = (
    <>
      <div className="dress-card__visual">
        <DressPreview
          style={dress.style}
          faceAsset={faceAsset}
          faceConfig={faceConfig}
          title={`${shop.name} ${dress.name}`}
          compact
        />
      </div>
      <div className="dress-card__body">
        <div className="dress-card__header">
          <div>
            <span className="eyebrow">{shop.name}</span>
            <h3>{dress.name}</h3>
          </div>
          {onFavorite && (
            <button
              className={`heart-button ${dress.isFavorite ? 'heart-button--active' : ''}`}
              type="button"
              aria-label={dress.isFavorite ? '후보에서 해제' : '후보로 저장'}
              aria-pressed={dress.isFavorite}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                onFavorite()
              }}
            >
              {dress.isFavorite ? '♥' : '♡'}
            </button>
          )}
        </div>
        <div className="chip-row chip-row--compact">
          {getStyleLabels(dress.style)
            .filter((label) => label !== '잘 모르겠음')
            .slice(0, 3)
            .map((label) => (
              <Pill key={label}>{label}</Pill>
            ))}
        </div>
        {dress.quickTags.length > 0 && (
          <p className="dress-card__tags">
            {dress.quickTags.slice(0, 3).map(getQuickTagLabel).join(' · ')}
          </p>
        )}
        {dress.memo && <p className="dress-card__memo">{truncate(dress.memo, 72)}</p>}
        {selected !== undefined && (
          <span className={`select-status ${selected ? 'select-status--active' : ''}`}>
            {selected ? '비교에 선택됨 ✓' : '비교에 추가'}
          </span>
        )}
      </div>
    </>
  )
  return (
    <article className={`dress-card ${selected ? 'dress-card--selected' : ''}`}>
      {to ? (
        <Link className="dress-card__link" to={to}>
          {content}
        </Link>
      ) : (
        <div className="dress-card__link">{content}</div>
      )}
      {actions && <div className="dress-card__actions">{actions}</div>}
    </article>
  )
}

export function OptionCard<T extends string>({
  option,
  selected,
  style,
  onSelect,
  multiselect = false,
}: {
  option: OptionDescriptor<T>
  selected: boolean
  style: DressStyle
  onSelect: () => void
  multiselect?: boolean
}) {
  return (
    <button
      className={`option-card ${selected ? 'option-card--selected' : ''}`}
      type="button"
      role={multiselect ? 'checkbox' : 'radio'}
      aria-checked={selected}
      onClick={onSelect}
    >
      <span className="option-card__visual" aria-hidden="true">
        <DressComposer style={style} compact />
      </span>
      <span className="option-card__copy">
        <strong>{option.label}</strong>
        {option.professional && <small>{option.professional}</small>}
      </span>
      <span className="option-card__check" aria-hidden="true">
        {selected ? '✓' : ''}
      </span>
    </button>
  )
}

export function DetailOptionCard({
  option,
  selected,
  previewStyle,
  onSelect,
}: {
  option: OptionDescriptor<DressDetail>
  selected: boolean
  previewStyle: DressStyle
  onSelect: () => void
}) {
  return (
    <OptionCard
      option={option}
      selected={selected}
      style={previewStyle}
      onSelect={onSelect}
      multiselect
    />
  )
}

export function CompatibilityNotice({ result }: { result: CompatibilityResult | null }) {
  if (!result?.changedMessage) return null
  return (
    <p className="compatibility-note" role="status">
      {result.changedMessage}
    </p>
  )
}
