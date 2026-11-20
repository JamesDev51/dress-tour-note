import { Check, Heart, NotebookPen } from "lucide-react";

export function RecordJourney() {
  return (
    <ol
      aria-label="드레스노트 사용 순서"
      className="record-journey mt-5 grid grid-cols-3 gap-2"
    >
      <li>
        <div className="journey-picture">
          <img
            src="/assets/options/top/offShoulder.webp"
            alt=""
            width="80"
            height="80"
          />
          <span className="journey-check">
            <Check size={12} />
          </span>
        </div>
        <p>1. 특징 고르기</p>
      </li>
      <li>
        <div className="journey-picture flex-col gap-1 px-3">
          <NotebookPen size={22} aria-hidden="true" />
          <span className="h-1 w-full rounded-full bg-stone-200" />
          <span className="h-1 w-2/3 self-start rounded-full bg-stone-200" />
        </div>
        <p>2. 느낌 남기기</p>
      </li>
      <li>
        <div className="journey-picture gap-1 p-2">
          <img
            src="/assets/options/silhouette/aLine.webp"
            alt=""
            width="48"
            height="64"
          />
          <Heart
            size={12}
            className="absolute right-1 top-1 text-accent-copy"
            aria-hidden="true"
          />
        </div>
        <p>3. 기록 다시 보기</p>
      </li>
    </ol>
  );
}

export function EmptyRecordIllustration({
  favorite = false,
}: {
  favorite?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 120 88"
      className="mx-auto mb-4 h-[88px] w-[120px] text-accent-copy"
      fill="none"
    >
      <rect
        x="43"
        y="16"
        width="52"
        height="62"
        rx="12"
        fill="var(--ds-color-accent-soft)"
      />
      <path
        d="M56 31h25M56 40h18M56 49h22"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".45"
      />
      <path
        d="M30 25c0-7 12-7 12 0 0 5-6 5-6 10l22 13c3 2 2 6-2 6H16c-4 0-5-4-2-6l22-13"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {favorite ? (
        <path d="M79 58c-8-9-18 3 0 14 18-11 8-23 0-14Z" fill="currentColor" />
      ) : (
        <path
          d="m69 63 5 5 10-11"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
