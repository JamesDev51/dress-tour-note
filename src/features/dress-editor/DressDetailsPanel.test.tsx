import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Dress } from "../../types/domain";
import { DressDetailsPanel } from "./DressDetailsPanel";
import { DressAdjustmentPanel } from "./DressAdjustmentPanel";
const dress: Dress = {
  id: "dress-1",
  tourId: "tour-1",
  shopId: "shop-1",
  order: 0,
  label: "드레스 1",
  topStyle: "strapless",
  neckline: "sweetheart",
  silhouette: "aLine",
  waistline: "unknown",
  backStyle: "unknown",
  fabric: "unknown",
  color: "unknown",
  train: "unknown",
  details: [],
  quickTags: [],
  memo: "",
  isFavorite: false,
  createdAt: "",
  updatedAt: "",
};
const props = {
  memo: "",
  onCustomCommit: vi.fn(),
  onMemoChange: vi.fn(),
  onMemoBlur: vi.fn(),
  onClose: vi.fn(),
};
function renderPanel(
  record = dress,
  onPatch: (patch: Partial<Dress>) => Promise<void> = vi.fn(
    async () => undefined,
  ),
) {
  render(<DressDetailsPanel {...props} dress={record} onPatch={onPatch} />);
  return onPatch;
}
describe("DressDetailsPanel simplified options", () => {
  it("keeps waist/details and removes face, back, length and color features", () => {
    renderPanel();
    for (const name of [
      "목·가슴선",
      "끈·소매",
      "전체 모양",
      "소재·표면",
      "허리선",
      "장식과 세부 특징",
      "입어봤을 때 어땠나요?",
      "추가 메모",
    ])
      expect(screen.getByRole("heading", { name })).toBeVisible();
    for (const text of [
      /얼굴 사진|얼굴 미리보기/,
      /뒷모습/,
      /뒤로 끌리는/,
      /^색상$/,
      /탈부착 소매/,
      /뒤 리본/,
    ])
      expect(
        screen.queryByRole("button", { name: text }),
      ).not.toBeInTheDocument();
    expect(document.querySelector('[data-option-category="color"]')).toBeNull();
    expect(document.querySelector('[data-option-category="train"]')).toBeNull();
    expect(
      document.querySelector('[data-option-category="backStyle"]'),
    ).toBeNull();
    for (const label of [
      "가벼움",
      "편함",
      "조임",
      "흘러내림",
      "무거움",
      "불편함",
      "까슬거림",
    ])
      expect(
        screen.queryByRole("button", { name: label }),
      ).not.toBeInTheDocument();
  });
  it("keeps pending decoration choices editable and preserves the latest combination", async () => {
    let finish!: () => void;
    const gate = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const onPatch = vi.fn((_patch: Partial<Dress>) => gate);
    const view = render(
      <DressDetailsPanel {...props} dress={dress} onPatch={onPatch} />,
    );
    const pearl = screen.getByRole("button", { name: /진주 장식/ });
    const sequin = screen.getByRole("button", { name: /스팽글/ });
    fireEvent.click(pearl);
    expect(sequin).toBeEnabled();
    view.rerender(
      <DressDetailsPanel
        {...props}
        dress={{ ...dress, details: ["pearl"] }}
        onPatch={onPatch}
      />,
    );
    fireEvent.click(sequin);
    view.rerender(
      <DressDetailsPanel
        {...props}
        dress={{ ...dress, details: ["pearl", "sequin"] }}
        onPatch={onPatch}
      />,
    );
    expect(sequin).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(pearl);
    expect(onPatch.mock.calls.map(([patch]) => patch.details)).toEqual([
      ["pearl"],
      ["pearl", "sequin"],
      ["sequin"],
    ]);
    await act(async () => finish());
  });
  it("clears a closest material note atomically with an unknown choice", () => {
    const onPatch = vi.fn(async (_patch: Partial<Dress>) => undefined);
    renderPanel(
      {
        ...dress,
        fabric: "lace",
        lowerFabricStart: "knee",
        customOptions: { fabric: "광택이 달라요", neckline: "스캘럽 가장자리" },
      },
      onPatch,
    );
    const section = document.querySelector('[data-option-category="fabric"]');
    if (!(section instanceof HTMLElement)) throw new Error("missing section");
    fireEvent.click(
      within(section).getByRole("button", { name: "기억 안 남" }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "메모 지우고 기억 안 남 선택" }),
    );
    expect(onPatch.mock.lastCall?.[0]).toStrictEqual({
      fabric: "unknown",
      upperFabric: undefined,
      lowerFabric: undefined,
      lowerFabricStart: undefined,
      customOptions: { fabric: undefined },
    });
  });
  it("edits the lower fabric start in the detailed material picker", () => {
    const onPatch = renderPanel({
      ...dress,
      fabric: "lace",
      upperFabric: "lace",
      lowerFabric: "organzaChiffon",
      lowerFabricStart: "knee",
    });
    const group = screen.getByRole("group", {
      name: "아래 소재는 어디서 시작해요?",
    });
    expect(
      within(group).getByRole("button", { name: "무릎부터" }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(within(group).getByRole("button", { name: "허벅지부터" }));
    expect(onPatch).toHaveBeenCalledWith({
      fabric: "lace",
      upperFabric: "lace",
      lowerFabric: "organzaChiffon",
      lowerFabricStart: "thigh",
    });
  });
  it("counts active details only and keeps the four-detail cap", () => {
    renderPanel({
      ...dress,
      details: [
        "corset",
        "draping",
        "waistBow",
        "pearl",
        "backBow",
        "detachableSleeve",
      ],
    });
    const section = document.querySelector('[data-option-category="details"]');
    if (!(section instanceof HTMLElement)) throw new Error("missing details");
    expect(screen.getByText("최대 4개 선택 · 4/4")).toBeVisible();
    expect(
      within(section).getByRole("button", { name: /코르셋/ }),
    ).toBeEnabled();
    expect(
      within(section).getByRole("button", { name: /스팽글/ }),
    ).toBeDisabled();
  });
});

describe("DressAdjustmentPanel", () => {
  it.each([
    {
      category: "neckline",
      first: /^브이넥/,
      second: /^사각 목선/,
      firstPatch: { neckline: "v" },
      secondPatch: { neckline: "square" },
    },
    {
      category: "top",
      first: /^가는 끈/,
      second: /^어깨 감쌈/,
      firstPatch: { topStyle: "spaghetti" },
      secondPatch: { topStyle: "offShoulder" },
    },
  ] as const)(
    "keeps quick $category adjustments editable during a pending save",
    async ({ category, first, second, firstPatch, secondPatch }) => {
      let finish!: () => void;
      const gate = new Promise<void>((resolve) => {
        finish = resolve;
      });
      const onPatch = vi.fn((_patch: Partial<Dress>) => gate);
      render(
        <DressAdjustmentPanel
          category={category}
          dress={dress}
          onPatch={onPatch}
          onCustomCommit={props.onCustomCommit}
          onClose={props.onClose}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: first }));
      const other = screen.getByRole("button", { name: second });
      expect(other).toBeEnabled();
      fireEvent.click(other);
      expect(onPatch.mock.calls).toEqual([[firstPatch], [secondPatch]]);
      expect(
        screen.getByRole("button", { name: "기록으로 돌아가기" }),
      ).toBeEnabled();
      await act(async () => finish());
    },
  );
});
