import { useState } from "react";
import type { Dress } from "../../types/domain";
import { getDressLooks, getPreferredStylingId } from "../../lib/dress/styling";

export function DressStylingControls({
  dress,
  lookId,
  busy,
  onSwitch,
  name,
  onNameChange,
  onNameBlur,
  onDelete,
  onPrefer,
}: {
  dress: Dress;
  lookId: string;
  busy: boolean;
  onSwitch: (id: string) => void;
  name: string;
  onNameChange: (label: string) => void;
  onNameBlur: () => void;
  onDelete: () => void;
  onPrefer: () => void;
}) {
  const looks = getDressLooks(dress);
  const preferred = getPreferredStylingId(dress) === lookId;
  const [confirmDelete, setConfirmDelete] = useState(false);
  if (looks.length === 1) return null;
  return (
    <fieldset
      disabled={busy}
      className="min-w-0 border-b border-rule bridal-content py-4"
    >
      <legend className="sr-only">이 드레스의 연출</legend>
      <div className="flex flex-wrap items-center gap-2">
        {looks.map((look) => (
          <button
            key={look.id}
            type="button"
            aria-pressed={look.id === lookId}
            onClick={() => onSwitch(look.id)}
            className={
              "min-h-11 max-w-full break-words rounded-control border px-3 text-sm " +
              (look.id === lookId
                ? "border-accent bg-accent-soft font-semibold text-accent-copy"
                : "border-rule bg-white")
            }
          >
            {look.label}
            {getPreferredStylingId(dress) === look.id ? " · 대표" : ""}
          </button>
        ))}
      </div>
      {!preferred && (
        <button
          type="button"
          onClick={onPrefer}
          className="mt-2 min-h-11 rounded-control px-3 text-sm font-semibold text-accent-copy"
        >
          대표 연출로 선택
        </button>
      )}
      {lookId !== "base" && (
        <details className="mt-2">
          <summary className="min-h-11 py-3 text-sm text-ink-muted">
            이름 변경·삭제
          </summary>
          <div className="mt-2">
            <label className="min-w-0 flex-1 text-sm">
              연출 이름
              <input
                value={name}
                maxLength={30}
                onChange={(event) => onNameChange(event.target.value)}
                onBlur={onNameBlur}
                className="mt-1 min-h-11 w-full rounded-control border border-rule px-3"
              />
            </label>
          </div>
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="mt-2 min-h-11 px-3 text-sm text-error"
            >
              이 연출 삭제
            </button>
          ) : (
            <div className="mt-2">
              <p className="text-sm">
                이 연출과 여기에 남긴 메모·느낌 태그를 삭제할까요? 기본 연출은
                그대로 남아요.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onDelete}
                  className="min-h-11 px-3 text-sm text-error"
                >
                  삭제하기
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="min-h-11 px-3 text-sm"
                >
                  취소
                </button>
              </div>
            </div>
          )}
        </details>
      )}
    </fieldset>
  );
}
