import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Dress } from "../../types/domain";
import { FastRecordFlow } from "./FastRecordFlow";

const dress = {
  id: "dress-1",
  topStyle: "unknown",
  neckline: "unknown",
  silhouette: "unknown",
  isFavorite: false,
  rating: undefined,
  quickTags: [],
} satisfies Pick<
  Dress,
  | "id"
  | "topStyle"
  | "neckline"
  | "silhouette"
  | "isFavorite"
  | "rating"
  | "quickTags"
>;
const coreRecordedAt = "2026-09-04T03:00:00.000Z";

function deferred() {
  let resolve: () => void = () => undefined;
  let reject: (error: Error) => void = () => undefined;
  const promise = new Promise<void>((accept, decline) => {
    resolve = accept;
    reject = decline;
  });
  return { promise, resolve, reject };
}

describe("FastRecordFlow", () => {
  it("mounts one semantic page heading without adding a visible duplicate", () => {
    render(
      <FastRecordFlow
        dress={dress}
        onPatch={vi.fn()}
        onComplete={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );

    const pageHeadings = screen.getAllByRole("heading", { level: 1 });
    expect(pageHeadings).toHaveLength(1);
    expect(pageHeadings[0]).toHaveTextContent("드레스 핵심 기록");
    expect(pageHeadings[0]).toHaveClass("sr-only");
  });

  it("mounts one step and waits for the selection write acknowledgement", async () => {
    const write = deferred();
    const onPatch = vi.fn(() => write.promise);
    render(
      <FastRecordFlow
        dress={dress}
        onPatch={onPatch}
        onComplete={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );

    expect(screen.getByText("1/4")).toBeVisible();
    expect(screen.getByRole("heading", { name: /어깨\/상의/ })).toBeVisible();
    expect(screen.queryByRole("heading", { name: /네크라인/ })).toBeNull();
    expect(screen.queryByRole("heading", { name: "소재" })).toBeNull();
    expect(screen.queryByText("얼굴 사진 추가")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /오프숄더/ }));
    expect(screen.getByRole("button", { name: /^다음$/ })).toBeDisabled();
    expect(screen.getByText("1/4")).toBeVisible();

    write.resolve();
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^다음$/ })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));

    expect(screen.getByText("2/4")).toBeVisible();
    expect(screen.getByRole("heading", { name: /네크라인/ })).toBeVisible();
    expect(screen.queryByRole("heading", { name: /어깨\/상의/ })).toBeNull();
  });

  it("treats 기억 안 남 as a deliberate persisted decision", async () => {
    const onPatch = vi.fn(async () => undefined);
    render(
      <FastRecordFlow
        dress={dress}
        onPatch={onPatch}
        onComplete={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /기억 안 남/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    fireEvent.click(screen.getByRole("button", { name: /기억 안 남/ }));

    await waitFor(() =>
      expect(onPatch).toHaveBeenCalledWith({ topStyle: "unknown" }),
    );
    expect(screen.getByRole("button", { name: /기억 안 남/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /^다음$/ })).toBeEnabled();
  });

  it("re-enters an all-unknown candidate-no dress in summary after reload", () => {
    const completedUnknownDress = {
      ...dress,
      coreRecordedAt,
    };

    render(
      <FastRecordFlow
        dress={completedUnknownDress}
        onPatch={vi.fn()}
        onComplete={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: "핵심 기록" })).toBeVisible();
    expect(screen.queryByText("1/4")).toBeNull();
  });

  it("keeps every completed unknown core choice selected after returning from summary", () => {
    render(
      <FastRecordFlow
        dress={{ ...dress, coreRecordedAt }}
        onPatch={vi.fn()}
        onComplete={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "핵심 기록 수정" }));
    expect(screen.getByRole("button", { name: "기억 안 남" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));

    expect(screen.getByRole("button", { name: "기억 안 남" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));

    expect(screen.getByRole("button", { name: "기억 안 남" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("keeps each deliberately completed mixed core choice selected after returning from summary", () => {
    render(
      <FastRecordFlow
        dress={{
          ...dress,
          neckline: "sweetheart",
          coreRecordedAt,
        }}
        onPatch={vi.fn()}
        onComplete={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "핵심 기록 수정" }));
    expect(screen.getByRole("button", { name: "기억 안 남" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));

    expect(screen.getByRole("button", { name: /스위트하트/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));

    expect(screen.getByRole("button", { name: "기억 안 남" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("keeps previously persisted known core choices selected before candidate completion", () => {
    render(
      <FastRecordFlow
        dress={{
          ...dress,
          topStyle: "offShoulder",
          neckline: "sweetheart",
        }}
        onPatch={vi.fn()}
        onComplete={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /오프숄더/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    expect(screen.getByRole("button", { name: /스위트하트/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    expect(screen.getByRole("button", { name: "기억 안 남" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: /^다음$/ })).toBeDisabled();
  });

  it("writes candidate-no and the core acknowledgement atomically", async () => {
    const onPatch = vi.fn(async () => undefined);
    render(
      <FastRecordFlow
        dress={dress}
        onPatch={onPatch}
        onComplete={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /오프숄더/ }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^다음$/ })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    fireEvent.click(screen.getByRole("button", { name: /스위트하트/ }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^다음$/ })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    fireEvent.click(screen.getByRole("button", { name: /A라인/ }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^다음$/ })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    onPatch.mockClear();
    fireEvent.click(screen.getByRole("button", { name: "후보 아님" }));

    await waitFor(() => expect(onPatch).toHaveBeenCalledOnce());
    expect(onPatch).toHaveBeenCalledWith({
      isFavorite: false,
      coreRecordedAt: expect.stringMatching(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      ),
    });
    expect(screen.getByRole("button", { name: "상세 기록" })).toBeVisible();
  });

  it("finishes the current record into summary without adding the next dress", async () => {
    const onComplete = vi.fn(async () => undefined);
    const onFinishAndView = vi.fn(async () => undefined);
    render(
      <FastRecordFlow
        dress={{
          ...dress,
          topStyle: "offShoulder",
          neckline: "sweetheart",
          silhouette: "aLine",
          coreRecordedAt,
        }}
        onPatch={vi.fn(async () => undefined)}
        onComplete={onComplete}
        onFinishAndView={onFinishAndView}
        onOpenDetails={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "핵심 기록 수정" }));
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    fireEvent.click(screen.getByRole("button", { name: "기록 완료하고 보기" }));

    await waitFor(() => expect(onFinishAndView).toHaveBeenCalledOnce());
    expect(onComplete).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "핵심 기록" })).toBeVisible();
  });

  it("keeps the current step and syncs persisted core edits after details return", () => {
    const completed = {
      ...dress,
      topStyle: "offShoulder" as const,
      neckline: "sweetheart" as const,
      silhouette: "aLine" as const,
      coreRecordedAt,
    };
    const { rerender } = render(
      <FastRecordFlow
        dress={completed}
        onPatch={vi.fn(async () => undefined)}
        onComplete={vi.fn(async () => undefined)}
        onOpenDetails={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "핵심 기록 수정" }));
    for (let step = 0; step < 3; step += 1) {
      fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    }
    expect(screen.getByText("4/4")).toBeVisible();

    rerender(
      <FastRecordFlow
        dress={{ ...completed, topStyle: "strapless" }}
        onPatch={vi.fn(async () => undefined)}
        onComplete={vi.fn(async () => undefined)}
        onOpenDetails={vi.fn()}
      />,
    );
    expect(screen.getByText("4/4")).toBeVisible();

    for (let step = 0; step < 3; step += 1) {
      fireEvent.click(screen.getByRole("button", { name: "이전" }));
    }
    expect(screen.getByRole("button", { name: /스트랩리스/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("places 상세 기록 before the long recall editor", () => {
    const completed = {
      ...dress,
      topStyle: "offShoulder" as const,
      neckline: "sweetheart" as const,
      silhouette: "aLine" as const,
      coreRecordedAt,
    };
    render(
      <FastRecordFlow
        dress={completed}
        recallEditor={<div data-testid="long-recall-editor" />}
        onPatch={vi.fn(async () => undefined)}
        onComplete={vi.fn(async () => undefined)}
        onOpenDetails={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "핵심 기록 수정" }));
    for (let step = 0; step < 3; step += 1) {
      fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    }
    const details = screen.getByRole("button", {
      name: "상세 기록",
    });
    const recall = screen.getByTestId("long-recall-editor");
    expect(details.compareDocumentPosition(recall)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });

  it("keeps explicit completion retryable when the awaited flush fails", async () => {
    const onFinishAndView = vi
      .fn<() => Promise<void>>()
      .mockRejectedValueOnce(new Error("flush failed"))
      .mockResolvedValue(undefined);
    render(
      <FastRecordFlow
        dress={{
          ...dress,
          topStyle: "offShoulder",
          neckline: "sweetheart",
          silhouette: "aLine",
          coreRecordedAt,
        }}
        onPatch={vi.fn(async () => undefined)}
        onComplete={vi.fn(async () => undefined)}
        onFinishAndView={onFinishAndView}
        onOpenDetails={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "핵심 기록 수정" }));
    for (let step = 1; step < 4; step += 1) {
      fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    }
    const finish = screen.getByRole("button", {
      name: "기록 완료하고 보기",
    });
    fireEvent.click(finish);
    await waitFor(() => expect(screen.getByRole("alert")).toBeVisible());
    expect(finish).toBeEnabled();

    fireEvent.click(finish);
    await waitFor(() => expect(onFinishAndView).toHaveBeenCalledTimes(2));
  });

  it("does not acknowledge core recording while the candidate write is pending or rejected", async () => {
    const write = deferred();
    let writes = 0;
    const onPatch = vi.fn(() => {
      writes += 1;
      return writes === 4 ? write.promise : Promise.resolve();
    });
    const incompleteDress = {
      ...dress,
      topStyle: "offShoulder" as const,
      neckline: "sweetheart" as const,
      silhouette: "aLine" as const,
    };
    const view = render(
      <FastRecordFlow
        dress={incompleteDress}
        onPatch={onPatch}
        onComplete={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /오프숄더/ }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^다음$/ })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    fireEvent.click(screen.getByRole("button", { name: /스위트하트/ }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^다음$/ })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    fireEvent.click(screen.getByRole("button", { name: /A라인/ }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /^다음$/ })).toBeEnabled(),
    );
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    fireEvent.click(screen.getByRole("button", { name: "후보 아님" }));
    expect(
      screen.getByRole("button", { name: "다음 드레스 기록" }),
    ).toBeDisabled();

    view.unmount();
    render(
      <FastRecordFlow
        dress={incompleteDress}
        onPatch={vi.fn()}
        onComplete={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );
    expect(screen.queryByRole("heading", { name: "핵심 기록" })).toBeNull();
    expect(screen.getByText("1/4")).toBeVisible();

    write.reject(new Error("write rejected"));
    expect("coreRecordedAt" in incompleteDress).toBe(false);
  });

  it("opens recorded dresses in summary and exposes core and detail actions", () => {
    const onOpenDetails = vi.fn();
    render(
      <FastRecordFlow
        dress={{
          ...dress,
          topStyle: "offShoulder",
          coreRecordedAt,
          customOptions: { fabric: "광택이 조금 덜해요" },
        }}
        onPatch={vi.fn()}
        onComplete={vi.fn()}
        onOpenDetails={onOpenDetails}
      />,
    );

    expect(screen.getByRole("heading", { name: "핵심 기록" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "핵심 기록 수정" }),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "상세 기록" })).toBeVisible();
    expect(screen.getByText("소재", { exact: true })).toBeVisible();
    expect(screen.getByText("광택이 조금 덜해요")).toBeVisible();
    expect(screen.queryByText("1/4")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "상세 기록" }));
    expect(onOpenDetails).toHaveBeenCalledOnce();
  });

  it("covers every forward, previous, and summary re-entry transition", () => {
    render(
      <FastRecordFlow
        dress={{
          ...dress,
          topStyle: "offShoulder",
          neckline: "sweetheart",
          silhouette: "aLine",
          coreRecordedAt,
        }}
        onPatch={vi.fn(async () => undefined)}
        onComplete={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "핵심 기록 수정" }));
    expect(screen.getByRole("heading", { name: /어깨\/상의/ })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    expect(screen.getByRole("heading", { name: /네크라인/ })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    expect(screen.getByRole("heading", { name: /실루엣/ })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "이전" }));
    expect(screen.getByRole("heading", { name: /네크라인/ })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "이전" }));
    expect(screen.getByRole("heading", { name: /어깨\/상의/ })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    expect(screen.getByRole("heading", { name: /후보로/ })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "이전" }));
    expect(screen.getByRole("heading", { name: /실루엣/ })).toBeVisible();
  });

  it("resets a newly routed dress to clean Step 1 state", () => {
    const view = render(
      <FastRecordFlow
        dress={{ ...dress, topStyle: "offShoulder", coreRecordedAt }}
        onPatch={vi.fn(async () => undefined)}
        onComplete={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "핵심 기록 수정" }));
    fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    expect(screen.getByText("2/4")).toBeVisible();

    view.rerender(
      <FastRecordFlow
        dress={{ ...dress, id: "dress-2" }}
        onPatch={vi.fn(async () => undefined)}
        onComplete={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );

    expect(screen.getByText("1/4")).toBeVisible();
    expect(screen.getByRole("button", { name: /기억 안 남/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(screen.getByRole("button", { name: /^다음$/ })).toBeDisabled();
  });

  it("keeps Step 4 retryable and suppresses duplicate final submissions", async () => {
    const first = deferred();
    const onComplete = vi
      .fn<() => Promise<void>>()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValue(undefined);
    render(
      <FastRecordFlow
        dress={{
          ...dress,
          topStyle: "offShoulder",
          neckline: "sweetheart",
          silhouette: "aLine",
          coreRecordedAt,
        }}
        onPatch={vi.fn(async () => undefined)}
        onComplete={onComplete}
        onOpenDetails={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "핵심 기록 수정" }));
    for (let step = 1; step < 4; step += 1) {
      fireEvent.click(screen.getByRole("button", { name: /^다음$/ }));
    }
    expect(screen.getByText("4/4")).toBeVisible();

    const finish = screen.getByRole("button", {
      name: "다음 드레스 기록",
    });
    fireEvent.click(finish);
    fireEvent.click(finish);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(finish).toBeDisabled();

    first.reject(new Error("write rejected"));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "저장하지 못했어요. 다시 시도해 주세요.",
    );
    expect(screen.getByText("4/4")).toBeVisible();
    expect(finish).toBeEnabled();

    fireEvent.click(finish);
    await waitFor(() => expect(onComplete).toHaveBeenCalledTimes(2));
  });
});
