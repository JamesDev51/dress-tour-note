import { z } from "zod";
export type RecallDraft = {
  readonly memoryCue: string;
  readonly likedReason: string;
  readonly concern: string;
};

const snapshotSchema = z
  .object({
    revision: z.string().min(1).max(80),
    values: z
      .object({
        memoryCue: z.string().max(80),
        likedReason: z.string().max(160),
        concern: z.string().max(160),
      })
      .strict(),
  })
  .strict();

const keyFor = (dressId: string) => `dress-note:recall-draft:${dressId}`;

export function readRecallDraft(dressId: string) {
  try {
    const raw = sessionStorage.getItem(keyFor(dressId));
    if (!raw) return undefined;
    const parsed = snapshotSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : undefined;
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof DOMException)
      return undefined;
    throw error;
  }
}

export function queueRecallDraft(dressId: string, values: RecallDraft) {
  const snapshot = { revision: crypto.randomUUID(), values };
  try {
    sessionStorage.setItem(keyFor(dressId), JSON.stringify(snapshot));
    return snapshot;
  } catch (error) {
    if (error instanceof DOMException) return undefined;
    throw error;
  }
}

export function acknowledgeRecallDraft(dressId: string, revision: string) {
  if (readRecallDraft(dressId)?.revision !== revision) return;
  try {
    sessionStorage.removeItem(keyFor(dressId));
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
