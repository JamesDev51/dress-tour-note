import { Link, useRouteError } from "react-router-dom";
import { EmptyRecordIllustration } from "./RecordGraphics";

export function MissingRecord({
  to = "/",
  label = "홈으로 돌아가기",
}: {
  to?: string;
  label?: string;
}) {
  return (
    <main className="bridal-page bridal-content py-16 text-center">
      <EmptyRecordIllustration />
      <h1 className="bridal-title">기록을 찾을 수 없어요</h1>
      <p className="mt-3 text-sm leading-6 text-ink-muted">
        이 브라우저에서 기록을 찾을 수 없어요. 삭제된 기록일 수도 있어요.
      </p>
      <Link
        to={to}
        className="mt-6 inline-flex min-h-12 items-center justify-center bridal-primary px-5"
      >
        {label}
      </Link>
    </main>
  );
}

export function RouteErrorRecovery() {
  useRouteError();
  return (
    <div className="app-shell bridal-page bridal-content mx-auto max-w-[480px] py-16 text-center">
      <EmptyRecordIllustration />
      <h1 className="bridal-title">화면을 불러오지 못했어요</h1>
      <p role="alert" className="mt-3 text-sm leading-6 text-ink-muted">
        저장된 기록은 지우지 않았어요. 다시 불러오거나 홈에서 기록을 열어
        주세요.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-6 min-h-12 w-full bridal-primary px-4"
      >
        다시 불러오기
      </button>
      <a
        href="/"
        className="mt-3 inline-flex min-h-11 items-center px-4 text-sm font-semibold text-accent-copy"
      >
        홈으로 돌아가기
      </a>
    </div>
  );
}
