import { useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { DressPreview } from '../components/DressPreview'
import { getDetailedStyleLabels, getQuickTagLabel } from '../domain/options'
import { getTourAggregate } from '../lib/db/repositories'
import { useDbQuery } from '../shared/hooks'
import { Button, ErrorState, LoadingScreen, Page, Pill, TopBar } from '../shared/ui'

export function ComparePage() {
  const { tourId = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const loader = useCallback(() => getTourAggregate(tourId), [tourId])
  const { data, loading, error, reload } = useDbQuery(loader, [tourId])
  const ids = (params.get('dressIds') ?? '').split(',').filter(Boolean).slice(0, 3)

  if (loading) return <Page><TopBar title="후보 비교" back={`/tour/${tourId}/favorites`} /><LoadingScreen /></Page>
  if (error) return <Page><TopBar title="후보 비교" back={`/tour/${tourId}/favorites`} /><ErrorState message={error.message} action={<Button onClick={reload}>다시 시도</Button>} /></Page>
  if (!data) return <Page><TopBar title="후보 비교" back="/" /><ErrorState message="투어 기록을 찾을 수 없습니다." /></Page>

  const dresses = ids.map((id) => data.dresses.find((dress) => dress.id === id)).filter((dress) => Boolean(dress))
  if (dresses.length < 2) {
    return (
      <Page>
        <TopBar title="후보 비교" back={`/tour/${tourId}/favorites`} />
        <ErrorState
          title="비교할 드레스를 더 골라주세요"
          message="후보 중 2~3벌을 선택하면 비교할 수 있어요."
          action={<Button onClick={() => navigate(`/tour/${tourId}/favorites`)}>후보 선택하기</Button>}
        />
      </Page>
    )
  }

  const faceAsset = data.assets.find((asset) => asset.id === data.tour.faceConfig.assetId)
  const featureRows = [
    { label: '어깨·소매', index: 0 },
    { label: '가슴선', index: 1 },
    { label: '허리선', index: 2 },
    { label: '치마', index: 3 },
    { label: '소재', index: 4 },
    { label: '디테일', index: 5 },
    { label: '트레인', index: 6 },
    { label: '뒷모습', index: 7 },
    { label: '색감', index: 8 },
  ]

  return (
    <Page>
      <TopBar title="후보 비교" subtitle={`${dresses.length}벌`} back={`/tour/${tourId}/favorites`} />
      <div className="compare-head">
        <span className="eyebrow">COMPARE</span>
        <h1>옆으로 넘기며<br />후보를 비교해요</h1>
        <p>이미지는 가로로 넘기고, 아래에서 항목별 차이를 확인하세요.</p>
      </div>

      <section className="compare-carousel" aria-label="후보 드레스 이미지">
        {dresses.map((dress) => {
          if (!dress) return null
          const shop = data.shops.find((item) => item.id === dress.shopId)
          return (
            <article className="compare-hero-card" key={dress.id}>
              <div className="compare-hero-card__visual">
                <DressPreview style={dress.style} faceAsset={faceAsset} faceConfig={data.tour.faceConfig} title={`${shop?.name ?? ''} ${dress.name}`} />
              </div>
              <span className="eyebrow">{shop?.name}</span>
              <h2>{dress.name}</h2>
              <div className="chip-row">
                {dress.quickTags.slice(0, 4).map((tag) => <Pill key={tag}>{getQuickTagLabel(tag)}</Pill>)}
              </div>
              {dress.memo && <p>{dress.memo}</p>}
            </article>
          )
        })}
      </section>
      <div className="scroll-hint" aria-hidden="true">← 좌우로 넘겨보세요 →</div>

      <section className="comparison-table" aria-labelledby="feature-title">
        <h2 id="feature-title">특징 비교</h2>
        {featureRows.map((row) => (
          <div className="comparison-row" key={row.label}>
            <strong>{row.label}</strong>
            <div className="comparison-row__values">
              {dresses.map((dress) => {
                if (!dress) return null
                const descriptor = getDetailedStyleLabels(dress.style)[row.index]
                return <span key={dress.id}>{descriptor?.value ?? '선택 없음'}</span>
              })}
            </div>
          </div>
        ))}
      </section>

      <Button variant="secondary" block onClick={() => navigate(`/tour/${tourId}/favorites`)}>
        비교 후보 다시 고르기
      </Button>
    </Page>
  )
}
