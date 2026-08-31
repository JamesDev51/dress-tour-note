# Dress Tour Note

사진 촬영이 제한되는 드레스투어에서 드레스의 특징을 시각적으로 조합해 기록하고, 투어 종료 후 PDF로 저장·복원하는 브라우저 기반 웹앱입니다.

## Product principles

- 서버 없음
- 로그인 없음
- 사용자 데이터는 브라우저 내부에만 저장
- IndexedDB 기반 자동 저장
- PDF 내보내기 및 PDF 기반 복원
- 모바일 우선 UI

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- React Router
- Zustand
- Dexie / IndexedDB
- pdf-lib
- PDF.js

## Local development

```bash
npm install
npm run dev
```

## Checks

```bash
npm run typecheck
npm run build
npm run format:check
```

## Architecture direction

기능 코드는 `src/features` 아래에 도메인 단위로 분리합니다.

- `tour`: 드레스투어/샵/드레스 기록
- `dress-editor`: 디자인 옵션 편집 UI
- `dress-composer`: SVG 드레스 합성
- `face-editor`: 로컬 얼굴 이미지 배치
- `pdf`: PDF 생성·복원
- `db`: IndexedDB 영속성

## Privacy

입력한 드레스 정보와 사진은 별도 서버로 전송하지 않는 것을 제품 원칙으로 합니다.
