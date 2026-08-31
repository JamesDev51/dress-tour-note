import { Route, Routes } from 'react-router-dom'

function HomePage() {
  return (
    <main className="min-h-screen bg-stone-50 px-5 py-10 text-stone-900">
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center">
        <p className="mb-3 text-sm font-medium text-stone-500">Dress Tour Note</p>
        <h1 className="text-4xl font-semibold tracking-tight">사진 없이도 드레스를 기억해요.</h1>
        <p className="mt-4 text-base leading-7 text-stone-600">
          드레스샵별로 입어본 드레스의 특징을 조합해 기록하고, 투어가 끝나면 PDF로 저장할 수 있어요.
        </p>
        <div className="mt-8 flex gap-3">
          <button
            type="button"
            className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white"
          >
            새 투어 시작하기
          </button>
          <button
            type="button"
            className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-700"
          >
            PDF 불러오기
          </button>
        </div>
      </div>
    </main>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="*" element={<HomePage />} />
    </Routes>
  )
}
