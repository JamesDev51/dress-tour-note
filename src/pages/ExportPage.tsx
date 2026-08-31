import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DressPreview } from '../components/DressPreview'
import type { ExportOptions } from '../domain/types'
import { getTourAggregate } from '../lib/db/repositories'
import { exportTourToPdf } from '../lib/pdf/exporter'
import { useDbQuery } from '../shared/hooks'
import { useToastStore } from '../shared/stores'
import {
  BottomBar,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingScreen,
  Modal,
  Notice,
  Page,
  Switch,
  TopBar,
} from '../shared/ui'
import { downloadBlob, formatDate } from '../shared/utils'

export function ExportPage() {
  const { tourId = '' } = useParams()
  const navigate = useNavigate()
  const loader = useCallback(() => getTourAggregate(tourId), [tourId])
  const { data, loading, error, reload } = useDbQuery(loader, [tourId])
  const [options, setOptions] = useState<ExportOptions>({
    includeFace: true,
    includeShopMemo: true,
    includeDressMemo: true,
    includeFavoritesSummary: true,
  })
  const [generating, setGenerating] = useState(false)
  const [completed, setCompleted] = useState<{ filename: string; blob: Blob } | null>(null)
  const showToast = useToastStore((state) => state.show)

  const faceAsset = data?.assets.find((asset) => asset.id === data.tour.faceConfig.assetId)
  useEffect(() => {
    if (!faceAsset) setOptions((current) => ({ ...current, includeFace: false }))
  }, [faceAsset])

  if (loading) return <Page><TopBar title="PDF로 정리하기" back={`/tour/${tourId}`} /><LoadingScreen /></Page>
  if (error) return <Page><TopBar title="PDF로 정리하기" back={`/tour/${tourId}`} /><ErrorState message={error.message} action={<Button onClick={reload}>다시 시도</Button>} /></Page>
  if (!data) return <Page><TopBar title="PDF로 정리하기" back="/" /><ErrorState message="투어 기록을 찾을 수 없습니다." /></Page>
  if (data.dresses.length === 0) {
    return (
      <Page>
        <TopBar title="PDF로 정리하기" back={`/tour/${tourId}`} />
        <EmptyState
          title="먼저 드레스를 기록해주세요"
          description="드레스가 한 벌 이상 있어야 PDF를 만들 수 있어요."
          action={<Button onClick={() => navigate(`/tour/${tourId}`)}>투어로 돌아가기</Button>}
        />
      </Page>
    )
  }

  const favorites = data.dresses.filter((dress) => dress.isFavorite)
  const sampleDresses = data.dresses.slice(0, 2)

  const generate = async () => {
    if (generating) return
    setGenerating(true)
    try {
      const result = await exportTourToPdf(tourId, options)
      downloadBlob(result.blob, result.filename)
      setCompleted(result)
      showToast('PDF를 만들었어요.', 'success')
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : 'PDF를 만들지 못했습니다.', 'error')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <Page className="page-with-bottom">
      <TopBar title="PDF로 정리하기" back={`/tour/${tourId}`} />
      <div className="export-head">
        <span className="eyebrow">EDITABLE PDF</span>
        <h1>사람이 보는 결과표와<br />다시 불러올 기록을 한 파일에</h1>
        <p>이 앱에서 만든 원본 PDF는 다른 기기에서도 다시 불러와 수정할 수 있어요.</p>
      </div>

      <Card className="pdf-preview-card">
        <div className="pdf-paper">
          <span className="pdf-paper__brand">그드레스</span>
          <span className="eyebrow">DRESS TOUR NOTE</span>
          <h2>{data.tour.title}</h2>
          <p>{data.tour.brideName ? `${data.tour.brideName} · ` : ''}{formatDate(data.tour.tourDate)}</p>
          <div className="pdf-paper__metrics">
            <span>샵 {data.shops.length}</span><span>드레스 {data.dresses.length}</span><span>후보 {favorites.length}</span>
          </div>
          <div className="pdf-paper__dresses">
            {sampleDresses.map((dress) => (
              <div key={dress.id}>
                <DressPreview
                  style={dress.style}
                  faceAsset={options.includeFace ? faceAsset : null}
                  faceConfig={data.tour.faceConfig}
                  compact
                />
                <small>{dress.name}</small>
              </div>
            ))}
          </div>
        </div>
        <p className="preview-caption">실제 PDF에는 샵별 드레스 이미지, 특징, 태그, 메모가 순서대로 정리됩니다.</p>
      </Card>

      <section className="settings-card" aria-labelledby="pdf-settings-title">
        <h2 id="pdf-settings-title">PDF 포함 설정</h2>
        <Switch
          checked={options.includeFace}
          onChange={(includeFace) => setOptions({ ...options, includeFace })}
          label="얼굴 사진 포함"
          description={faceAsset ? '사진과 위치 설정이 PDF 안에도 저장됩니다.' : '등록한 얼굴 사진이 없습니다.'}
          disabled={!faceAsset}
        />
        <Switch
          checked={options.includeShopMemo}
          onChange={(includeShopMemo) => setOptions({ ...options, includeShopMemo })}
          label="샵 메모 포함"
          description="피팅비, 담당자, 방문 메모를 표시해요."
        />
        <Switch
          checked={options.includeDressMemo}
          onChange={(includeDressMemo) => setOptions({ ...options, includeDressMemo })}
          label="드레스 메모 포함"
          description="빠른 인상 태그와 자유 메모를 표시해요."
        />
        <Switch
          checked={options.includeFavoritesSummary}
          onChange={(includeFavoritesSummary) => setOptions({ ...options, includeFavoritesSummary })}
          label="후보 요약 페이지"
          description={favorites.length ? `마지막에 후보 ${favorites.length}벌을 모아 보여줘요.` : '후보가 없으면 페이지가 추가되지 않아요.'}
        />
      </section>

      {options.includeFace && faceAsset && (
        <Notice kind="warning">얼굴을 포함하면 사진이 PDF 파일 안에도 저장됩니다. 공유 전에 받는 사람을 확인해주세요.</Notice>
      )}
      <Notice>
        복원은 이 앱에서 내려받은 원본 PDF에만 보장됩니다. 인쇄, 압축, 온라인 편집 후 다시 저장하면 내부 편집 데이터가 사라질 수 있어요.
      </Notice>

      <BottomBar>
        <Button block loading={generating} onClick={() => void generate()}>
          {generating ? 'PDF 만드는 중…' : 'PDF 만들고 저장하기'}
        </Button>
      </BottomBar>

      <Modal
        open={Boolean(completed)}
        title="PDF를 저장했어요"
        description={completed?.filename}
        onClose={() => setCompleted(null)}
      >
        <div className="success-illustration" aria-hidden="true">✓</div>
        <Notice kind="success">이 원본 PDF를 보관하면 다른 기기에서 기록 전체를 다시 불러올 수 있어요.</Notice>
        <Notice kind="warning">PDF를 인쇄하거나 다른 앱에서 재저장하지 말고, 방금 받은 원본 파일을 보관해주세요.</Notice>
        <div className="form-stack">
          <Button
            variant="secondary"
            block
            onClick={() => {
              if (completed) downloadBlob(completed.blob, completed.filename)
            }}
          >
            다시 저장하기
          </Button>
          <Button block onClick={() => navigate(`/tour/${tourId}`)}>
            투어로 돌아가기
          </Button>
        </div>
      </Modal>
    </Page>
  )
}
