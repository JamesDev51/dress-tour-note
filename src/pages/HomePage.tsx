import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { deleteTour, listTourSummaries, restoreTour } from '../lib/db/repositories'
import { useDbQuery } from '../shared/hooks'
import {
  Button,
  Card,
  ConfirmModal,
  EmptyState,
  ErrorState,
  LinkButton,
  LoadingScreen,
  Page,
  TopBar,
} from '../shared/ui'
import { useUndoStore } from '../shared/stores'
import { formatDate, formatRelativeTime } from '../shared/utils'

export function HomePage() {
  const loader = useCallback(() => listTourSummaries(), [])
  const { data, loading, error, reload } = useDbQuery(loader, [])
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const summaries = data ?? []
  const deleteTarget = summaries.find((summary) => summary.tour.id === deleteId)
  const offerUndo = useUndoStore((state) => state.offer)

  return (
    <Page className="home-page">
      <TopBar
        right={
          <Link className="icon-button" to="/settings" aria-label="설정">
            ⚙
          </Link>
        }
      />

      <section className="hero">
        <span className="hero__badge">사진 못 찍는 드레스투어를 위한 기록장</span>
        <h1>
          그림 대신 고르면,
          <br />그 드레스를 기억해요.
        </h1>
        <p>샵과 드레스 특징을 빠르게 기록하고, 투어가 끝나면 PDF 한 장으로 정리하세요.</p>
        <div className="hero__actions">
          <LinkButton to="/tour/new" block>
            새 드레스투어 기록
          </LinkButton>
          <LinkButton to="/import" variant="secondary" block>
            저장한 PDF 불러오기
          </LinkButton>
        </div>
        <p className="privacy-inline">
          🔒 입력한 기록과 얼굴 사진은 서버로 전송되지 않고 현재 기기에서만 처리됩니다.
        </p>
      </section>

      <section className="section-block" aria-labelledby="recent-title">
        <div className="section-heading">
          <div>
            <span className="eyebrow">MY TOUR</span>
            <h2 id="recent-title">최근 기록</h2>
          </div>
          {summaries.length > 3 && <span>{summaries.length}개</span>}
        </div>

        {loading && <LoadingScreen />}
        {error && <ErrorState message={error.message} action={<Button onClick={reload}>다시 시도</Button>} />}
        {!loading && !error && summaries.length === 0 && (
          <EmptyState
            title="아직 기록이 없어요"
            description="샵 추가 → 드레스 모양 선택 → PDF 저장, 세 단계면 끝나요."
            action={<LinkButton to="/tour/new">첫 기록 시작하기</LinkButton>}
          />
        )}
        {!loading && !error && summaries.length > 0 && (
          <div className="tour-list">
            {summaries.slice(0, 3).map((summary, index) => (
              <Card className="tour-card" key={summary.tour.id}>
                <Link className="tour-card__main" to={`/tour/${summary.tour.id}`}>
                  <span className="tour-card__index">0{index + 1}</span>
                  <div>
                    <h3>{summary.tour.title}</h3>
                    <p>{formatDate(summary.tour.tourDate)}</p>
                    <div className="tour-card__metrics">
                      <span>샵 {summary.shopCount}</span>
                      <span>드레스 {summary.dressCount}</span>
                      <span>후보 {summary.favoriteCount}</span>
                    </div>
                    <small>{formatRelativeTime(summary.tour.updatedAt)} 수정</small>
                  </div>
                  <span aria-hidden="true">›</span>
                </Link>
                <button
                  className="text-button text-button--danger"
                  type="button"
                  onClick={() => setDeleteId(summary.tour.id)}
                >
                  삭제
                </button>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="how-it-works" aria-label="사용 방법">
        <span><b>1</b> 샵 추가</span>
        <span aria-hidden="true">→</span>
        <span><b>2</b> 모양 선택</span>
        <span aria-hidden="true">→</span>
        <span><b>3</b> PDF 저장</span>
      </section>

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="투어 기록을 삭제할까요?"
        description={deleteTarget ? `‘${deleteTarget.tour.title}’의 샵, 드레스, 얼굴 사진이 모두 삭제됩니다.` : ''}
        onClose={() => setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteTarget) return
          const snapshot = await deleteTour(deleteTarget.tour.id)
          if (snapshot) {
            offerUndo('투어 기록을 삭제했어요.', async () => {
              await restoreTour(snapshot)
            })
          }
        }}
      />
    </Page>
  )
}
