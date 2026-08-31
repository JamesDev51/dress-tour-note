import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ShopFormModal, type ShopFormValue } from '../components/ShopFormModal'
import {
  createShop,
  deleteShop,
  deleteTour,
  getTourAggregate,
  moveShop,
  restoreShop,
  restoreTour,
  setSetting,
} from '../lib/db/repositories'
import { useDbQuery } from '../shared/hooks'
import { useToastStore, useUndoStore } from '../shared/stores'
import {
  BottomBar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LinkButton,
  LoadingScreen,
  Modal,
  Page,
  TopBar,
} from '../shared/ui'
import { formatDate } from '../shared/utils'

function DeleteTourModal({
  open,
  title,
  onClose,
  onConfirm,
}: {
  open: boolean
  title: string
  onClose: () => void
  onConfirm: () => Promise<void>
}) {
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  useEffect(() => {
    if (open) setValue('')
  }, [open])
  return (
    <Modal
      open={open}
      title="투어 기록 전체 삭제"
      description="샵, 드레스, 얼굴 사진이 모두 삭제됩니다. 실행 취소는 5초 동안 가능해요."
      onClose={onClose}
    >
      <label className="field">
        <span className="field__label">확인을 위해 투어명을 입력해주세요</span>
        <input
          className="input"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={title}
          autoComplete="off"
        />
      </label>
      <div className="modal-actions">
        <Button variant="secondary" block onClick={onClose}>
          취소
        </Button>
        <Button
          variant="danger"
          block
          disabled={value !== title}
          loading={submitting}
          onClick={() => {
            setSubmitting(true)
            void onConfirm().finally(() => setSubmitting(false))
          }}
        >
          전체 삭제
        </Button>
      </div>
    </Modal>
  )
}

