import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DressCard } from '../components/DressPreview'
import { getTourAggregate, patchDress } from '../lib/db/repositories'
import { useDbQuery } from '../shared/hooks'
import { useToastStore } from '../shared/stores'
import {
  BottomBar,
  Button,
  EmptyState,
  ErrorState,
  LoadingScreen,
  Page,
  TopBar,
} from '../shared/ui'

export function FavoritesPage() {
  const { tourId = '' } = useParams()
  const navigate = useNavigate()
  const loader = useCallback(() => getTourAggregate(tourId), [tourId])
  const { data, loading, error, reload } = useDbQuery(loader, [tourId])
  const [selected, setSelected] = useState<string[]>([])
  const [filter, setFilter] = useState('all')
  const showToast = useToastStore((state) => state.show)

  useEffect(() => {
    if (!data) return
    const favoriteIds = new Set(data.dresses.filter((dress) => dress.isFavorite).map((dress) => dress.id))
    setSelected((current) => current.filter((id) => favoriteIds.has(id)))
  }, [data])

  if (loading) return <Page><TopBar title="최종 후보" back={`/tour/${tourId}`} /><LoadingScreen /></Page>
  if (error) return <Page><TopBar title="최종 후보" back={`/tour/${tourId}`} /><ErrorState message={error.message} action={<Button onClick={reload}>다시 시도</Button>} /></Page>
  if (!data) return <Page><TopBar title="최종 후보" back="/" /><ErrorState message="투어 기록을 찾을 수 없습니다." /></Page>

  const favorites = data.dresses.filter((dress) => dress.isFavorite)
  const filtered = filter === 'all' ? favorites : favorites.filter((dress) => dress.shopId === filter)
  const faceAsset = data.assets.find((asset) => asset.id === data.tour.faceConfig.assetId)

  const toggleCompare = (dressId: string) => {
    if (selected.includes(dressId)) {
      setSelected(selected.filter((id) => id !== dressId))
      return
    }
    if (selected.length >= 3) {
      showToast('비교는 최대 3벌까지 선택할 수 있어요.', 'info')
      return
    }
    setSelected([...selected, dressId])
  }

  return (
    <Page className={favorites.length > 0 ? 'page-with-bottom' : ''}>
      <TopBar title="최종 후보" subtitle={`${favorites.length}벌`} back={`/tour/${tourId}`} />
      <div className="favorites-head">
        <span className="eyebrow">MY FAVORITES</span>
        <h1>마음에 든 드레스만<br />한 번에 비교해요</h1>
        <p>2~3벌을 선택하면 특징과 메모를 나란히 볼 수 있어요.</p>
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          title="저장한 후보가 없어요"
          description="드레스 카드의 하트를 눌러 후보로 저장하세요."
          action={<Button onClick={() => navigate(`/tour/${tourId}`)}>드레스샵으로 돌아가기</Button>}
        />
      ) : (
        <>
          <div className="filter-chips" aria-label="샵별 필터">
            <button type="button" className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>전체 {favorites.length}</button>
            {data.shops.map((shop) => {
              const count = favorites.filter((dress) => dress.shopId === shop.id).length
              if (count === 0) return null
              return <button key={shop.id} type="button" className={filter === shop.id ? 'active' : ''} onClick={() => setFilter(shop.id)}>{shop.name} {count}</button>
            })}
          </div>
          <div className="selection-guide" role="status">
            <strong>{selected.length} / 3</strong>
            <span>{selected.length < 2 ? `${2 - selected.length}벌 더 선택하면 비교할 수 있어요.` : '비교할 준비가 됐어요.'}</span>
          </div>
          <div className="dress-list">
            {filtered.map((dress) => {
              const shop = data.shops.find((item) => item.id === dress.shopId)
              if (!shop) return null
              const isSelected = selected.includes(dress.id)
              return (
                <div
                  key={dress.id}
                  className="selectable-card"
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => toggleCompare(dress.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      toggleCompare(dress.id)
                    }
                  }}
                >
                  <DressCard
                    dress={dress}
                    shop={shop}
                    faceAsset={faceAsset}
                    faceConfig={data.tour.faceConfig}
                    selected={isSelected}
                    onFavorite={() => {
                      void patchDress(dress.id, { isFavorite: false })
                    }}
                  />
                </div>
              )
            })}
          </div>
          <BottomBar>
            <Button
              block
              disabled={selected.length < 2}
              onClick={() => navigate(`/tour/${tourId}/compare?dressIds=${selected.join(',')}`)}
            >
              선택한 {selected.length}벌 비교하기
            </Button>
          </BottomBar>
        </>
      )}
    </Page>
  )
}
