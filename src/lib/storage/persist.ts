export async function requestPersistentStorage() {
  try { if (navigator.storage?.persist) await navigator.storage.persist(); } catch { /* best effort */ }
}
export async function storageEstimate() {
  try { return await navigator.storage?.estimate?.(); } catch { return undefined; }
}
export async function clearAllCaches() {
  if (!('caches' in window)) return;
  const keys = await caches.keys();
  await Promise.all(keys.map(k=>caches.delete(k)));
}
