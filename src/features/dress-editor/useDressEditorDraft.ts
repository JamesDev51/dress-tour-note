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
  writeDress = (id, patch) => patchDress(id, patch),
}: {
  dressId: string;
  dress: Dress | undefined;
  face: LocalAsset | undefined;
  onSaveStatus: (status: SaveStatus) => void;
  writeDress?: (dressId: string, patch: Partial<Dress>) => Promise<void>;
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
        await writeDress(dressId, { memo });
        onSaveStatus("saved");
      } catch {
        onSaveStatus("error");
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [memo, dressId, dress?.memo, onSaveStatus, writeDress]);

  useEffect(() => {
    if (!dress) return;
    const current = dress.faceTransform ?? DEFAULT_FACE_TRANSFORM;
    if (JSON.stringify(transform) === JSON.stringify(current)) return;
    const timeout = window.setTimeout(async () => {
      try {
        await writeDress(dressId, { faceTransform: transform });
        onSaveStatus("saved");
      } catch {
        onSaveStatus("error");
      }
    }, 220);
    return () => clearTimeout(timeout);
  }, [transform, dressId, dress, onSaveStatus, writeDress]);

  useEffect(
    () => () => {
      if (initialized.current !== dressId) return;
      const finalLabel = latestLabel.current.trim();
      const patch: Partial<Dress> = { memo: latestMemo.current };
      if (finalLabel) patch.label = finalLabel;
      if (hasFace.current) patch.faceTransform = latestTransform.current;
      void writeDress(dressId, patch);
    },
    [dressId, writeDress],
  );

  const updateTransform = (patch: Partial<FaceTransform>) => {
    const next = { ...latestTransform.current, ...patch };
    hasFace.current = true;
    latestTransform.current = next;
    setTransform(next);
  };
  const flushTransform = () => {
    void writeDress(dressId, { faceTransform: latestTransform.current });
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
