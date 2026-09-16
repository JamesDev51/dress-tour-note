let namespaceCounter = 0;

export function createGarmentNamespace(requested?: string): string {
  namespaceCounter += 1;
  const clean = requested
    ?.replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/^-+|-+$/g, "");
  if (clean && clean.length > 0) {
    const prefix = clean.startsWith("garment-") ? clean : `garment-${clean}`;
    return `${prefix}-${namespaceCounter}`;
  }
  return `garment-instance-${namespaceCounter}`;
}
