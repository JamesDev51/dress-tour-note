import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { DressPreview } from '../components/DressPreview'
import { defaultFaceTransform } from '../domain/options'
import type { FaceTransform } from '../domain/types'
import { flushPendingSaves, queueTourPatch } from '../lib/autosave/saveQueue'
import { deleteFaceAsset, getTourAggregate, putFaceAsset } from '../lib/db/repositories'
import { processFaceImage } from '../lib/image/processImage'
import { useDbQuery } from '../shared/hooks'
import { useToastStore } from '../shared/stores'
import {
  BottomBar,
  Button,
  ConfirmModal,
  ErrorState,
  LoadingScreen,
  Notice,
  Page,
  Switch,
  TopBar,
} from '../shared/ui'
import { clamp } from '../shared/utils'

interface Point {
  x: number
  y: number
}

interface GestureState {
  pointers: Map<number, Point>
  startTransform: FaceTransform
  startPoint?: Point
  startCenter?: Point
  startDistance?: number
}

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

function center(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
}

export function FaceEditorPage() {
  const { tourId = '' } = useParams()
  const navigate = useNavigate()
  const loader = useCallback(() => getTourAggregate(tourId), [tourId])
  const { data, loading, error, reload } = useDbQuery(loader, [tourId])
  const [transform, setTransform] = useState<FaceTransform>({ ...defaultFaceTransform })
  const [processing, setProcessing] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const gestureRef = useRef<GestureState | null>(null)
  const showToast = useToastStore((state) => state.show)

  useEffect(() => {
    if (data?.tour.faceConfig) setTransform({ ...data.tour.faceConfig })
  }, [data?.tour.faceConfig])

  const faceAsset = data?.assets.find((asset) => asset.id === transform.assetId)
  const previewDress = data?.dresses[0]

  const updateTransform = useCallback(
    (next: FaceTransform, delay = 0) => {
      setTransform(next)
      queueTourPatch(tourId, { faceConfig: next }, delay)
    },
    [tourId],
  )

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!faceAsset) return
    event.currentTarget.setPointerCapture(event.pointerId)
    const rect = event.currentTarget.getBoundingClientRect()
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top }
    const current = gestureRef.current ?? {
      pointers: new Map<number, Point>(),
      startTransform: { ...transform },
    }
    current.pointers.set(event.pointerId, point)
    current.startTransform = { ...transform }
    const points = [...current.pointers.values()]
    if (points.length === 1) current.startPoint = points[0]
    if (points.length >= 2) {
      current.startDistance = distance(points[0]!, points[1]!)
      current.startCenter = center(points[0]!, points[1]!)
    }
    gestureRef.current = current
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current
    if (!gesture?.pointers.has(event.pointerId) || !stageRef.current) return
    const rect = stageRef.current.getBoundingClientRect()
    gesture.pointers.set(event.pointerId, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    })
    const points = [...gesture.pointers.values()]
    let next = { ...gesture.startTransform }
    if (points.length === 1 && gesture.startPoint) {
      const current = points[0]!
      next.x = clamp(gesture.startTransform.x + ((current.x - gesture.startPoint.x) / rect.width) * 2.4, -1.4, 1.4)
      next.y = clamp(gesture.startTransform.y + ((current.y - gesture.startPoint.y) / rect.height) * 3.2, -1.4, 1.4)
    } else if (points.length >= 2 && gesture.startDistance && gesture.startCenter) {
      const currentDistance = distance(points[0]!, points[1]!)
      const currentCenter = center(points[0]!, points[1]!)
      next.scale = clamp(gesture.startTransform.scale * (currentDistance / gesture.startDistance), 0.5, 3)
      next.x = clamp(gesture.startTransform.x + ((currentCenter.x - gesture.startCenter.x) / rect.width) * 2.4, -1.4, 1.4)
      next.y = clamp(gesture.startTransform.y + ((currentCenter.y - gesture.startCenter.y) / rect.height) * 3.2, -1.4, 1.4)
    }
    updateTransform(next, 100)
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const gesture = gestureRef.current
    if (!gesture) return
    gesture.pointers.delete(event.pointerId)
    if (gesture.pointers.size === 0) {
      gestureRef.current = null
      void flushPendingSaves(tourId)
      return
    }
    gesture.startTransform = { ...transform }
    const points = [...gesture.pointers.values()]
    gesture.startPoint = points[0]
    if (points.length >= 2) {
      gesture.startDistance = distance(points[0]!, points[1]!)
      gesture.startCenter = center(points[0]!, points[1]!)
    }
  }

  if (loading) return <Page><TopBar title="내 얼굴로 느낌 보기" back={`/tour/${tourId}`} /><LoadingScreen /></Page>
  if (error) return <Page><TopBar title="내 얼굴로 느낌 보기" back={`/tour/${tourId}`} /><ErrorState message={error.message} action={<Button onClick={reload}>다시 시도</Button>} /></Page>
  if (!data) return <Page><TopBar title="내 얼굴로 느낌 보기" back="/" /><ErrorState message="투어 기록을 찾을 수 없습니다." /></Page>

  return (
    <Page className="page-with-bottom">
      <TopBar title="내 얼굴로 느낌 보기" back={`/tour/${tourId}`} />
      <div className="face-intro">
        <span className="eyebrow">OPTIONAL</span>
        <h1>사진 한 장으로<br />전체 분위기만 확인해요</h1>
        <p>실제 체형이나 착용감을 예측하는 가상피팅이 아닌, 얼굴을 스케치 위에 얹는 단순 미리보기입니다.</p>
      </div>

      <section className="face-stage-section">
        <div
          ref={stageRef}
          className={`face-stage ${faceAsset ? 'face-stage--interactive' : ''}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          aria-label={faceAsset ? '드래그해 얼굴 위치를 옮기고 두 손가락으로 확대할 수 있습니다.' : '기본 드레스 미리보기'}
        >
          <DressPreview
            style={previewDress?.style ?? data.dresses[0]?.style ?? {
              upperStyle: 'offShoulder', neckline: 'sweetheart', waistline: 'natural', silhouette: 'aLine', primaryFabric: 'mikadoSilk', details: [], trainLength: 'medium', backStyle: 'unknown', colorTone: 'ivory',
            }}
            faceAsset={faceAsset}
            faceConfig={transform}
            title="얼굴 위치 미리보기"
          />
          {faceAsset && <span className="gesture-hint">한 손가락 이동 · 두 손가락 확대</span>}
        </div>
      </section>

      <section className="face-controls">
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
          onChange={(event) => {
            const file = event.target.files?.[0]
            event.target.value = ''
            if (!file) return
            setProcessing(true)
            void processFaceImage(file)
              .then(async (processed) => {
                const asset = await putFaceAsset(tourId, processed)
                const next = { ...defaultFaceTransform, assetId: asset.id }
                setTransform(next)
                showToast('사진을 현재 기기에 저장했어요.', 'success')
              })
              .catch((reason: unknown) => {
                showToast(reason instanceof Error ? reason.message : '사진을 처리하지 못했습니다.', 'error')
              })
              .finally(() => setProcessing(false))
          }}
        />
        <Button block variant={faceAsset ? 'secondary' : 'primary'} loading={processing} onClick={() => inputRef.current?.click()}>
          {faceAsset ? '다른 사진 선택' : '얼굴 사진 선택'}
        </Button>

        {faceAsset && (
          <>
            <div className="slider-group">
              <label>
                <span><strong>확대</strong><output>{transform.scale.toFixed(1)}배</output></span>
                <input type="range" min="0.5" max="3" step="0.05" value={transform.scale} onChange={(event) => updateTransform({ ...transform, scale: Number(event.target.value) }, 80)} onPointerUp={() => void flushPendingSaves(tourId)} />
              </label>
              <label>
                <span><strong>좌우 위치</strong><output>{Math.round(transform.x * 100)}</output></span>
                <input type="range" min="-1.4" max="1.4" step="0.02" value={transform.x} onChange={(event) => updateTransform({ ...transform, x: Number(event.target.value) }, 80)} onPointerUp={() => void flushPendingSaves(tourId)} />
              </label>
              <label>
                <span><strong>위아래 위치</strong><output>{Math.round(transform.y * 100)}</output></span>
                <input type="range" min="-1.4" max="1.4" step="0.02" value={transform.y} onChange={(event) => updateTransform({ ...transform, y: Number(event.target.value) }, 80)} onPointerUp={() => void flushPendingSaves(tourId)} />
              </label>
              <label>
                <span><strong>회전</strong><output>{Math.round(transform.rotation)}°</output></span>
                <input type="range" min="-15" max="15" step="1" value={transform.rotation} onChange={(event) => updateTransform({ ...transform, rotation: Number(event.target.value) }, 80)} onPointerUp={() => void flushPendingSaves(tourId)} />
              </label>
            </div>
            <Button
              variant="ghost"
              block
              onClick={() => updateTransform({ ...defaultFaceTransform, assetId: faceAsset.id })}
            >
              위치 초기화
            </Button>
            <div className="switch-stack">
              <Switch
                checked={transform.visibleInPreview}
                onChange={(checked) => updateTransform({ ...transform, visibleInPreview: checked })}
                label="화면 미리보기에 표시"
                description="끄면 기본 마네킹 얼굴로 보여요."
              />
              <Switch
                checked={transform.includeInPdf}
                onChange={(checked) => updateTransform({ ...transform, includeInPdf: checked })}
                label="PDF에 얼굴 사진 포함"
                description="포함하면 사진이 PDF 파일 안에도 저장됩니다."
              />
            </div>
            {transform.includeInPdf && <Notice kind="warning">PDF를 다른 사람에게 공유하면 얼굴 사진도 함께 전달됩니다. 내보내기 전에 다시 확인해주세요.</Notice>}
            <button className="danger-zone-link" type="button" onClick={() => setDeleteOpen(true)}>얼굴 사진 삭제</button>
          </>
        )}
      </section>

      <Notice>얼굴 사진과 위치 정보는 서버로 전송되지 않습니다. 공용 기기라면 사용 후 설정에서 전체 기록을 삭제해주세요.</Notice>

      <BottomBar>
        <Button block onClick={async () => { await flushPendingSaves(tourId); navigate(`/tour/${tourId}`) }}>
          설정 완료
        </Button>
      </BottomBar>

      <ConfirmModal
        open={deleteOpen}
        title="얼굴 사진을 삭제할까요?"
        description="현재 기기의 사진 Blob과 위치 설정이 모두 삭제됩니다."
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          await deleteFaceAsset(tourId)
          setTransform({ ...defaultFaceTransform })
          showToast('얼굴 사진을 삭제했어요.', 'success')
        }}
      />
    </Page>
  )
}
