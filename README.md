# 그드레스 (dress-tour-note)

사진 촬영이 어려운 드레스투어에서 그림 대신 드레스 형태를 선택해 기록하고, **복원 가능한 PDF 한 파일**로 다른 기기에 옮길 수 있는 모바일 전용 웹앱입니다.

## 원칙
- React + TypeScript + Vite, Vercel 정적 호스팅
- 서버/API/로그인/분석 SDK 없음
- Dexie/IndexedDB 자동 저장
- SVG 기반 드레스 조합 (AI 이미지 생성 없음)
- 얼굴 사진은 브라우저 Canvas에서 재인코딩 후 로컬 저장
- PDF 내부 `gudress-data-v1.json` + 선택적 얼굴 첨부로 기기 간 복원
- 첫 정상 로드 후 PWA 오프라인 사용

## 실행
```bash
npm install
npm run dev
npm run typecheck
npm test
npm run build
```

## 주요 라우트
- `/` 홈 / 최근 기록
- `/tour/new` 투어 생성
- `/tour/:tourId` 투어 대시보드
- `/tour/:tourId/shop/:shopId` 샵 상세
- `/tour/:tourId/dress/:dressId` 드레스 편집
- `/tour/:tourId/review` 결과 검토
- `/tour/:tourId/export` 복원 PDF 내보내기
- `/import` 복원 PDF 불러오기
- `/privacy` 로컬 저장/삭제 안내

## 저장 모델
IndexedDB schema v1: `tours`, `shops`, `dresses`, `assets`, `meta`. 사용자 영속 데이터의 진실 원천은 Dexie입니다. Zustand는 저장 상태/토스트/PWA 업데이트 같은 UI 상태에만 사용합니다.

## PDF schema v1
- 첨부 JSON: `gudress-data-v1.json`
- format: `gudress-portable-tour`
- schemaVersion: `1`
- 얼굴 포함 시: `gudress-asset-{id}.webp|jpg`
- 얼굴 제외 옵션은 페이지뿐 아니라 JSON의 asset ref, dress.faceTransform, PDF 첨부 바이트까지 제거합니다.
- 일반 PDF/OCR 복원은 하지 않습니다.

## 드레스 옵션 추가
`src/types/domain.ts` union → `src/lib/dress/options.ts` 라벨/호환성 → `src/lib/renderer/dressSvg.ts` 렌더링 → portable schema 테스트 순서로 함께 수정합니다.

## 배포
Vercel Framework Preset은 Vite, Build Command는 `npm run build`, Output Directory는 `dist`, 환경변수는 없습니다. `vercel.json`이 SPA rewrite와 보안 헤더를 적용합니다.
