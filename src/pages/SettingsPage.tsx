import { useCallback, useEffect, useState } from 'react'
import { APP_VERSION, SCHEMA_VERSION } from '../domain/types'
import { clearAllData, getStorageStats } from '../lib/db/repositories'
import { useDbQuery } from '../shared/hooks'
import { useToastStore } from '../shared/stores'
import {
  Button,
  Card,
  ConfirmModal,
  ErrorState,
  LoadingScreen,
  Notice,
  Page,
  TopBar,
} from '../shared/ui'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

export function SettingsPage() {
  const loader = useCallback(() => getStorageStats(), [])
  const { data, loading, error, reload } = useDbQuery(loader, [])
  const [clearOpen, setClearOpen] = useState(false)
  const [persisted, setPersisted] = useState<boolean | null>(null)
  const showToast = useToastStore((state) => state.show)

  useEffect(() => {
    if (!navigator.storage?.persisted) return
    void navigator.storage.persisted().then(setPersisted).catch(() => setPersisted(null))
  }, [])

  return (
    <Page>
      <TopBar title="설정" back="/" />
      <div className="settings-head">
        <span className="eyebrow">PRIVACY FIRST</span>
        <h1>기록은 오직<br />이 기기 안에만</h1>
        <p>계정, 서버, 분석용 업로드 없이 브라우저 저장소에서만 동작합니다.</p>
      </div>

      <Notice>
        기록과 얼굴 사진은 서버로 전송되지 않습니다. 다만 브라우저 데이터 삭제, 시크릿 모드, 앱 삭제 시 사라질 수 있으므로 투어가 끝나면 원본 PDF를 보관하세요.
      </Notice>

      <section className="settings-card" aria-labelledby="storage-title">
        <h2 id="storage-title">현재 기기 저장 현황</h2>
        {loading && <LoadingScreen label="저장 현황을 확인하는 중…" />}
        {error && <ErrorState message={error.message} action={<Button onClick={reload}>다시 확인</Button>} />}
        {data && (
          <dl className="stats-list">
            <div><dt>투어 기록</dt><dd>{data.tourCount}개</dd></div>
            <div><dt>드레스샵</dt><dd>{data.shopCount}곳</dd></div>
            <div><dt>드레스</dt><dd>{data.dressCount}벌</dd></div>
            <div><dt>사진 용량</dt><dd>{formatBytes(data.assetBytes)}</dd></div>
          </dl>
        )}
      </section>

      <section className="settings-card" aria-labelledby="protect-title">
        <h2 id="protect-title">브라우저 저장 보호</h2>
        <p>지원되는 브라우저에서는 저장 공간이 자동 정리되지 않도록 보호를 요청할 수 있어요.</p>
        <div className="persistence-status">
          <span className={persisted ? 'status-dot status-dot--success' : 'status-dot'} />
          <strong>{persisted === true ? '보호 요청이 적용됨' : persisted === false ? '보호 요청이 적용되지 않음' : '지원 여부 확인 불가'}</strong>
        </div>
        {persisted === false && navigator.storage?.persist && (
          <Button
            variant="secondary"
            block
            onClick={() => {
              void navigator.storage.persist().then((result) => {
                setPersisted(result)
                showToast(result ? '브라우저 저장 보호를 요청했어요.' : '브라우저가 보호 요청을 허용하지 않았어요.', result ? 'success' : 'info')
              })
            }}
          >
            저장 보호 요청
          </Button>
        )}
      </section>

      <Card className="privacy-card">
        <h2>얼굴 사진 안내</h2>
        <p>사진은 현재 브라우저의 IndexedDB에 Blob으로 저장됩니다. PDF 포함을 켜면 사용자가 내려받는 PDF 안에도 사진이 첨부됩니다.</p>
        <p>그드레스는 얼굴을 분석하거나 체형을 생성하지 않습니다. 단순히 같은 사진을 스케치의 머리 위치에 배치합니다.</p>
      </Card>

      <section className="settings-card" aria-labelledby="data-title">
        <h2 id="data-title">데이터 관리</h2>
        <p>전체 삭제는 이 기기에 저장된 모든 투어, 드레스, 얼굴 사진을 영구적으로 지웁니다.</p>
        <Button variant="danger" block onClick={() => setClearOpen(true)}>
          이 기기의 전체 기록 삭제
        </Button>
      </section>

      <footer className="app-info">
        <strong>그드레스 {APP_VERSION}</strong>
        <span>데이터 스키마 v{SCHEMA_VERSION}</span>
        <span>서버 없음 · 로그인 없음 · 현재 기기 저장</span>
      </footer>

      <ConfirmModal
        open={clearOpen}
        title="전체 기록을 삭제할까요?"
        description="모든 투어, 드레스, 얼굴 사진이 즉시 삭제되며 이 작업은 실행 취소할 수 없습니다."
        confirmLabel="전체 삭제"
        onClose={() => setClearOpen(false)}
        onConfirm={async () => {
          await clearAllData()
          showToast('이 기기의 모든 기록을 삭제했어요.', 'success')
        }}
      />
    </Page>
  )
}
