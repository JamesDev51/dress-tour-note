import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "../../db/database";
import { addDress, addShop, createTour } from "../../db/repositories";
import { useDressEditorDraft } from "./useDressEditorDraft";

const onSaveStatus = () => undefined;
function deferred() {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((accept) => {
    resolve = accept;
  });
  return { promise, resolve };
}
afterEach(async () => {
  sessionStorage.clear();
  await db.delete();
  await db.open();
});

async function createRecord() {
  const tourId = await createTour({ title: "다시 보는 기록" });
  const shopId = await addShop(tourId, { name: "드레스샵" });
  const dressId = await addDress(shopId, {
    memoryCue: "처음 기록",
    likedReason: "허리가 편함",
    concern: "무거움",
  });
  const dress = await db.dresses.get(dressId);
  if (!dress) throw new Error("record fixture missing");
  return dress;
}

describe("recall draft persistence", () => {
  it("flushes the final edited values through the repository when immediately unmounted", async () => {
    const dress = await createRecord();
    const hook = renderHook(() =>
      useDressEditorDraft({
        dressId: dress.id,
        dress,
        face: undefined,
        onSaveStatus,
      }),
    );
    act(() => {
      hook.result.current.updateRecall("memoryCue", "등 뒤 큰 리본");
      hook.result.current.updateRecall("likedReason", "목선이 시원함");
      hook.result.current.updateRecall("concern", "팔 올리기 불편함");
    });
    hook.unmount();
    await waitFor(async () => {
      expect(await db.dresses.get(dress.id)).toMatchObject({
        memoryCue: "등 뒤 큰 리본",
        likedReason: "목선이 시원함",
        concern: "팔 올리기 불편함",
      });
    });
  });

  it("clears one recall field without erasing the other observations", async () => {
    const dress = await createRecord();
    const hook = renderHook(() =>
      useDressEditorDraft({
        dressId: dress.id,
        dress,
        face: undefined,
        onSaveStatus,
      }),
    );
    act(() => hook.result.current.updateRecall("memoryCue", ""));
    hook.unmount();
    await waitFor(async () => {
      const saved = await db.dresses.get(dress.id);
      expect(saved?.memoryCue).toBeUndefined();
      expect(saved?.likedReason).toBe("허리가 편함");
      expect(saved?.concern).toBe("무거움");
    });
  });

  it("does not autosave a hydrated legacy memo or mark it as saving", async () => {
    const dress = { ...(await createRecord()), memo: "예전 메모" };
    const statuses: string[] = [];
    const writeDress = vi.fn(async () => undefined);
    const hook = renderHook(() =>
      useDressEditorDraft({
        dressId: dress.id,
        dress,
        face: undefined,
        onSaveStatus: (status) => statuses.push(status),
        writeDress,
      }),
    );

    await waitFor(() => expect(hook.result.current.memo).toBe("예전 메모"));
    expect(writeDress).not.toHaveBeenCalled();
    expect(statuses).not.toContain("saving");
    hook.unmount();
  });

  it("keeps a real memo edit in saving state until the write resolves", async () => {
    const dress = await createRecord();
    const write = deferred();
    const statuses: string[] = [];
    const writeDress = vi.fn(() => write.promise);
    const hook = renderHook(() =>
      useDressEditorDraft({
        dressId: dress.id,
        dress,
        face: undefined,
        onSaveStatus: (status) => statuses.push(status),
        writeDress,
      }),
    );

    await waitFor(() => expect(hook.result.current.memo).toBe(dress.memo));
    act(() => hook.result.current.setMemo("새 메모"));
    await waitFor(() =>
      expect(writeDress).toHaveBeenCalledWith(dress.id, { memo: "새 메모" }),
    );
    expect(statuses.at(-1)).toBe("saving");

    write.resolve();
    await waitFor(() => expect(statuses.at(-1)).toBe("saved"));
    hook.unmount();
  });

  it("reports an actual memo write failure instead of settling it as saved", async () => {
    const dress = await createRecord();
    const statuses: string[] = [];
    const writeDress = vi.fn(async () => {
      throw new Error("write failed");
    });
    const hook = renderHook(() =>
      useDressEditorDraft({
        dressId: dress.id,
        dress,
        face: undefined,
        onSaveStatus: (status) => statuses.push(status),
        writeDress,
      }),
    );

    await waitFor(() => expect(hook.result.current.memo).toBe(dress.memo));
    act(() => hook.result.current.setMemo("실패할 메모"));
    await waitFor(() => expect(statuses.at(-1)).toBe("error"));
    expect(writeDress).toHaveBeenCalledWith(dress.id, { memo: "실패할 메모" });
    hook.unmount();
  });

  it("recovers the last uncommitted recall snapshot after a reload", async () => {
    const dress = await createRecord();
    sessionStorage.setItem(
      `dress-note:recall-draft:${dress.id}`,
      JSON.stringify({
        revision: "interrupted-write",
        values: {
          memoryCue: "등 뒤 리본",
          likedReason: "허리가 편함",
          concern: "마지막 입력",
        },
      }),
    );
    const hook = renderHook(() =>
      useDressEditorDraft({
        dressId: dress.id,
        dress,
        face: undefined,
        onSaveStatus,
      }),
    );
    await waitFor(async () =>
      expect(await db.dresses.get(dress.id)).toMatchObject({
        memoryCue: "등 뒤 리본",
        concern: "마지막 입력",
      }),
    );
    expect(hook.result.current.recall.concern).toBe("마지막 입력");
    hook.unmount();
  });
});
