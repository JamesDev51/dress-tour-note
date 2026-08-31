import { useRef, useState, type DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ImportMode, ImportPreview } from '../domain/types'
import { importParsedPdf, inspectEditablePdf } from '../lib/pdf/importer'
import {
  Button,
  Card,
  ErrorState,
  Modal,
  Notice,
  Page,
  TopBar,
} from '../shared/ui'
import { formatDate } from '../shared/utils'

type ImportState = 'idle' | 'validating' | 'preview' | 'importing' | 'error'

export function ImportPage() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const runRef = useRef(0)
  const [state, setState] = useState<ImportState>('idle')
  const [fileName, setFileName] = useState('')
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [mode, setMode] = useState<ImportMode>('copy')
  const [error, setError] = useState('')

  const reset = () => {
    runRef.current += 1
    setState('idle')
    setFileName('')
    setPreview(null)
    setMode('copy')
    setError('')
    if (inputRef.current) inputRef.current.value = ''
  }

  const inspect = async (file: File) => {
    const run = ++runRef.current
    setFileName(file.name)
    setState('validating')
    setError('')
    setPreview(null)
    try {
      const result = await inspectEditablePdf(file)
      if (run !== runRef.current) return
      setPreview(result)
      setMode('copy')
      setState('preview')
    } catch (reason) {
      if (run !== runRef.current) return
      setError(reason instanceof Error ? reason.message : 'PDF를 확인하지 못했습니다.')
      setState('error')
    }
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) void inspect(file)
  }

  const importNow = async () => {
    if (!preview) return
    setState('importing')
    try {
      const id = await importParsedPdf(preview.parsed, preview.hasConflict ? mode : 'overwrite')
      navigate(`/tour/${id}`, { replace: true })
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '기록을 불러오지 못했습니다.')
      setState('error')
    }
  }

  return (
    <Page>
      <TopBar title="저장한 PDF 불러오기" back="/" />
      <div className="import-head">
        <span className="eyebrow">RESTORE</span>
        <h1>원본 PDF 하나로<br />다른 기기에서 이어서 기록해요</h1>
        <p>그드레스에서 만든 원본 PDF만 편집 가능한 상태로 복원할 수 있습니다.</p>
      </div>

      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="application/pdf,.pdf"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void inspect(file)
        }}
      />

      {state === 'idle' && (
        <div
          className="drop-zone"
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
        >
          <span className="drop-zone__icon" aria-hidden="true">PDF</span>
          <h2>저장한 원본 PDF를 선택하세요</h2>
          <p>파일 앱, 카카오톡 다운로드 폴더 등에서 선택할 수 있어요.</p>
          <Button onClick={() => inputRef.current?.click()}>PDF 선택하기</Button>
          <small>최대 50MB · 한 번에 1개</small>
        </div>
      )}

      {state === 'validating' && (
        <Card className="validation-card" role="status">
          <span className="spinner" aria-hidden="true" />
          <h2>PDF 안의 기록을 확인하고 있어요</h2>
          <p>{fileName}</p>
          <Button variant="secondary" onClick={reset}>취소</Button>
        </Card>
      )}

      {state === 'error' && (
        <ErrorState
          title="이 PDF는 불러올 수 없어요"
          message={error}
          action={<Button onClick={reset}>다른 파일 선택</Button>}
        />
      )}

      {preview && (state === 'preview' || state === 'importing') && (
        <>
          <Card className="import-preview-card">
            <span className="import-preview-card__check" aria-hidden="true">✓</span>
            <div>
              <span className="eyebrow">확인 완료</span>
              <h2>{preview.parsed.manifest.summary.title}</h2>
              <p>{formatDate(preview.parsed.manifest.summary.tourDate)}</p>
            </div>
            <dl>
              <div><dt>드레스샵</dt><dd>{preview.parsed.manifest.summary.shopCount}곳</dd></div>
              <div><dt>드레스</dt><dd>{preview.parsed.manifest.summary.dressCount}벌</dd></div>
              <div><dt>얼굴 사진</dt><dd>{preview.parsed.manifest.summary.hasFace ? '포함됨' : '없음'}</dd></div>
            </dl>
            <small>{preview.parsed.fileName}</small>
          </Card>

          {preview.hasConflict && (
            <section className="conflict-card" aria-labelledby="conflict-title">
              <h2 id="conflict-title">같은 원본에서 만든 기록이 이미 있어요</h2>
              <p>안전하게 복사본으로 가져오는 것을 권장합니다.</p>
              <label className={`radio-row ${mode === 'copy' ? 'radio-row--selected' : ''}`}>
                <input type="radio" name="mode" value="copy" checked={mode === 'copy'} onChange={() => setMode('copy')} />
                <span><strong>새 복사본으로 가져오기</strong><small>기존 기록은 그대로 두고 새 투어로 추가해요.</small></span>
              </label>
              <label className={`radio-row ${mode === 'overwrite' ? 'radio-row--selected' : ''}`}>
                <input type="radio" name="mode" value="overwrite" checked={mode === 'overwrite'} onChange={() => setMode('overwrite')} />
                <span><strong>기존 기록 덮어쓰기</strong><small>현재 기기의 같은 투어를 PDF 내용으로 교체해요.</small></span>
              </label>
            </section>
          )}

          {preview.parsed.manifest.summary.hasFace && (
            <Notice kind="warning">이 PDF에는 얼굴 사진이 들어 있습니다. 가져오면 현재 기기의 브라우저 저장소에 저장됩니다.</Notice>
          )}
          <div className="form-stack">
            <Button block loading={state === 'importing'} onClick={() => void importNow()}>
              {state === 'importing' ? '기록 저장 중…' : '이 기록 불러오기'}
            </Button>
            <Button variant="secondary" block onClick={reset} disabled={state === 'importing'}>
              다른 파일 선택
            </Button>
          </div>
        </>
      )}

      <Notice>인쇄하거나 다른 앱에서 재저장한 PDF는 내부 편집 데이터가 사라져 복원할 수 없을 수 있습니다.</Notice>
    </Page>
  )
}
