import { useCallback, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DressCard } from '../components/DressPreview'
import { ShopFormModal, type ShopFormValue } from '../components/ShopFormModal'
import {
  createDress,
  deleteDress,
  deleteShop,
  duplicateDress,
  getTourAggregate,
  moveDress,
  patchDress,
  patchShop,
  restoreDress,
  restoreShop,
} from '../lib/db/repositories'
import { useDbQuery } from '../shared/hooks'
import { useToastStore, useUndoStore } from '../shared/stores'
import {
  BottomBar,
  Button,
  ConfirmModal,
  EmptyState,
  ErrorState,
  LoadingScreen,
  Page,
  TopBar,
} from '../shared/ui'

export function ShopPage() {
  const { tourId = '', shopId = '' } = useParams()
  const navigate = useNavigate()
  const loader = useCallback(() => getTourAggregate(tourId), [tourId])
  const { data, loading, error, reload } = useDbQuery(loader, [tourId, shopId])
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const offerUndo = useUndoStore((state) => state.offer)
  const showToast = useToastStore((state) => state.show)

  if (loading) return <Page><TopBar title="드레스샵" back={`/tour/${tourId}`} /><LoadingScreen /></Page>
  if (error) return <Page><TopBar title="드레스샵" back={`/tour/${tourId}`} /><ErrorState message={error.message} action={<Button onClick={reload}>다시 시도</Button>} /></Page>
  if (!data) return <Page><TopBar title="드레스샵" back="/" /><ErrorState message="투어 기록을 찾을 수 없습니다." /></Page>

  const shop = data.shops.find((item) => item.id === shopId)
  if (!shop) return <Page><TopBar title="드레스샵" back={`/tour/${tourId}`} /><ErrorState message="드레스샵을 찾을 수 없습니다." /></Page>

  const dresses = data.dresses.filter((dress) => dress.shopId === shopId).sort((a, b) => a.order - b.order)
  const faceAsset = data.assets.find((asset) => asset.id === data.tour.faceConfig.assetId)

  const addDress = async () => {
    if (adding) return
    setAdding(true)
    try {
      const dress = await createDress(tourId, shopId)
      navigate(`/tour/${tourId}/shop/${shopId}/dress/${dress.id}/edit`)
    } finally {
      setAdding(false)
    }
  }

  const updateShop = async (value: ShopFormValue) => {
    await patchShop(shop.id, value)
    showToast('샵 정보를 수정했어요.', 'success')
  }

  return (
    <Page className="page-with-bottom">
      <TopBar
        title={shop.name}
        subtitle={`${data.shops.findIndex((item) => item.id === shop.id) + 1}번째 샵`}
        back={`/tour/${tourId}`}
        right={<button className="icon-button" type="button" onClick={() => setEditOpen(true)} aria-label="샵 수정">✎</button>}
      />

      <div className="shop-detail-head">
        <span className="eyebrow">DRESS SHOP</span>
        <h1>{shop.name}</h1>
        <p>{shop.appointmentTime ? `${shop.appointmentTime} 방문 · ` : ''}드레스 {dresses.length}벌</p>
        {shop.memo && <div className="shop-note">{shop.memo}</div>}
      </div>

      <section className="section-block" aria-labelledby="dress-list-title">
        <div className="section-heading">
          <div><span className="eyebrow">DRESS LIST</span><h2 id="dress-list-title">입어본 드레스</h2></div>
          <span>{dresses.length}벌</span>
        </div>

        {dresses.length === 0 ? (
          <EmptyState
            title="입어본 첫 드레스를 기록해요"
            description="정확한 이름을 몰라도 괜찮아요. 보이는 모양만 차례대로 고르면 됩니다."
            action={<Button onClick={() => void addDress()}>드레스 추가</Button>}
          />
        ) : (
          <div className="dress-list">
            {dresses.map((dress, index) => (
              <DressCard
                key={dress.id}
                dress={dress}
                shop={shop}
                faceAsset={faceAsset}
                faceConfig={data.tour.faceConfig}
                to={`/tour/${tourId}/shop/${shopId}/dress/${dress.id}/edit`}
                onFavorite={() => void patchDress(dress.id, { isFavorite: !dress.isFavorite })}
                actions={
                  <div className="inline-actions inline-actions--wide">
                    <button type="button" disabled={index === 0} onClick={() => void moveDress(shopId, dress.id, -1)} aria-label="앞 드레스로 이동">↑</button>
                    <button type="button" disabled={index === dresses.length - 1} onClick={() => void moveDress(shopId, dress.id, 1)} aria-label="뒤 드레스로 이동">↓</button>
                    <button
                      type="button"
                      onClick={async () => {
                        const clone = await duplicateDress(dress.id)
                        if (clone) {
                          showToast('스타일을 복제했어요. 메모는 비워두었습니다.', 'success')
                          navigate(`/tour/${tourId}/shop/${shopId}/dress/${clone.id}/edit`)
                        }
                      }}
                    >복제</button>
                    <button
                      type="button"
                      className="danger"
                      onClick={async () => {
                        const snapshot = await deleteDress(dress.id)
                        if (snapshot) offerUndo(`${dress.name}을 삭제했어요.`, () => restoreDress(snapshot))
                      }}
                    >삭제</button>
                  </div>
                }
              />
            ))}
          </div>
        )}
      </section>

      <button className="danger-zone-link" type="button" onClick={() => setDeleteOpen(true)}>
        이 드레스샵 삭제
      </button>

      <BottomBar>
        <Button block loading={adding} onClick={() => void addDress()}>
          입어본 드레스 추가
        </Button>
      </BottomBar>

      <ShopFormModal open={editOpen} shop={shop} onClose={() => setEditOpen(false)} onSubmit={updateShop} />
      <ConfirmModal
        open={deleteOpen}
        title="이 드레스샵을 삭제할까요?"
        description={`${shop.name}의 드레스 ${dresses.length}벌도 함께 삭제됩니다.`}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          const snapshot = await deleteShop(shop.id)
          if (!snapshot) return
          navigate(`/tour/${tourId}`, { replace: true })
          offerUndo(`${shop.name}을 삭제했어요.`, () => restoreShop(snapshot))
        }}
      />
    </Page>
  )
}