export function TourPage() {
  const { tourId = '' } = useParams()
  const navigate = useNavigate()
  const loader = useCallback(() => getTourAggregate(tourId), [tourId])
  const { data, loading, error, reload } = useDbQuery(loader, [tourId])
  const [shopModalOpen, setShopModalOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [addingShop, setAddingShop] = useState(false)
  const offerUndo = useUndoStore((state) => state.offer)
  const showToast = useToastStore((state) => state.show)

  useEffect(() => {
    if (!tourId) return
    void setSetting('lastOpenedTourId', tourId)
  }, [tourId])

  if (loading) return <Page><TopBar title="투어" back="/" /><LoadingScreen /></Page>
  if (error) return <Page><TopBar title="투어" back="/" /><ErrorState message={error.message} action={<Button onClick={reload}>다시 시도</Button>} /></Page>
  if (!data) return <Page><TopBar title="투어" back="/" /><ErrorState message="투어 기록을 찾을 수 없습니다." action={<LinkButton to="/">홈으로</LinkButton>} /></Page>

  const { tour, shops, dresses } = data
  const favoriteCount = dresses.filter((dress) => dress.isFavorite).length
  const faceAsset = data.assets.find((asset) => asset.id === tour.faceConfig.assetId)

  const addShop = async (value: ShopFormValue) => {
    setAddingShop(true)
    try {
      const shop = await createShop({ tourId, ...value })
      navigate(`/tour/${tourId}/shop/${shop.id}`)
    } finally {
      setAddingShop(false)
    }
  }

  return (
    <Page className="page-with-bottom">
      <TopBar
        title={tour.title}
        subtitle={formatDate(tour.tourDate)}
        back="/"
        right={
          <Link className="icon-button" to={`/tour/${tourId}/edit`} aria-label="투어 정보 수정">
            ✎
          </Link>
        }
      />

      <div className="dashboard-head">
        <div>
          <span className="eyebrow">DRESS TOUR</span>
          <h1>{tour.title}</h1>
          <p>{tour.brideName ? `${tour.brideName} · ` : ''}{formatDate(tour.tourDate)}</p>
        </div>
        <div className="metrics-grid" aria-label="투어 요약">
          <div><strong>{shops.length}</strong><span>드레스샵</span></div>
          <div><strong>{dresses.length}</strong><span>드레스</span></div>
          <div><strong>{favoriteCount}</strong><span>최종 후보</span></div>
        </div>
      </div>

      {tour.memo && <Card className="memo-card"><span className="eyebrow">TOUR MEMO</span><p>{tour.memo}</p></Card>}

      <div className="shortcut-grid">
        <Link className="shortcut-card" to={`/tour/${tourId}/favorites`}>
          <span aria-hidden="true">♥</span>
          <div><strong>후보 모아보기</strong><small>{favoriteCount ? `${favoriteCount}벌 저장됨` : '마음에 든 드레스를 저장해요'}</small></div>
          <b aria-hidden="true">›</b>
        </Link>
        <Link className="shortcut-card" to={`/tour/${tourId}/face`}>
          <span aria-hidden="true">☺</span>
          <div><strong>내 얼굴로 느낌 보기</strong><small>{faceAsset ? '사진 설정됨' : '선택 사항'}</small></div>
          <b aria-hidden="true">›</b>
        </Link>
        <Link
          className={`shortcut-card ${dresses.length === 0 ? 'shortcut-card--disabled' : ''}`}
          to={dresses.length > 0 ? `/tour/${tourId}/export` : '#'}
          onClick={(event) => {
            if (dresses.length === 0) {
              event.preventDefault()
              showToast('드레스를 한 벌 이상 기록한 뒤 PDF로 정리할 수 있어요.', 'info')
            }
          }}
        >
          <span aria-hidden="true">⇩</span>
          <div><strong>PDF로 정리하기</strong><small>다른 기기에서 다시 불러올 수 있어요</small></div>
          <b aria-hidden="true">›</b>
        </Link>
      </div>

      <section className="section-block" aria-labelledby="shops-title">
        <div className="section-heading">
          <div><span className="eyebrow">SHOP LIST</span><h2 id="shops-title">드레스샵</h2></div>
          <button className="text-button" type="button" onClick={() => setShopModalOpen(true)}>+ 추가</button>
        </div>

        {shops.length === 0 ? (
          <EmptyState
            title="첫 드레스샵을 추가해요"
            description="샵 이름을 적고, 그곳에서 입어본 드레스를 차례대로 기록하세요."
            action={<Button onClick={() => setShopModalOpen(true)}>드레스샵 추가</Button>}
          />
        ) : (
          <div className="shop-list">
            {shops.map((shop, index) => {
              const shopDresses = dresses.filter((dress) => dress.shopId === shop.id)
              const favorites = shopDresses.filter((dress) => dress.isFavorite).length
              return (
                <Card className="shop-card" key={shop.id}>
                  <Link className="shop-card__main" to={`/tour/${tourId}/shop/${shop.id}`}>
                    <span className="shop-card__order">{index + 1}</span>
                    <div>
                      <h3>{shop.name}</h3>
                      <p>{shop.appointmentTime ? `${shop.appointmentTime} · ` : ''}드레스 {shopDresses.length}벌{favorites ? ` · 후보 ${favorites}벌` : ''}</p>
                      {shop.memo && <small>{shop.memo}</small>}
                    </div>
                    <span aria-hidden="true">›</span>
                  </Link>
                  <div className="inline-actions" aria-label={`${shop.name} 순서 및 삭제`}>
                    <button type="button" disabled={index === 0} onClick={() => void moveShop(tourId, shop.id, -1)} aria-label="앞으로 이동">↑</button>
                    <button type="button" disabled={index === shops.length - 1} onClick={() => void moveShop(tourId, shop.id, 1)} aria-label="뒤로 이동">↓</button>
                    <button
                      type="button"
                      className="danger"
                      onClick={async () => {
                        const snapshot = await deleteShop(shop.id)
                        if (snapshot) offerUndo(`${shop.name}을 삭제했어요.`, () => restoreShop(snapshot))
                      }}
                    >삭제</button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </section>

      <button className="danger-zone-link" type="button" onClick={() => setDeleteOpen(true)}>
        투어 기록 전체 삭제
      </button>

      <BottomBar>
        <Button block loading={addingShop} onClick={() => setShopModalOpen(true)}>
          드레스샵 추가
        </Button>
      </BottomBar>

      <ShopFormModal open={shopModalOpen} onClose={() => setShopModalOpen(false)} onSubmit={addShop} />
      <DeleteTourModal
        open={deleteOpen}
        title={tour.title}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          const snapshot = await deleteTour(tourId)
          if (!snapshot) return
          setDeleteOpen(false)
          navigate('/', { replace: true })
          offerUndo('투어 기록을 삭제했어요.', () => restoreTour(snapshot))
        }}
      />
    </Page>
  )
}
