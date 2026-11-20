import { useCallback, useEffect, useRef, useState } from "react";
import {
  acknowledgeRecallDraft,
  queueRecallDraft,
  readRecallDraft,
} from "../../lib/storage/recallDraft";
import { patchDress } from "../../db/repositories";
import {
  DEFAULT_FACE_TRANSFORM,
  type Dress,
  type FaceTransform,
  type LocalAsset,
} from "../../types/domain";
import type { RecallDraft, RecallKey } from "./DressRecallNotes";
import type { SaveStatus } from "../../stores/uiStore";

const defaultWrite = (id: string, patch: Partial<Dress>) =>
  patchDress(id, patch);

export function useDressEditorDraft({
  dressId,
  stylingId = "base",
  dress,
  face,
  onSaveStatus,
  writeDress = defaultWrite,
}: {
  dressId: string;
  stylingId?: string;
  dress: Dress | undefined;
  face: LocalAsset | undefined;
  onSaveStatus: (status: SaveStatus) => void;
  writeDress?: (dressId: string, patch: Partial<Dress>) => Promise<void>;
}) {
  const identity = `${dressId}:${stylingId}`;
  const activeIdentity = useRef(identity);
  useEffect(() => {
    activeIdentity.current = identity;
    return () => {
      activeIdentity.current = "";
    };
  }, [identity]);
  const reportSaveStatus = useCallback(
    (status: SaveStatus) => {
      if (activeIdentity.current === identity) onSaveStatus(status);
    },
    [identity, onSaveStatus],
  );
  const [recall, setRecall] = useState<RecallDraft>({
    memoryCue: "",
    likedReason: "",
    concern: "",
  });
  const latestRecall = useRef(recall);
  const [memo, setMemo] = useState("");
  const [label, setLabel] = useState("");
  const [transform, setTransform] = useState<FaceTransform>(
    DEFAULT_FACE_TRANSFORM,
  );
  const initialized = useRef("");
  const latestMemo = useRef("");
  const latestLabel = useRef("");
  const latestTransform = useRef<FaceTransform>(DEFAULT_FACE_TRANSFORM);
  const hasFace = useRef(false);
  const previousFaceId = useRef(face?.id);
  const [hydratedDressId, setHydratedDressId] = useState("");

  useEffect(() => {
    if (dress && initialized.current !== identity) {
      initialized.current = identity;
      const pendingRecall = readRecallDraft(dress.id, stylingId);
      const initialRecall = {
        memoryCue: pendingRecall?.values.memoryCue ?? dress.memoryCue ?? "",
        likedReason:
          pendingRecall?.values.likedReason ?? dress.likedReason ?? "",
        concern: pendingRecall?.values.concern ?? dress.concern ?? "",
      };
      latestRecall.current = initialRecall;
      setRecall(initialRecall);
      if (pendingRecall) {
        reportSaveStatus("saving");
        void writeDress(dress.id, pendingRecall.values).then(
          () => {
            acknowledgeRecallDraft(dress.id, pendingRecall.revision, stylingId);
            reportSaveStatus("saved");
          },
          () => reportSaveStatus("error"),
        );
      } else reportSaveStatus("saved");
      latestMemo.current = pendingRecall?.values.memo ?? dress.memo;
      latestLabel.current = dress.label;
      latestTransform.current = dress.faceTransform ?? DEFAULT_FACE_TRANSFORM;
      setMemo(latestMemo.current);
      setLabel(dress.label);
      setTransform(latestTransform.current);
      setHydratedDressId(identity);
    }
    hasFace.current = Boolean(face);
    if (previousFaceId.current !== face?.id) {
      previousFaceId.current = face?.id;
      latestTransform.current = dress?.faceTransform ?? DEFAULT_FACE_TRANSFORM;
      setTransform(latestTransform.current);
    }
  }, [dress, face, identity, stylingId, reportSaveStatus, writeDress]);

  useEffect(() => {
    if (!dress || hydratedDressId !== identity || memo === dress.memo) return;
    reportSaveStatus("saving");
    const timeout = window.setTimeout(async () => {
      const pending = readRecallDraft(dressId, stylingId);
      try {
        await writeDress(dressId, {
          ...(pending?.values ?? latestRecall.current),
          memo,
        });
        if (pending?.values.memo === memo)
          acknowledgeRecallDraft(dressId, pending.revision, stylingId);
        reportSaveStatus("saved");
      } catch {
        reportSaveStatus("error");
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [
    memo,
    dressId,
    dress?.memo,
    identity,
    stylingId,
    hydratedDressId,
    reportSaveStatus,
    writeDress,
  ]);

  useEffect(() => {
    if (!dress || !face || !hasFace.current || hydratedDressId !== identity)
      return;
    const current = dress.faceTransform ?? DEFAULT_FACE_TRANSFORM;
    if (JSON.stringify(transform) === JSON.stringify(current)) return;
    const timeout = window.setTimeout(async () => {
      try {
        await writeDress(dressId, { faceTransform: transform });
        reportSaveStatus("saved");
      } catch {
        reportSaveStatus("error");
      }
    }, 220);
    return () => clearTimeout(timeout);
  }, [
    transform,
    dressId,
    dress,
    face,
    identity,
    hydratedDressId,
    reportSaveStatus,
    writeDress,
  ]);

  useEffect(
    () => () => {
      if (initialized.current !== identity) return;
      const finalLabel = latestLabel.current.trim();
      const patch: Partial<Dress> = {
        ...latestRecall.current,
        memo: latestMemo.current,
      };
      if (finalLabel) patch.label = finalLabel;
      if (hasFace.current) patch.faceTransform = latestTransform.current;
      void writeDress(dressId, patch).catch(() => undefined);
    },
    [dressId, identity, writeDress],
  );

  const updateTransform = (patch: Partial<FaceTransform>) => {
    const next = { ...latestTransform.current, ...patch };
    hasFace.current = true;
    latestTransform.current = next;
    setTransform(next);
  };
  const flushTransform = () => {
    void writeDress(dressId, { faceTransform: latestTransform.current }).catch(
      () => reportSaveStatus("error"),
    );
  };

  const updateRecall = (key: RecallKey, value: string) => {
    const next = { ...latestRecall.current, [key]: value };
    latestRecall.current = next;
    setRecall(next);
    const pendingRecall = queueRecallDraft(
      dressId,
      { ...next, memo: latestMemo.current },
      stylingId,
    );
    reportSaveStatus("saving");
    void writeDress(dressId, { ...next, memo: latestMemo.current }).then(
      () => {
        if (pendingRecall)
          acknowledgeRecallDraft(dressId, pendingRecall.revision, stylingId);
        reportSaveStatus("saved");
      },
      () => reportSaveStatus("error"),
    );
  };

  return {
    recall,
    latestRecall,
    updateRecall,
    memo,
    setMemo: (value: string) => {
      latestMemo.current = value;
      setMemo(value);
      queueRecallDraft(
        dressId,
        { ...latestRecall.current, memo: value },
        stylingId,
      );
    },
    label,
    setLabel,
    transform,
    setTransform,
    latestMemo,
    latestLabel,
    latestTransform,
    hasFace,
    updateTransform,
    flushTransform,
  };
}
