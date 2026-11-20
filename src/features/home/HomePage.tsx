import { useState } from "react";
import { OfflineStatus } from "../../components/OfflineStatus";
import { useLiveQuery } from "dexie-react-hooks";
import { ArrowRight, FileUp, ShieldCheck, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandHeader } from "../../components/MobileShell";
import { db } from "../../db/database";
import { deleteTour } from "../../db/repositories";
import { useUIStore } from "../../stores/uiStore";

export function HomePage() {
  const [limit, setLimit] = useState(5);
  const [imageUnavailable, setImageUnavailable] = useState(false);
  const total = useLiveQuery(() => db.tours.count(), []);
  const toast = useUIStore((s) => s.showToast);
  const recent = useLiveQuery(async () => {
    const tours = await db.tours
      .orderBy("updatedAt")
      .reverse()
      .limit(limit)
      .toArray();
    return Promise.all(
      tours.map(async (t) => ({
        ...t,
        shopCount: await db.shops.where("tourId").equals(t.id).count(),
        dressCount: await db.dresses.where("tourId").equals(t.id).count(),
      })),
    );
  }, [limit]);
  if (total === undefined || recent === undefined) {
    return (
      <main className="home-page" aria-busy="true">
        <BrandHeader variant="bridal" />
        <div className="home-content home-loading" role="status">
          기록을 불러오는 중...
        </div>
      </main>
    );
  }
  const hasRecords = total > 0;
  return (
    <main className="home-page">
      <BrandHeader variant="bridal" />
      <section
        className={`home-content home-intro${hasRecords ? " home-intro--returning" : ""}`}
        aria-labelledby="home-title"
      >
        {!imageUnavailable && (
          <figure className="home-dress">
            <img
              src="/assets/home/mirror-fitting.webp"
              alt="거울 앞에서 아이보리 웨딩드레스의 치맛자락을 펼쳐 보는 신부"
              width="960"
              height="720"
              fetchPriority="high"
              onError={() => setImageUnavailable(true)}
            />
          </figure>
        )}
        <h1 id="home-title" className="home-title">
          {hasRecords ? (
            "나의 드레스투어"
          ) : (
            <>
              입어본 드레스,
              <br />
              잊기 전에 남겨요.
            </>
          )}
        </h1>
        {hasRecords && (
          <p className="home-description">
            입어본 순간의 모양과 느낌을 다시 꺼내보세요.
          </p>
        )}
        <Link to="/tour/new" className="home-start">
          새 투어 시작
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
        <Link to="/import" className="home-import">
          <FileUp size={16} aria-hidden="true" />
          PDF에서 가져오기
        </Link>
      </section>
      <section
        className="home-content home-records"
        aria-labelledby="recent-title"
      >
        <h2 id="recent-title" className="home-section-title">
          최근 기록
        </h2>
        {recent.length === 0 ? (
          <p className="home-empty">아직 저장된 드레스투어가 없어요.</p>
        ) : (
          <ul className="home-tour-list">
            {recent.map((t) => (
              <li key={t.id} className="home-tour">
                <Link to={`/tour/${t.id}`} className="home-tour-open">
                  <span className="home-tour-title">{t.title}</span>
                  <span className="home-tour-meta">
                    {t.tourDate || "날짜 없음"} · 샵 {t.shopCount} · 드레스{" "}
                    {t.dressCount}
                  </span>
                  <time
                    className="home-tour-updated"
                    dateTime={t.updatedAt}
                    title={new Date(t.updatedAt).toLocaleString("ko-KR")}
                  >
                    {new Date(t.updatedAt).toLocaleDateString("ko-KR")} 저장
                  </time>
                </Link>
                <button
                  type="button"
                  aria-label={`${t.title} 삭제`}
                  className="home-tour-delete"
                  onClick={async () => {
                    if (confirm(`'${t.title}' 기록을 삭제할까요?`)) {
                      try {
                        await deleteTour(t.id);
                        toast("투어를 삭제했어요.");
                      } catch {
                        toast("삭제하지 못했어요. 다시 시도해 주세요.");
                      }
                    }
                  }}
                >
                  <Trash2 size={16} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
        {total > recent.length && (
          <button
            type="button"
            className="home-more"
            onClick={() => setLimit((current) => current + 10)}
          >
            이전 기록 더 보기 · {total - recent.length}개
          </button>
        )}
      </section>
      <footer className="home-content home-footer">
        <p className="home-privacy">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>투어 기록은 이 브라우저에만 저장해요.</span>
        </p>
        <OfflineStatus />
        <p className="home-credit">
          할미눈나가 만들었어요 ·{" "}
          <a
            href="https://www.instagram.com/halminunna/"
            target="_blank"
            rel="noopener noreferrer"
          >
            @halminunna
          </a>
        </p>
      </footer>
    </main>
  );
}
