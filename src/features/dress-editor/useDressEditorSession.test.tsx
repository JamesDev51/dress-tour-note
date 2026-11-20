import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "../../db/database";
import * as repository from "../../db/repositories";
import { readRecallDraft } from "../../lib/storage/recallDraft";
import { resolveDressLook } from "../../lib/dress/styling";
import { useDressEditorSession } from "./useDressEditorSession";
import { flushBeforeAppUpdate } from "../../lib/storage/beforeAppUpdate";
import { useUIStore } from "../../stores/uiStore";

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));
beforeEach(() => navigate.mockReset());
afterEach(async () => {
  vi.restoreAllMocks();
  sessionStorage.clear();
  await db.delete();
  await db.open();
});
async function setup() {
  const tour = await repository.createTour({ title: "연출별 저장" });
  const shop = await repository.addShop(tour, { name: "샵" });
  const id = await repository.addDress(shop);
  return (await db.dresses.get(id))!;
}
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((accept) => {
    resolve = accept;
  });
  return { promise, resolve };
}

describe("editor save and navigation coordinator", () => {
  it("persists a pending lower material start before immediately leaving the editor", async () => {
    const base = await setup();
    await repository.patchDressLook(base.id, "base", {
      upperFabric: "lace",
      lowerFabric: "organzaChiffon",
    });
    const dress = (await db.dresses.get(base.id))!;
    const gate = deferred();
    const original = repository.patchDressLook;
    vi.spyOn(repository, "patchDressLook").mockImplementationOnce(
      async (...args) => {
        await gate.promise;
        await original(...args);
      },
    );
    const hook = renderHook(() => useDressEditorSession(dress, "base"));
    let save!: Promise<void>;
    let back!: Promise<void>;
    act(() => {
      save = hook.result.current.persist({ lowerFabricStart: "knee" });
      back = hook.result.current.goBack();
    });
    expect(navigate).not.toHaveBeenCalled();
    await act(async () => {
      gate.resolve();
      await Promise.all([save, back]);
    });
    expect((await db.dresses.get(dress.id))?.lowerFabricStart).toBe("knee");
    expect(navigate).toHaveBeenCalledWith(
      `/tour/${dress.tourId}/shop/${dress.shopId}`,
      undefined,
    );
    hook.unmount();
  });
  it("keeps newer toggles and independent note fields visible when an earlier write fails", async () => {
    const dress = await setup();
    const first = deferred();
    const next = deferred();
    const write = repository.patchDressLook;
    vi.spyOn(repository, "patchDressLook")
      .mockImplementationOnce(async () => {
        await first.promise;
        throw new Error("공간 부족");
      })
      .mockImplementationOnce(async (...args) => {
        await next.promise;
        await write(...args);
      });
    const hook = renderHook(() => useDressEditorSession(dress, "base"));
    let older!: Promise<void>;
    let newer!: Promise<void>;
    act(() => {
      older = hook.result.current.safelyPersist({
        details: ["pearl"],
        customOptions: { details: "진주" },
      });
      newer = hook.result.current.persist({
        details: [],
        isFavorite: true,
        customOptions: { neckline: "넓게" },
      });
    });
    expect(hook.result.current.dress.customOptions).toEqual({
      details: "진주",
      neckline: "넓게",
    });
    expect(hook.result.current.dress.details).toEqual([]);
    await act(async () => {
      first.resolve();
      await older;
    });
    expect(hook.result.current.dress.customOptions).toEqual({
      neckline: "넓게",
    });
    expect(hook.result.current.dress.isFavorite).toBe(true);
    await act(async () => {
      next.resolve();
      await newer;
    });
    expect((await db.dresses.get(dress.id))?.isFavorite).toBe(true);
    hook.unmount();
  });

  it("does not report saved while a newer selection is still pending", async () => {
    const dress = await setup();
    const first = deferred();
    const second = deferred();
    const original = repository.patchDressLook;
    vi.spyOn(repository, "patchDressLook")
      .mockImplementationOnce(async (...args) => {
        await first.promise;
        await original(...args);
      })
      .mockImplementationOnce(async (...args) => {
        await second.promise;
        await original(...args);
      });
    const hook = renderHook(() => useDressEditorSession(dress, "base"));
    let older!: Promise<void>;
    let newer!: Promise<void>;
    act(() => {
      older = hook.result.current.persist({ fabric: "lace" });
      newer = hook.result.current.persist({ fabric: "tulle" });
    });
    await act(async () => {
      first.resolve();
      await older;
    });
    expect(useUIStore.getState().saveStatus).toBe("saving");
    await act(async () => {
      second.resolve();
      await newer;
    });
    expect(useUIStore.getState().saveStatus).toBe("saved");
    expect((await db.dresses.get(dress.id))?.fabric).toBe("tulle");
    hook.unmount();
  });

  it("does not navigate back into an editor after its late completion", async () => {
    const dress = await setup();
    const gate = deferred();
    const original = repository.patchDressLook;
    vi.spyOn(repository, "patchDressLook").mockImplementationOnce(
      async (...args) => {
        await gate.promise;
        await original(...args);
      },
    );
    const hook = renderHook(() => useDressEditorSession(dress, "base"));
    let completion!: Promise<void>;
    act(() => {
      completion = hook.result.current.finishAndView();
    });
    hook.unmount();
    await act(async () => {
      gate.resolve();
      await completion;
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it("completes an unknown dress without requiring favorite, rating or notes", async () => {
    const dress = await setup();
    const hook = renderHook(() => useDressEditorSession(dress, "base"));
    await act(() => hook.result.current.finishAndView());
    const saved = (await db.dresses.get(dress.id))!;
    expect(saved.coreRecordedAt).toBeTruthy();
    expect(saved.isFavorite).toBe(false);
    expect(saved.rating).toBeUndefined();
    expect(saved.memo).toBe("");
    expect(navigate).toHaveBeenCalledWith(
      expect.stringContaining("view=record&look=base"),
      { replace: true },
    );
    hook.unmount();
  });

  it("flushes the last memo and recall character before switching looks", async () => {
    const dress = await setup();
    const other = await repository.addDressStylingVariant(dress.id);
    const hook = renderHook(() => useDressEditorSession(dress, "base"));
    act(() => {
      hook.result.current.draft.setMemo("바로 전환하는 메모");
      hook.result.current.draft.updateRecall("memoryCue", "마지막 글자");
      hook.result.current.switchLook(other);
    });
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const saved = (await db.dresses.get(dress.id))!;
    expect(saved.memo).toBe("바로 전환하는 메모");
    expect(saved.memoryCue).toBe("마지막 글자");
    expect(resolveDressLook(saved, other).memo).toBe("");
    expect(readRecallDraft(dress.id)).toBeUndefined();
    hook.unmount();
  });

  it("waits for a pending appearance write before moving to the next dress", async () => {
    const dress = await setup();
    const gate = deferred();
    const original = repository.patchDressLook;
    vi.spyOn(repository, "patchDressLook").mockImplementationOnce(
      async (...args) => {
        await gate.promise;
        await original(...args);
      },
    );
    const hook = renderHook(() => useDressEditorSession(dress, "base"));
    let save!: Promise<void>;
    act(() => {
      save = hook.result.current.persist({
        topStyle: "offShoulder",
        neckline: "sweetheart",
      });
      void hook.result.current.nextDress();
    });
    expect(navigate).not.toHaveBeenCalled();
    await act(async () => {
      gate.resolve();
      await save;
    });
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    const saved = (await db.dresses.get(dress.id))!;
    expect(saved.stylingVariants ?? []).toHaveLength(0);
    expect(saved).toMatchObject({
      topStyle: "offShoulder",
      neckline: "sweetheart",
      memo: "",
    });
    hook.unmount();
  });

  it("keeps failed selections and retries only fields not superseded by a later save", async () => {
    const dress = await setup();
    vi.spyOn(repository, "patchDressLook").mockRejectedValueOnce(
      new Error("공간 부족"),
    );
    const hook = renderHook(() => useDressEditorSession(dress, "base"));
    await act(() =>
      hook.result.current.safelyPersist({
        topStyle: "offShoulder",
        neckline: "sweetheart",
      }),
    );
    expect(hook.result.current.error).toBeTruthy();
    await act(() => hook.result.current.persist({ topStyle: "longSleeve" }));
    await act(async () => {
      await expect(hook.result.current.finishAndView()).rejects.toThrow();
    });
    expect(navigate).not.toHaveBeenCalled();
    act(() => hook.result.current.retry());
    await waitFor(() => expect(hook.result.current.error).toBe(""));
    expect(await db.dresses.get(dress.id)).toMatchObject({
      topStyle: "longSleeve",
      neckline: "sweetheart",
    });
    hook.unmount();
  });

  it("does not create two dresses on duplicate clicks and retries creation without losing the current one", async () => {
    const dress = await setup();
    const hook = renderHook(() => useDressEditorSession(dress, "base"));
    const add = vi
      .spyOn(repository, "addDress")
      .mockRejectedValueOnce(new Error("생성 실패"));
    await act(async () => {
      await expect(hook.result.current.nextDress()).rejects.toThrow(
        "생성 실패",
      );
    });
    expect((await db.dresses.get(dress.id))?.coreRecordedAt).toBeTruthy();
    expect(navigate).not.toHaveBeenCalled();
    await act(async () => {
      await Promise.all([
        hook.result.current.nextDress(),
        hook.result.current.nextDress(),
      ]);
    });
    expect(add).toHaveBeenCalledTimes(2);
    expect(await db.dresses.count()).toBe(2);
    hook.unmount();
  });
});

describe("styling name autosave and update safety", () => {
  it("waits for the final name save before switching to another look", async () => {
    const base = await setup();
    const id = await repository.addDressStylingVariant(base.id);
    const dress = resolveDressLook((await db.dresses.get(base.id))!, id);
    const gate = deferred();
    const original = repository.renameDressStylingVariant;
    vi.spyOn(repository, "renameDressStylingVariant").mockImplementationOnce(
      async (...args) => {
        await gate.promise;
        await original(...args);
      },
    );
    const hook = renderHook(() => useDressEditorSession(dress, id));
    act(() => {
      hook.result.current.changeLookName("어깨를 감싼 연출");
      hook.result.current.switchLook("base");
    });
    expect(navigate).not.toHaveBeenCalled();
    await act(async () => gate.resolve());
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    expect((await db.dresses.get(base.id))?.stylingVariants?.[0].label).toBe(
      "어깨를 감싼 연출",
    );
    expect(navigate).toHaveBeenCalledWith(
      `/tour/${dress.tourId}/dress/${dress.id}?view=record&look=base`,
      { replace: true },
    );
    hook.unmount();
  });
  it("persists reverting a name while the preceding rename is still pending", async () => {
    const base = await setup();
    const id = await repository.addDressStylingVariant(base.id);
    const dress = resolveDressLook((await db.dresses.get(base.id))!, id);
    const gate = deferred();
    const original = repository.renameDressStylingVariant;
    vi.spyOn(repository, "renameDressStylingVariant").mockImplementationOnce(
      async (...args) => {
        await gate.promise;
        await original(...args);
      },
    );
    const hook = renderHook(() => useDressEditorSession(dress, id));
    const originalName = hook.result.current.lookName;
    act(() => {
      hook.result.current.changeLookName("바꿨다가");
      hook.result.current.changeLookName(originalName);
    });
    await act(async () => {
      gate.resolve();
    });
    await waitFor(() => expect(useUIStore.getState().saveStatus).toBe("saved"));
    expect((await db.dresses.get(base.id))?.stylingVariants?.[0].label).toBe(
      originalName,
    );
    expect(
      sessionStorage.getItem(
        `dress-note:recall-draft:${base.id}:look:${id}:name`,
      ),
    ).toBeNull();
    hook.unmount();
  });
  it("preserves a failed name draft and blocks navigation until retry succeeds", async () => {
    const base = await setup();
    const id = await repository.addDressStylingVariant(base.id);
    const dress = resolveDressLook((await db.dresses.get(base.id))!, id);
    const save = vi
      .spyOn(repository, "renameDressStylingVariant")
      .mockRejectedValue(new Error("이름 저장 실패"));
    const hook = renderHook(() => useDressEditorSession(dress, id));
    act(() => hook.result.current.changeLookName("긴 소매 마지막"));
    await waitFor(() => expect(hook.result.current.error).not.toBe(""));
    await act(async () => {
      await expect(hook.result.current.flush()).rejects.toThrow();
    });
    expect(hook.result.current.lookName).toBe("긴 소매 마지막");
    expect(
      sessionStorage.getItem(
        `dress-note:recall-draft:${base.id}:look:${id}:name`,
      ),
    ).toBe("긴 소매 마지막");
    expect(navigate).not.toHaveBeenCalled();
    save.mockRestore();
    act(() => hook.result.current.retry());
    await waitFor(() => expect(hook.result.current.error).toBe(""));
    expect((await db.dresses.get(base.id))?.stylingVariants?.[0].label).toBe(
      "긴 소매 마지막",
    );
    hook.unmount();
  });
  it("flushes pending text before an app update and refuses an update on failed saves", async () => {
    const dress = await setup();
    const hook = renderHook(() => useDressEditorSession(dress, "base"));
    act(() => hook.result.current.draft.setMemo("업데이트 직전 마지막 글자"));
    await act(() => flushBeforeAppUpdate());
    expect((await db.dresses.get(dress.id))?.memo).toBe(
      "업데이트 직전 마지막 글자",
    );
    vi.spyOn(repository, "patchDressLook").mockRejectedValue(
      new Error("저장 실패"),
    );
    await act(async () => {
      await expect(flushBeforeAppUpdate()).rejects.toThrow("저장 실패");
    });
    hook.unmount();
  });
});
