import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDress,
  patchDressLook,
  removeDressStylingVariant,
  renameDressStylingVariant,
  setPreferredStylingVariant,
} from "../../db/repositories";
import { getDressLooks } from "../../lib/dress/styling";
import { registerBeforeAppUpdate } from "../../lib/storage/beforeAppUpdate";
import {
  acknowledgeRecallDraft,
  readRecallDraft,
  removeRecallDraft,
} from "../../lib/storage/recallDraft";
import { useUIStore, type SaveStatus } from "../../stores/uiStore";
import {
  type Dress,
  type DressOptionCategory,
  type SketchStroke,
} from "../../types/domain";
import { useDressEditorDraft } from "./useDressEditorDraft";
import { usePendingWrites } from "./usePendingWrites";

function patchKeys(patch: Partial<Dress>) {
  return Object.keys(patch).flatMap((key) =>
    key === "customOptions"
      ? Object.keys(patch.customOptions ?? {}).map(
          (category) => "customOptions." + category,
        )
      : [key],
  );
}

export function useDressEditorSession(dress: Dress, lookId: string) {
  const navigate = useNavigate();
  const setSave = useUIStore((state) => state.setSaveStatus);
  const toast = useUIStore((state) => state.showToast);
  const { run, waitForPending, hasPending } = usePendingWrites();
  const active = useRef(true);
  const operation = useRef(false);
  const failed = useRef(new Map<string, Partial<Dress>>());
  const nameKey = `dress-note:recall-draft:${dress.id}:look:${lookId}:name`;
  const savedName =
    getDressLooks(dress).find((look) => look.id === lookId)?.label ??
    "기본 연출";
  const [lookName, setLookName] = useState(() => {
    try {
      return lookId === "base"
        ? savedName
        : (sessionStorage.getItem(nameKey)?.slice(0, 30) ?? savedName);
    } catch {
      return savedName;
    }
  });
  const latestName = useRef(lookName);
  const persistedName = useRef(savedName);
  const nameFailed = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const reportStatus = useCallback(
    (status: SaveStatus) => {
      if (active.current)
        setSave(
          failed.current.size || nameFailed.current
            ? "error"
            : status === "saved" && hasPending()
              ? "saving"
              : status,
        );
    },
    [setSave, hasPending],
  );
  const writeDress = useCallback(
    async (id: string, patch: Partial<Dress>) => {
      reportStatus("saving");
      try {
        await run(() => patchDressLook(id, lookId, patch));
        patchKeys(patch).forEach((key) => failed.current.delete(key));
        reportStatus("saved");
        if (active.current && !failed.current.size) setError("");
      } catch (cause) {
        for (const key of patchKeys(patch)) {
          if (key.startsWith("customOptions.")) {
            const category = key.slice(
              "customOptions.".length,
            ) as DressOptionCategory;
            failed.current.set(key, {
              customOptions: { [category]: patch.customOptions?.[category] },
            });
          } else {
            failed.current.set(key, { [key]: patch[key as keyof Dress] });
          }
        }
        reportStatus("error");
        if (active.current)
          setError("저장하지 못했어요. 입력을 유지했으니 다시 시도해 주세요.");
        throw cause;
      }
    },
    [lookId, reportStatus, run],
  );

  const draft = useDressEditorDraft({
    dressId: dress.id,
    stylingId: lookId,
    dress,
    face: undefined,
    onSaveStatus: reportStatus,
    writeDress,
  });
  const [pendingChoices, setPendingChoices] = useState<Partial<Dress>[]>([]);
  const visibleDress = useMemo(
    () =>
      pendingChoices.reduce<Dress>(
        (current, patch) => ({
          ...current,
          ...patch,
          customOptions: patch.customOptions
            ? { ...current.customOptions, ...patch.customOptions }
            : current.customOptions,
        }),
        dress,
      ),
    [dress, pendingChoices],
  );

  const persist = async (patch: Partial<Dress>) => {
    setPendingChoices((current) => [...current, patch]);
    try {
      await writeDress(dress.id, patch);
    } finally {
      setPendingChoices((current) =>
        current.filter((choice) => choice !== patch),
      );
    }
  };
  const safelyPersist = async (patch: Partial<Dress>) => {
    try {
      await persist(patch);
    } catch {
      /* Retained by writeDress for explicit retry. */
    }
  };
  const saveDraft = async () => {
    const pending = readRecallDraft(dress.id, lookId);
    await writeDress(dress.id, {
      ...draft.latestRecall.current,
      memo: draft.latestMemo.current,
      label: draft.latestLabel.current.trim() || dress.label,
    });
    if (pending) acknowledgeRecallDraft(dress.id, pending.revision, lookId);
  };
  const saveLookName = async () => {
    if (
      lookId === "base" ||
      (latestName.current === persistedName.current &&
        !nameFailed.current &&
        !hasPending())
    )
      return;
    const value = latestName.current;
    if (!value.trim()) {
      nameFailed.current = true;
      reportStatus("error");
      if (active.current) setError("연출 이름을 입력해 주세요.");
      throw new Error("연출 이름을 입력해 주세요.");
    }
    reportStatus("saving");
    try {
      await run(() => renameDressStylingVariant(dress.id, lookId, value));
      persistedName.current = value;
      if (latestName.current === value) {
        nameFailed.current = false;
        try {
          if (active.current && sessionStorage.getItem(nameKey) === value)
            sessionStorage.removeItem(nameKey);
        } catch {
          /* Storage can be unavailable. */
        }
        if (active.current && !failed.current.size) setError("");
      }
      reportStatus("saved");
    } catch (cause) {
      nameFailed.current = true;
      reportStatus("error");
      if (active.current)
        setError(
          "연출 이름을 저장하지 못했어요. 입력을 유지했으니 다시 시도해 주세요.",
        );
      throw cause;
    }
  };
  const changeLookName = (value: string) => {
    latestName.current = value;
    setLookName(value);
    try {
      sessionStorage.setItem(nameKey, value);
    } catch {
      /* Keep the in-memory draft. */
    }
    void saveLookName().catch(() => undefined);
  };
  const flush = async () => {
    await waitForPending();
    await saveDraft();
    await saveLookName();
    await waitForPending();
    if (failed.current.size)
      throw new Error("이전 선택을 아직 저장하지 못했어요.");
  };
  const recordUrl = (targetLook = lookId, mode = "record") =>
    "/tour/" +
    dress.tourId +
    "/dress/" +
    dress.id +
    "?view=" +
    mode +
    "&look=" +
    encodeURIComponent(targetLook);
  const nav = (to: string, options?: { replace?: boolean }) => {
    if (active.current) void navigate(to, options);
  };
  const act = async (action: () => Promise<void>) => {
    if (operation.current) return;
    operation.current = true;
    setBusy(true);
    try {
      await action();
      if (active.current) setError("");
    } catch (cause) {
      if (active.current) {
        setError(
          cause instanceof Error
            ? cause.message
            : "저장하지 못했어요. 다시 시도해 주세요.",
        );
      }
      throw cause;
    } finally {
      operation.current = false;
      if (active.current) setBusy(false);
    }
  };
  const safeAction = (action: () => Promise<void>) => {
    void act(action).catch(() => undefined);
  };
  const complete = async () => {
    await flush();
    if (!dress.coreRecordedAt)
      await writeDress(dress.id, { coreRecordedAt: new Date().toISOString() });
  };
  const finishAndView = () =>
    act(async () => {
      await complete();
      nav(recordUrl(), { replace: true });
      toast("기록을 완료했어요.");
    });
  const nextDress = () =>
    act(async () => {
      await complete();
      const next = await run(() => addDress(dress.shopId));
      nav("/tour/" + dress.tourId + "/dress/" + next, { replace: true });
    });
  const switchLook = (id: string) =>
    safeAction(async () => {
      await flush();
      nav(recordUrl(id), { replace: true });
    });
  const deleteLook = () =>
    safeAction(async () => {
      await flush();
      await run(() => removeDressStylingVariant(dress.id, lookId));
      removeRecallDraft(dress.id, lookId);
      try {
        sessionStorage.removeItem(nameKey);
      } catch {
        /* No recovery entry to remove. */
      }
      nav(recordUrl("base"), { replace: true });
    });
  const preferLook = () =>
    safeAction(async () => {
      await flush();
      await run(() => setPreferredStylingVariant(dress.id, lookId));
      toast("대표 연출로 선택했어요.");
    });
  const retry = () =>
    safeAction(async () => {
      await waitForPending().catch(() => undefined);
      const patch: Partial<Dress> = {};
      for (const pending of new Set(failed.current.values())) {
        const notes = { ...patch.customOptions, ...pending.customOptions };
        Object.assign(patch, pending);
        if (pending.customOptions) patch.customOptions = notes;
      }
      if (Object.keys(patch).length) await persist(patch);
      await flush();
    });
  const goBack = async () => {
    await act(async () => {
      await flush();
      nav("/tour/" + dress.tourId + "/shop/" + dress.shopId);
    }).catch(() => undefined);
  };
  const saveCustomOption = (category: DressOptionCategory, value: string) =>
    void safelyPersist({ customOptions: { [category]: value || undefined } });

  const latestNameSave = useRef(saveLookName);
  latestNameSave.current = saveLookName;
  useEffect(() => {
    void latestNameSave.current().catch(() => undefined);
  }, []);
  const latestFlush = useRef(flush);
  latestFlush.current = flush;
  useEffect(
    () =>
      registerBeforeAppUpdate(async () => {
        if (operation.current)
          throw new Error("진행 중인 작업이 끝나면 업데이트해 주세요.");
        await latestFlush.current();
      }),
    [],
  );

  return {
    dress: visibleDress,
    pendingChoices,
    draft,
    lookName,
    changeLookName,
    saveLookName,
    busy,
    error,
    persist,
    safelyPersist,
    // The drawing dialog owns save, retry and cancellation for its explicit draft.
    saveSketch: (strokes: SketchStroke[]) =>
      run(() =>
        patchDressLook(dress.id, lookId, {
          sketchStrokes: strokes.length ? strokes : undefined,
        }),
      ),
    saveDraft,
    flush,
    act,
    safeAction,
    recordUrl,
    finishAndView,
    nextDress,
    switchLook,
    deleteLook,
    preferLook,
    retry,
    goBack,
    saveCustomOption,
  };
}
