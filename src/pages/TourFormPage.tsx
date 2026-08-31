import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createTour, getTour, patchTour } from '../lib/db/repositories'
import { useDbQuery } from '../shared/hooks'
import {
  BottomBar,
  Button,
  ErrorState,
  Field,
  LoadingScreen,
  Page,
  TextArea,
  TopBar,
} from '../shared/ui'
import { countCharacters, formatDate, todayLocal } from '../shared/utils'

function autoTitle(date: string): string {
  return `${formatDate(date)} 드레스투어`
}

export function TourFormPage() {
  const { tourId } = useParams()
  const editing = Boolean(tourId)
  const navigate = useNavigate()
  const loader = useCallback(async () => (tourId ? (await getTour(tourId)) ?? null : null), [tourId])
  const query = useDbQuery(loader, [tourId])
  const [title, setTitle] = useState('')
  const [brideName, setBrideName] = useState('')
  const [tourDate, setTourDate] = useState(todayLocal())
  const [memo, setMemo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [dateError, setDateError] = useState('')

  useEffect(() => {
    if (!query.data) return
    setTitle(query.data.title)
    setBrideName(query.data.brideName)
    setTourDate(query.data.tourDate)
    setMemo(query.data.memo)
  }, [query.data])

  if (editing && query.loading) return <Page><TopBar title="투어 수정" back /><LoadingScreen /></Page>
  if (editing && query.error) return <Page><TopBar title="투어 수정" back /><ErrorState message={query.error.message} /></Page>
  if (editing && !query.loading && !query.data) {
    return <Page><TopBar title="투어 수정" back="/" /><ErrorState message="투어 기록을 찾을 수 없습니다." /></Page>
  }

  const submit = async () => {
    if (!tourDate) {
      setDateError('투어 날짜를 선택해주세요.')
      return
    }
    setSubmitting(true)
    try {
      const value = {
        title: title.trim() || autoTitle(tourDate),
        brideName: brideName.trim(),
        tourDate,
        memo: memo.trim(),
      }
      if (tourId) {
        await patchTour(tourId, value)
        navigate(`/tour/${tourId}`, { replace: true })
      } else {
        const tour = await createTour(value)
        navigate(`/tour/${tour.id}`, { replace: true })
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Page className="page-with-bottom">
      <TopBar title={editing ? '투어 수정' : '새 드레스투어'} back />
      <form
        className="form-page form-stack"
        onSubmit={(event) => {
          event.preventDefault()
          void submit()
        }}
      >
        <div className="intro-copy">
          <span className="eyebrow">DRESS TOUR NOTE</span>
          <h1>{editing ? '투어 정보를 수정해요' : '오늘의 드레스투어를 시작해요'}</h1>
          <p>투어명과 신부명은 선택이에요. 날짜만 정하면 바로 기록할 수 있어요.</p>
        </div>
        <Field
          label="투어명"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={40}
          counter={`${countCharacters(title)}/40`}
          placeholder={`${formatDate(tourDate)} 드레스투어`}
        />
        <Field
          label="신부명"
          value={brideName}
          onChange={(event) => setBrideName(event.target.value)}
          maxLength={30}
          counter={`${countCharacters(brideName)}/30`}
          hint="PDF 표지에만 표시됩니다."
          placeholder="예: 히똥"
        />
        <Field
          label="투어 날짜"
          type="date"
          value={tourDate}
          onChange={(event) => {
            setTourDate(event.target.value)
            setDateError('')
          }}
          error={dateError}
          required
        />
        <TextArea
          label="전체 메모"
          value={memo}
          onChange={(event) => setMemo(event.target.value)}
          maxLength={500}
          counter={`${countCharacters(memo)}/500`}
          rows={5}
          placeholder="준비물, 일정, 전체 인상 등을 적어두세요."
        />
      </form>
      <BottomBar>
        <Button type="button" block loading={submitting} onClick={() => void submit()}>
          {editing ? '수정 완료' : '기록 시작하기'}
        </Button>
      </BottomBar>
    </Page>
  )
}
