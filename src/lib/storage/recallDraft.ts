import { z } from "zod";
export type RecallDraft = {
  readonly memoryCue: string;
  readonly likedReason: string;
  readonly concern: string;
  readonly memo?: string;
};

const snapshotSchema = z
  .object({
    revision: z.string().min(1).max(80),
    values: z
      .object({
        memoryCue: z.string().max(80),
        likedReason: z.string().max(160),
        concern: z.string().max(160),
        memo: z.string().max(1000).optional(),
      })
      .strict(),
  })
  .strict();

const keyFor = (dressId: string, stylingId = "base") =>
  `dress-note:recall-draft:${dressId}${stylingId === "base" ? "" : `:look:${stylingId}`}`;

export function readRecallDraft(dressId: string, stylingId = "base") {
  try {
    const raw = sessionStorage.getItem(keyFor(dressId, stylingId));
    if (!raw) return undefined;
    const parsed = snapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : undefined;
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof DOMException)
      return undefined;
    throw error;
  }
}

export function queueRecallDraft(
  dressId: string,
  values: RecallDraft,
  stylingId = "base",
) {
  const snapshot = { revision: crypto.randomUUID(), values };
  try {
    sessionStorage.setItem(
      keyFor(dressId, stylingId),
      JSON.stringify(snapshot),
    );
    return snapshot;
  } catch (error) {
    if (error instanceof DOMException) return undefined;
    throw error;
  }
}

export function acknowledgeRecallDraft(
  dressId: string,
  revision: string,
  stylingId = "base",
) {
  if (readRecallDraft(dressId, stylingId)?.revision !== revision) return;
  try {
    sessionStorage.removeItem(keyFor(dressId, stylingId));
  } catch (error) {
    if (!(error instanceof DOMException)) throw error;
  }
}

export function removeRecallDraft(dressId: string, stylingId = "base") {
  try {
    sessionStorage.removeItem(keyFor(dressId, stylingId));
  } catch (error) {
    if (!(error instanceof DOMException)) throw error;
  }
}

export function clearRecallDrafts() {
  try {
    const keys = Object.keys(sessionStorage).filter((key) =>
      key.startsWith("dress-note:recall-draft:"),
    );
    for (const key of keys) sessionStorage.removeItem(key);
  } catch (error) {
    if (!(error instanceof DOMException)) throw error;
  }
}
