import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "../../db/database";
import {
  addDress,
  addDressStylingVariant,
  addShop,
  createTour,
  patchDressLook,
} from "../../db/repositories";
import { resolveDressLook } from "../../lib/dress/styling";
import {
  queueRecallDraft,
  readRecallDraft,
} from "../../lib/storage/recallDraft";
import {
  DEFAULT_FACE_TRANSFORM,
  type Dress,
  type LocalAsset,
} from "../../types/domain";
import { useDressEditorDraft } from "./useDressEditorDraft";

const onSaveStatus = () => undefined;
function deferred() {
  let resolve: () => void = () => undefined;
  let reject: (reason: Error) => void = () => undefined;
  const promise = new Promise<void>((accept, decline) => {
    resolve = accept;
    reject = decline;
  });
  return { promise, resolve, reject };
}
afterEach(async () => {
  vi.useRealTimers();
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
      expect(writeDress).toHaveBeenCalledWith(dress.id, {
        memoryCue: dress.memoryCue,
        likedReason: dress.likedReason,
        concern: dress.concern,
        memo: "새 메모",
      }),
    );
    expect(statuses.at(-1)).toBe("saving");
    expect(readRecallDraft(dress.id)?.values.memo).toBe("새 메모");

    write.resolve();
    await waitFor(() => expect(statuses.at(-1)).toBe("saved"));
    expect(readRecallDraft(dress.id)).toBeUndefined();
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
    expect(writeDress).toHaveBeenCalledWith(dress.id, {
      memoryCue: dress.memoryCue,
      likedReason: dress.likedReason,
      concern: dress.concern,
      memo: "실패할 메모",
    });
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

  it("keeps the latest memo when immediately unmounting after recovering an older memo", async () => {
    const dress = await createRecord();
    queueRecallDraft(dress.id, {
      memoryCue: "복구한 특징",
      likedReason: "복구한 장점",
      concern: "복구한 아쉬움",
      memo: "복구 메모 A",
    });
    const hook = renderHook(() =>
      useDressEditorDraft({
        dressId: dress.id,
        dress,
        face: undefined,
        onSaveStatus,
      }),
    );
    expect(hook.result.current.memo).toBe("복구 메모 A");
    act(() => hook.result.current.setMemo("마지막 글자까지 메모 B"));
    hook.unmount();
    await waitFor(async () => {
      expect(await db.dresses.get(dress.id)).toMatchObject({
        memoryCue: "복구한 특징",
        likedReason: "복구한 장점",
        concern: "복구한 아쉬움",
        memo: "마지막 글자까지 메모 B",
      });
    });
  });

  it("commits a failed recall edit with the following memo before acknowledging their recovery snapshot", async () => {
    const dress = await createRecord();
    let rejectFirst = true;
    const writes: Promise<void>[] = [];
    const writeDress = vi.fn((id: string, patch: Partial<Dress>) => {
      const write = rejectFirst
        ? Promise.reject(new Error("회상 메모 저장 실패"))
        : patchDressLook(id, "base", patch);
      rejectFirst = false;
      writes.push(write);
      return write;
    });
    const statuses = vi.fn();
    const hook = renderHook(() =>
      useDressEditorDraft({
        dressId: dress.id,
        dress,
        face: undefined,
        onSaveStatus: statuses,
        writeDress,
      }),
    );
    act(() =>
      hook.result.current.updateRecall("memoryCue", "저장 실패했던 특징 B"),
    );
    await waitFor(() => expect(statuses).toHaveBeenLastCalledWith("error"));
    expect((await db.dresses.get(dress.id))?.memoryCue).toBe("처음 기록");
    expect(readRecallDraft(dress.id)?.values.memoryCue).toBe(
      "저장 실패했던 특징 B",
    );
    act(() => hook.result.current.setMemo("나중에 편집한 메모 C"));
    await waitFor(async () => {
      expect(statuses).toHaveBeenLastCalledWith("saved");
      expect(await db.dresses.get(dress.id)).toMatchObject({
        memoryCue: "저장 실패했던 특징 B",
        likedReason: "허리가 편함",
        concern: "무거움",
        memo: "나중에 편집한 메모 C",
      });
      expect(readRecallDraft(dress.id)).toBeUndefined();
    });
    hook.unmount();
    await Promise.allSettled(writes);
  });

  it("recovers additional-look drafts without reading or acknowledging the base-look key", async () => {
    const base = await createRecord();
    const lookId = await addDressStylingVariant(base.id);
    const record = (await db.dresses.get(base.id))!;
    queueRecallDraft(base.id, {
      memoryCue: "기본 연출 임시 특징",
      likedReason: "기본 장점",
      concern: "기본 아쉬움",
      memo: "기본 연출 임시 메모",
    });
    queueRecallDraft(
      base.id,
      {
        memoryCue: "추가 연출 임시 특징",
        likedReason: "어깨 천이 마음에 듦",
        concern: "팔 움직임 확인",
        memo: "추가 연출 임시 메모",
      },
      lookId,
    );
    const writes: Promise<void>[] = [];
    const writeDress = (id: string, patch: Partial<Dress>) => {
      const write = patchDressLook(id, lookId, patch);
      writes.push(write);
      return write;
    };
    const hook = renderHook(() =>
      useDressEditorDraft({
        dressId: base.id,
        stylingId: lookId,
        dress: resolveDressLook(record, lookId),
        face: undefined,
        onSaveStatus,
        writeDress,
      }),
    );
    await waitFor(async () => {
      const saved = (await db.dresses.get(base.id))!;
      expect(resolveDressLook(saved, lookId)).toMatchObject({
        memoryCue: "추가 연출 임시 특징",
        likedReason: "어깨 천이 마음에 듦",
        concern: "팔 움직임 확인",
        memo: "추가 연출 임시 메모",
      });
      expect(saved.memoryCue).toBe("처음 기록");
      expect(readRecallDraft(base.id, lookId)).toBeUndefined();
    });
    expect(readRecallDraft(base.id)?.values.memo).toBe("기본 연출 임시 메모");
    hook.unmount();
    await Promise.all(writes);
  });

  it.each(["resolve", "reject"] as const)(
    "ignores an old look's late %s response after a new look has mounted",
    async (outcome) => {
      const dress = await createRecord();
      const oldWrite = deferred();
      const nextWrite = deferred();
      const statuses = vi.fn();
      const writeOld = vi.fn(() => oldWrite.promise);
      const writeNext = vi.fn(() => nextWrite.promise);
      queueRecallDraft(dress.id, {
        memoryCue: "이전 연출 복구",
        likedReason: "이전 장점",
        concern: "이전 아쉬움",
        memo: "이전 메모",
      });
      queueRecallDraft(
        dress.id,
        {
          memoryCue: "지금 연출 복구",
          likedReason: "지금 장점",
          concern: "지금 아쉬움",
          memo: "지금 메모",
        },
        "next-look",
      );
      const oldHook = renderHook(() =>
        useDressEditorDraft({
          dressId: dress.id,
          dress,
          face: undefined,
          onSaveStatus: statuses,
          writeDress: writeOld,
        }),
      );
      oldHook.unmount();
      const currentHook = renderHook(() =>
        useDressEditorDraft({
          dressId: dress.id,
          stylingId: "next-look",
          dress,
          face: undefined,
          onSaveStatus: statuses,
          writeDress: writeNext,
        }),
      );
      expect(statuses).toHaveBeenLastCalledWith("saving");
      statuses.mockClear();
      await act(async () => {
        if (outcome === "resolve") oldWrite.resolve();
        else oldWrite.reject(new Error("이전 연출 저장 실패"));
        await oldWrite.promise.catch(() => undefined);
      });
      expect(statuses).not.toHaveBeenCalled();
      expect(currentHook.result.current.recall.memoryCue).toBe(
        "지금 연출 복구",
      );
      expect(currentHook.result.current.memo).toBe("지금 메모");
      expect(readRecallDraft(dress.id, "next-look")?.values.memo).toBe(
        "지금 메모",
      );
      await act(async () => {
        nextWrite.resolve();
        await nextWrite.promise;
      });
      expect(statuses).toHaveBeenLastCalledWith("saved");
      expect(readRecallDraft(dress.id, "next-look")).toBeUndefined();
      currentHook.unmount();
    },
  );

  it("does not restore stale face transforms after the face asset is removed", async () => {
    const saved = await createRecord();
    const face: LocalAsset = {
      id: "face-original",
      tourId: saved.tourId,
      kind: "face",
      mimeType: "image/webp",
      blob: new Blob(["face"], { type: "image/webp" }),
      width: 100,
      height: 100,
      byteLength: 4,
      sha256: "0".repeat(64),
      createdAt: saved.createdAt,
    };
    const withFace: Dress = {
      ...saved,
      faceTransform: { x: 0.2, y: 0.1, scale: 1.5, rotation: 4 },
    };
    const writeDress = vi.fn(
      async (_id: string, _patch: Partial<Dress>) => undefined,
    );
    vi.useFakeTimers();
    const hook = renderHook(
      (props: { dress: Dress; face?: LocalAsset }) =>
        useDressEditorDraft({
          dressId: saved.id,
          dress: props.dress,
          face: props.face,
          onSaveStatus,
          writeDress,
        }),
      {
        initialProps: { dress: withFace, face: face as LocalAsset | undefined },
      },
    );
    expect(hook.result.current.transform).toEqual(withFace.faceTransform);
    act(() => hook.result.current.updateTransform({ x: 0.4 }));
    hook.rerender({
      dress: { ...saved, faceTransform: undefined },
      face: undefined,
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(500);
    });
    expect(hook.result.current.transform).toEqual(DEFAULT_FACE_TRANSFORM);
    expect(hook.result.current.latestTransform.current).toEqual(
      DEFAULT_FACE_TRANSFORM,
    );
    expect(hook.result.current.hasFace.current).toBe(false);
    expect(writeDress).not.toHaveBeenCalled();
    hook.unmount();
    expect(writeDress).toHaveBeenCalledTimes(1);
    expect(writeDress.mock.calls[0]?.[1]).not.toHaveProperty("faceTransform");
  });
});
