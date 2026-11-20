import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Dress } from "../../types/domain";
import { FastRecordFlow } from "./FastRecordFlow";

const blank = {
  id: "dress-1",
  topStyle: "unknown",
  neckline: "unknown",
  silhouette: "unknown",
  fabric: "unknown",
  isFavorite: false,
  quickTags: [],
} satisfies Pick<
  Dress,
  | "id"
  | "topStyle"
  | "neckline"
  | "silhouette"
  | "fabric"
  | "isFavorite"
  | "quickTags"
>;
const recorded = {
  ...blank,
  topStyle: "offShoulder" as const,
  neckline: "sweetheart" as const,
  silhouette: "aLine" as const,
  fabric: "lace" as const,
  coreRecordedAt: "2026-09-04T03:00:00.000Z",
};
const defaults = {
  onPatch: vi.fn(async () => undefined),
  onComplete: vi.fn(async () => undefined),
  onOpenDetails: vi.fn(),
};
function deferred() {
  let resolve!: () => void;
  let reject!: (e: Error) => void;
  const promise = new Promise<void>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
function next() {
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
}
async function choose(name: string | RegExp) {
  fireEvent.click(screen.getByRole("button", { name }));
  await waitFor(() =>
    expect(screen.getByRole("button", { name })).toBeEnabled(),
  );
}
function upper() {
  next();
  next();
}

describe("FastRecordFlow simplified recording", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());
  it("keeps choices in place after saving, and opens preview only when requested", async () => {
    const onPatch = vi.fn(async () => undefined);
    render(
      <FastRecordFlow
        {...defaults}
        dress={blank}
        onPatch={onPatch}
        corePreview={<div>현재 조합</div>}
      />,
    );
    const choice = screen.getByRole("button", { name: /A라인/ });
    choice.focus();
    await choose(/A라인/);
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(choice).toHaveFocus();
    expect(screen.queryByText("현재 조합")).not.toBeInTheDocument();
    const preview = screen.getByRole("button", {
      name: "미리보기",
    });
    fireEvent.click(preview);
    const dialog = screen.getByRole("dialog", { name: "드레스 미리보기" });
    expect(within(dialog).getByText("현재 조합")).toBeVisible();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "선택으로 돌아가기" }),
    );
    await waitFor(() => expect(preview).toHaveFocus());
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
  it("moves to the new choices only after explicit step navigation", async () => {
    render(
      <FastRecordFlow {...defaults} dress={recorded} initialView="steps" />,
    );
    next();
    expect(
      screen.getByRole("heading", { name: "소재·표면은 어땠나요?" }),
    ).toHaveFocus();
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    await choose(/실크/);
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "이전" }));
    expect(
      screen.getByRole("heading", { name: "전체 모양은 어땠나요?" }),
    ).toHaveFocus();
    expect(window.scrollTo).toHaveBeenCalledTimes(2);
  });

  it("records neckline and straps independently on the same third step", async () => {
    const onPatch = vi.fn(async () => undefined),
      finish = vi.fn(async () => undefined);
    render(
      <FastRecordFlow
        {...defaults}
        dress={blank}
        onPatch={onPatch}
        onFinishAndView={finish}
      />,
    );
    await choose(/A라인/);
    next();
    await choose(/실크/);
    next();
    expect(screen.getByRole("heading", { name: "목·가슴선" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "끈·소매" })).toBeVisible();
    await choose("하트 가슴선");
    expect(onPatch).toHaveBeenLastCalledWith({ neckline: "sweetheart" });
    expect(
      screen.getByRole("button", { name: "기록 완료하고 보기" }),
    ).toBeDisabled();
    await choose("어깨 감쌈");
    expect(onPatch).toHaveBeenLastCalledWith({ topStyle: "offShoulder" });
    fireEvent.click(screen.getByRole("button", { name: "기록 완료하고 보기" }));
    await screen.findByRole("heading", { name: "기본 기록" });
    expect(finish).toHaveBeenCalledOnce();
    expect(onPatch.mock.calls).toEqual([
      [{ silhouette: "aLine" }],
      [
        {
          fabric: "mikadoSatin",
          upperFabric: undefined,
          lowerFabric: undefined,
          lowerFabricStart: undefined,
        },
      ],
      [{ neckline: "sweetheart" }],
      [{ topStyle: "offShoulder" }],
    ]);
  });
  it("supports explicit unknown neckline and sleeve choices separately", async () => {
    const onPatch = vi.fn(async () => undefined);
    render(<FastRecordFlow {...defaults} dress={blank} onPatch={onPatch} />);
    await choose("기억 안 남");
    next();
    await choose("기억 안 남");
    next();
    await choose("가슴선 기억 안 남");
    await choose("끈·소매 기억 안 남");
    expect(onPatch).toHaveBeenNthCalledWith(3, { neckline: "unknown" });
    expect(onPatch).toHaveBeenNthCalledWith(4, { topStyle: "unknown" });
    expect(
      screen.getByRole("button", { name: "기록 완료하고 보기" }),
    ).toBeEnabled();
  });
  it("uses one material by default and lets a mixed dress select each region", async () => {
    const onPatch = vi.fn(async () => undefined);
    render(
      <FastRecordFlow
        {...defaults}
        dress={recorded}
        initialView="steps"
        onPatch={onPatch}
      />,
    );
    next();
    expect(
      screen.queryByRole("group", { name: "상체 소재" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("checkbox", { name: "상체와 치마 소재가 달라요" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("group", { name: "상체 소재" })).toBeVisible(),
    );
    const upper = screen.getByRole("group", { name: "상체 소재" }),
      lower = screen.getByRole("group", { name: "치마 소재" });
    fireEvent.click(within(upper).getByRole("button", { name: /레이스/ }));
    await waitFor(() =>
      expect(onPatch).toHaveBeenLastCalledWith({
        fabric: "lace",
        upperFabric: "lace",
        lowerFabric: "lace",
        lowerFabricStart: undefined,
      }),
    );
    fireEvent.click(within(lower).getByRole("button", { name: /망사·쉬폰/ }));
    await waitFor(() =>
      expect(onPatch).toHaveBeenLastCalledWith({
        fabric: "lace",
        upperFabric: "lace",
        lowerFabric: "organzaChiffon",
        lowerFabricStart: undefined,
      }),
    );
    fireEvent.click(
      screen.getByRole("checkbox", { name: "상체와 치마 소재가 달라요" }),
    );
    await waitFor(() =>
      expect(onPatch).toHaveBeenLastCalledWith({
        fabric: "lace",
        upperFabric: undefined,
        lowerFabric: undefined,
        lowerFabricStart: undefined,
      }),
    );
  });
  it("keeps material choices and navigation responsive during a delayed save", async () => {
    const gate = deferred();
    const onPatch = vi.fn(() => gate.promise);
    render(
      <FastRecordFlow
        {...defaults}
        dress={{
          ...recorded,
          upperFabric: "lace",
          lowerFabric: "organzaChiffon",
          lowerFabricStart: "hip",
        }}
        initialView="steps"
        onPatch={onPatch}
      />,
    );
    next();
    const knee = screen.getByRole("button", { name: "무릎부터" });
    const hip = screen.getByRole("button", { name: "골반부터" });
    const stepScrollCalls = vi.mocked(window.scrollTo).mock.calls.length;
    fireEvent.click(knee);
    expect(onPatch).toHaveBeenCalledWith(
      expect.objectContaining({ lowerFabricStart: "knee" }),
    );
    expect(knee).toBeEnabled();
    expect(knee).toHaveAttribute("aria-pressed", "true");
    expect(hip).toHaveAttribute("aria-pressed", "false");
    expect(window.scrollTo).toHaveBeenCalledTimes(stepScrollCalls);
    next();
    expect(screen.getByRole("heading", { name: "목·가슴선" })).toHaveFocus();
    expect(
      screen.getByRole("button", { name: "기록 완료하고 보기" }),
    ).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "이전" }));
    expect(screen.getByRole("button", { name: "무릎부터" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    next();
    await act(async () => gate.resolve());
    fireEvent.click(screen.getByRole("button", { name: "기록 완료하고 보기" }));
    expect(
      await screen.findByText("위쪽 레이스 · 무릎부터 망사·쉬폰"),
    ).toBeVisible();
  });
  it("keeps the latest material across an earlier write and a stale record refresh", async () => {
    const first = deferred();
    const second = deferred();
    const onPatch = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise);
    const dress = {
      ...recorded,
      upperFabric: "lace" as const,
      lowerFabric: "organzaChiffon" as const,
    };
    const props = {
      ...defaults,
      initialView: "steps" as const,
      dress,
      onPatch,
    };
    const view = render(<FastRecordFlow {...props} />);
    next();
    fireEvent.click(screen.getByRole("button", { name: "골반부터" }));
    fireEvent.click(screen.getByRole("button", { name: "허벅지부터" }));
    expect(onPatch).toHaveBeenCalledTimes(2);
    await act(async () => first.resolve());
    view.rerender(
      <FastRecordFlow
        {...props}
        dress={{ ...dress, lowerFabricStart: "hip" }}
      />,
    );
    expect(screen.getByRole("button", { name: "허벅지부터" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await act(async () => second.reject(new Error("storage failure")));
    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.getByRole("button", { name: "골반부터" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await choose("허벅지부터");
    expect(onPatch).toHaveBeenCalledTimes(3);
  });
  it("shows one selected mermaid choice for a saved fit-and-flare dress", () => {
    render(
      <FastRecordFlow
        {...defaults}
        dress={{ ...recorded, silhouette: "fitAndFlare" }}
        initialView="steps"
      />,
    );
    expect(
      screen.queryByRole("button", { name: /피트 앤 플레어/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /머메이드/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
  it("removes length choices and merges similar sheer material choices", () => {
    render(
      <FastRecordFlow
        {...defaults}
        dress={{ ...recorded, silhouette: "teaLength" }}
        initialView="steps"
      />,
    );
    expect(
      screen.queryByRole("button", { name: /짧은 길이|발목 위/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /A라인/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    next();
    expect(screen.getByRole("button", { name: /망사·쉬폰/ })).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /얇고 흐르는|^망사$/ }),
    ).not.toBeInTheDocument();
  });
  it("lets each step continue editing while earlier choices save, and gates completion on confirmation", async () => {
    const first = deferred();
    const last = deferred();
    const onPatch = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValue(last.promise);
    const props = { ...defaults, onPatch, dress: blank };
    const view = render(<FastRecordFlow {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /A라인/ }));
    fireEvent.click(screen.getByRole("button", { name: /머메이드/ }));
    expect(screen.getByRole("button", { name: /머메이드/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    next();
    fireEvent.click(screen.getByRole("button", { name: /레이스/ }));
    next();
    fireEvent.click(screen.getByRole("button", { name: "하트 가슴선" }));
    fireEvent.click(screen.getByRole("button", { name: "브이넥" }));
    fireEvent.click(screen.getByRole("button", { name: "끈 없음" }));
    expect(onPatch).toHaveBeenCalledTimes(6);
    expect(screen.getByRole("button", { name: "브이넥" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "끈 없음" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const finish = () =>
      screen.getByRole("button", { name: "기록 완료하고 보기" });
    expect(finish()).toBeDisabled();
    await act(async () => first.resolve());
    view.rerender(
      <FastRecordFlow {...props} dress={{ ...blank, silhouette: "aLine" }} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "이전" }));
    fireEvent.click(screen.getByRole("button", { name: "이전" }));
    expect(screen.getByRole("button", { name: /머메이드/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    next();
    next();
    await act(async () => last.resolve());
    expect(finish()).toBeEnabled();
  });
  it("allows navigation while saving and reverts a rejected choice for retry", async () => {
    const pending = deferred(),
      onPatch = vi
        .fn()
        .mockImplementationOnce(() => pending.promise)
        .mockResolvedValue(undefined);
    render(<FastRecordFlow {...defaults} dress={blank} onPatch={onPatch} />);
    fireEvent.click(screen.getByRole("button", { name: /A라인/ }));
    expect(screen.getByRole("button", { name: "다음" })).toBeEnabled();
    await act(async () => pending.reject(new Error("disk full")));
    expect(screen.getByRole("alert")).toBeVisible();
    expect(screen.getByRole("button", { name: /A라인/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    await choose(/A라인/);
    expect(screen.getByRole("button", { name: "다음" })).toBeEnabled();
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
  it("keeps a failed neckline unchanged without changing straps", async () => {
    const onPatch = vi
      .fn()
      .mockRejectedValueOnce(new Error("failed"))
      .mockResolvedValue(undefined);
    render(
      <FastRecordFlow
        {...defaults}
        dress={recorded}
        initialView="steps"
        onPatch={onPatch}
      />,
    );
    upper();
    fireEvent.click(screen.getByRole("button", { name: "브이넥" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("button", { name: "하트 가슴선" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "어깨 감쌈" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await choose("브이넥");
    expect(onPatch.mock.calls).toEqual([
      [{ neckline: "v" }],
      [{ neckline: "v" }],
    ]);
  });
  it("respects the shared save coordinator block", () => {
    const view = render(
      <FastRecordFlow
        {...defaults}
        dress={recorded}
        initialView="steps"
        saveBlocked
      />,
    );
    expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();
    view.rerender(
      <FastRecordFlow
        {...defaults}
        dress={recorded}
        initialView="steps"
        saveBlocked={false}
      />,
    );
    expect(screen.getByRole("button", { name: "다음" })).toBeEnabled();
  });
  it("keeps the active step and independent selections when records refresh", () => {
    const view = render(
      <FastRecordFlow
        {...defaults}
        dress={{ ...recorded, coreRecordedAt: undefined }}
      />,
    );
    upper();
    view.rerender(
      <FastRecordFlow
        {...defaults}
        dress={{ ...recorded, topStyle: "strapless" }}
      />,
    );
    expect(screen.getByText("3/3")).toBeVisible();
    expect(screen.getByRole("button", { name: "끈 없음" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
  it("starts a new identity cleanly and ignores the prior look's late write", async () => {
    const pending = deferred();
    const view = render(
      <FastRecordFlow
        {...defaults}
        dress={blank}
        identityKey="base"
        onPatch={() => pending.promise}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /A라인/ }));
    view.rerender(
      <FastRecordFlow {...defaults} dress={blank} identityKey="look-2" />,
    );
    await act(async () => pending.resolve());
    expect(screen.getByRole("button", { name: "다음" })).toBeDisabled();
  });
  it("keeps finish failures retryable and avoids duplicate submissions", async () => {
    const pending = deferred(),
      finish = vi
        .fn()
        .mockImplementationOnce(() => pending.promise)
        .mockResolvedValue(undefined);
    render(
      <FastRecordFlow
        {...defaults}
        dress={recorded}
        initialView="steps"
        onFinishAndView={finish}
      />,
    );
    upper();
    const button = screen.getByRole("button", { name: "기록 완료하고 보기" });
    fireEvent.click(button);
    fireEvent.click(button);
    expect(finish).toHaveBeenCalledOnce();
    await act(async () => pending.reject(new Error("failed")));
    expect(screen.getByRole("alert")).toBeVisible();
    fireEvent.click(button);
    await screen.findByRole("heading", { name: "기본 기록" });
    expect(finish).toHaveBeenCalledTimes(2);
  });
  it("creates a new dress only from its summary and preserves the summary on failure", async () => {
    const onComplete = vi
      .fn()
      .mockRejectedValueOnce(new Error("failed"))
      .mockResolvedValue(undefined);
    render(
      <FastRecordFlow {...defaults} dress={recorded} onComplete={onComplete} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "다음 드레스 기록" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("heading", { name: "기본 기록" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "다음 드레스 기록" }));
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(2));
  });
});
