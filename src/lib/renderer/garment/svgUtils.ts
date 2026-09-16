export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function numberText(value: number): string {
  return Number(value.toFixed(2)).toString();
}

export function matrix(rows: readonly (readonly number[])[]): string {
  return rows.map((row) => row.join(" ")).join(" ");
}
