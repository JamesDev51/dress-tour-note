const necklineGuide = {
  title: "목·가슴선 차이 살펴보기",
  items: [
    {
      id: "straight",
      name: "일자 가슴선",
      note: "가슴 위쪽 테두리가 거의 수평이에요.",
    },
    {
      id: "sweetheart",
      name: "하트 가슴선",
      note: "가운데가 내려오는 하트 모양이에요.",
    },
  ],
} as const;

export function OptionGuide({ category }: { category: string }) {
  if (category !== "neckline") return null;
  return (
    <details className="option-guide mb-4 rounded-control border border-stone-200 bg-artwork-surface">
      <summary className="min-h-11 cursor-pointer px-3 py-3 text-sm font-semibold text-accent-copy">
        {necklineGuide.title}
      </summary>
      <div className="grid grid-cols-2 gap-3 px-3 pb-4">
        {necklineGuide.items.map((item) => (
          <figure key={item.id} className="min-w-0">
            <img
              src={`/assets/options/${category}/${item.id}.webp`}
              alt=""
              width="160"
              height="160"
              loading="lazy"
              className="aspect-square w-full rounded-xl object-cover"
            />
            <figcaption className="mt-2 text-xs leading-5">
              <strong>{item.name}</strong>
              <p className="mt-1 text-ink-muted">{item.note}</p>
            </figcaption>
          </figure>
        ))}
      </div>
    </details>
  );
}
