import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { AppError } from '../domain/types'
import { getPendingSaveCount } from '../lib/autosave/saveQueue'
import { openDatabase } from '../lib/db/repositories'
import { ComparePage } from '../pages/ComparePage'
import { DressEditorPage } from '../pages/DressEditorPage'
import { ExportPage } from '../pages/ExportPage'
import { FaceEditorPage } from '../pages/FaceEditorPage'
import { FavoritesPage } from '../pages/FavoritesPage'
import { HomePage } from '../pages/HomePage'
import { ImportPage } from '../pages/ImportPage'
import { NotFoundPage } from '../pages/NotFoundPage'
import { SettingsPage } from '../pages/SettingsPage'
import { ShopPage } from '../pages/ShopPage'
import { TourFormPage } from '../pages/TourFormPage'
import { TourPage } from '../pages/TourPage'
import { AppFrame, Button, ErrorState, LoadingScreen, Page, TopBar } from '../shared/ui'

function ScrollManager() {
  const location = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
  }, [location.pathname])
  return null
}

function AppRoutes() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tour/new" element={<TourFormPage />} />
        <Route path="/tour/:tourId/edit" element={<TourFormPage />} />
        <Route path="/tour/:tourId" element={<TourPage />} />
        <Route path="/tour/:tourId/shop/:shopId" element={<ShopPage />} />
        <Route path="/tour/:tourId/shop/:shopId/dress/:dressId/edit" element={<DressEditorPage />} />
        <Route path="/tour/:tourId/face" element={<FaceEditorPage />} />
        <Route path="/tour/:tourId/favorites" element={<FavoritesPage />} />
        <Route path="/tour/:tourId/compare" element={<ComparePage />} />
        <Route path="/tour/:tourId/export" element={<ExportPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </>
  )
}

interface BoundaryState {
  error: Error | null
}

class AppErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  state: BoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Uncaught application error', error, info)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <Page>
        <TopBar title="문제가 생겼어요" back="/" />
        <ErrorState
          message="화면을 표시하지 못했습니다. 기록은 브라우저 저장소에 남아 있습니다."
          action={<Button onClick={() => window.location.assign('/')}>홈에서 다시 열기</Button>}
        />
      </Page>
    )
  }
}

export function App() {
  const [state, setState] = useState<'opening' | 'ready' | 'error'>('opening')
  const [error, setError] = useState<Error | null>(null)

  const open = () => {
    setState('opening')
    setError(null)
    void openDatabase()
      .then(() => setState('ready'))
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason
            : new AppError('ERR-DB-OPEN', '브라우저 저장소를 열 수 없습니다.'),
        )
        setState('error')
      })
  }

  useEffect(() => {
    open()
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (getPendingSaveCount() === 0) return
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => window.removeEventListener('beforeunload', beforeUnload)
  }, [])

  return (
    <AppFrame>
      {state === 'opening' && <LoadingScreen label="그드레스를 여는 중…" />}
      {state === 'error' && (
        <Page>
          <TopBar />
          <ErrorState
            title="현재 기기의 저장소를 열 수 없어요"
            message={error?.message ?? '일반 브라우저에서 다시 열거나 저장소 권한을 확인해주세요.'}
            action={<Button onClick={open}>다시 시도</Button>}
          />
        </Page>
      )}
      {state === 'ready' && (
        <AppErrorBoundary>
          <AppRoutes />
        </AppErrorBoundary>
      )}
    </AppFrame>
  )
}
