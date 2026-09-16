import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { usePendingWrites } from "./usePendingWrites";

describe("usePendingWrites", () => {
  it("starts a write before the caller can immediately navigate or reload", () => {
    const write = vi.fn(async () => undefined);
    const { result } = renderHook(() => usePendingWrites());

    void result.current.run(write);

    expect(write).toHaveBeenCalledOnce();
  });

  it("keeps the completion barrier pending until an in-flight write settles", async () => {
    let resolveWrite: () => void = () => undefined;
    const write = new Promise<void>((resolve) => {
      resolveWrite = resolve;
    });
    const { result } = renderHook(() => usePendingWrites());
    let barrierSettled = false;

    await act(async () => {
      void result.current.run(() => write);
      void result.current.waitForPending().then(() => {
        barrierSettled = true;
      });
      await Promise.resolve();
    });
    expect(barrierSettled).toBe(false);

    await act(async () => {
      resolveWrite();
      await result.current.waitForPending();
    });
    expect(barrierSettled).toBe(true);
  });

  it("keeps a delayed sibling trackable after a rejected clear", async () => {
    let rejectClear: (reason?: unknown) => void = () => undefined;
    let resolveSibling: () => void = () => undefined;
    const clear = new Promise<void>((_, reject) => {
      rejectClear = reject;
    });
    const sibling = new Promise<void>((resolve) => {
      resolveSibling = resolve;
    });
    const { result } = renderHook(() => usePendingWrites());

    const handledClear = result.current
      .run(() => clear)
      .then(
        () => "saved",
        () => "rejected",
      );
    const delayedSibling = result.current.run(() => sibling);
    const barrier = result.current.waitForPending().then(
      () => "settled",
      () => "rejected",
    );

    await act(async () => {
      rejectClear(new Error("clear rejected"));
      await expect(handledClear).resolves.toBe("rejected");
    });
    expect(await barrier).toBe("rejected");

    await act(async () => {
      resolveSibling();
      await delayedSibling;
      await result.current.waitForPending();
    });
  });
});
