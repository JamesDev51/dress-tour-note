import { useEffect, useRef, useState } from "react";
import { patchDress } from "../../db/repositories";
import {
  DEFAULT_FACE_TRANSFORM,
  type Dress,
  type FaceTransform,
  type LocalAsset,
} from "../../types/domain";
import type { SaveStatus } from "../../stores/uiStore";

export function useDressEditorDraft({
  dressId,
  dress,
  face,
  onSaveStatus,
}: {
  dressId: string;
  dress: Dress | undefined;
  face: LocalAsset | undefined;
  onSaveStatus: (status: SaveStatus) => void;
}) {
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

  useEffect(() => {
    if (dress && initialized.current !== dress.id) {
      initialized.current = dress.id;
      latestMemo.current = dress.memo;
      latestLabel.current = dress.label;
      latestTransform.current = dress.faceTransform ?? DEFAULT_FACE_TRANSFORM;
      setMemo(dress.memo);
      setLabel(dress.label);
      setTransform(latestTransform.current);
    }
    hasFace.current = Boolean(face);
  }, [dress, face]);

  useEffect(() => {
    if (!dress || memo === dress.memo) return;
    onSaveStatus("saving");
    const timeout = window.setTimeout(async () => {
      try {
        await patchDress(dressId, { memo });
        onSaveStatus("saved");
      } catch {
        onSaveStatus("error");
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [memo, dressId, dress?.memo, onSaveStatus]);

  useEffect(() => {
    if (!dress) return;
    const current = dress.faceTransform ?? DEFAULT_FACE_TRANSFORM;
    if (JSON.stringify(transform) === JSON.stringify(current)) return;
    const timeout = window.setTimeout(async () => {
      try {
        await patchDress(dressId, { faceTransform: transform });
        onSaveStatus("saved");
      } catch {
        onSaveStatus("error");
      }
    }, 220);
    return () => clearTimeout(timeout);
  }, [transform, dressId, dress, onSaveStatus]);

  useEffect(
    () => () => {
      if (initialized.current !== dressId) return;
      const finalLabel = latestLabel.current.trim();
      const patch: Partial<Dress> = { memo: latestMemo.current };
      if (finalLabel) patch.label = finalLabel;
      if (hasFace.current) patch.faceTransform = latestTransform.current;
      void patchDress(dressId, patch);
    },
    [dressId],
  );

  const updateTransform = (patch: Partial<FaceTransform>) =>
    setTransform((current) => {
      const next = { ...current, ...patch };
      hasFace.current = true;
      latestTransform.current = next;
      return next;
    });
  const flushTransform = () => {
    void patchDress(dressId, { faceTransform: latestTransform.current });
  };

  return {
    memo,
    setMemo,
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
