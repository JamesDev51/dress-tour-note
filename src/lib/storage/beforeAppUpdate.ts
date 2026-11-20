// Mounted editors register their latest drafts. A failed save prevents reload.
const editors = new Set<() => Promise<void>>();
export function registerBeforeAppUpdate(save: () => Promise<void>) {
  editors.add(save);
  return () => {
    editors.delete(save);
  };
}
export async function flushBeforeAppUpdate() {
  for (const save of editors) await save();
}
