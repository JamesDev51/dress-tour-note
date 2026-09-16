export type PhotoWarpSpan = readonly [leftX: number, rightX: number];
// prettier-ignore
export type PhotoWarpFrame = { readonly width: number; readonly height: number };
// prettier-ignore
export type PhotoWarpRow = { readonly y: number; readonly runs: readonly PhotoWarpSpan[]; readonly centerRunIndex: number | null };
// prettier-ignore
export type PhotoWarpGuide = { readonly frame: PhotoWarpFrame; readonly centerX: number; readonly rows: readonly PhotoWarpRow[] };
// prettier-ignore
export type PhotoWarpAnchor = { readonly centerX: number; readonly joinY: number; readonly hemY: number; readonly joinLeftX?: number; readonly joinRightX?: number; readonly joinKind?: string };
// prettier-ignore
export type PhotoWarpInput = { readonly sourceImageId: string; readonly sourceGuide: PhotoWarpGuide; readonly targetGuide: PhotoWarpGuide; readonly source: PhotoWarpAnchor; readonly target: PhotoWarpAnchor; readonly targetMaskId?: string; readonly namespace: string };

type GuideRow = { readonly position: number; readonly span: PhotoWarpSpan };
type NormalizedRow = { readonly t: number; readonly span: PhotoWarpSpan };
const EDGE_MARGIN_PX = 8;
const SHORT_HEM_RATIO = 0.8;
const EPSILON = 0.000001;

// prettier-ignore
function finite(value: number): boolean { return Number.isFinite(value); }
// prettier-ignore
function validId(value: string): boolean { return /^[A-Za-z_][A-Za-z0-9_.:-]*$/.test(value); }
// prettier-ignore
function escapeXml(value: string): string { return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;"); }
// prettier-ignore
function numberText(value: number): string { return (Math.abs(value) < EPSILON ? 0 : value).toFixed(4).replace(/\.?0+$/, ""); }
// prettier-ignore
function validFrame(frame: PhotoWarpFrame): boolean { return finite(frame.width) && finite(frame.height) && frame.width > 0 && frame.height > 0; }
// prettier-ignore
function validSpan(span: PhotoWarpSpan | undefined, frame: PhotoWarpFrame): boolean { if (!span) return false; const [leftX, rightX] = span; return finite(leftX) && finite(rightX) && leftX >= 0 && rightX <= frame.width && leftX < rightX; }
// prettier-ignore
function validRun(span: PhotoWarpSpan, frame: PhotoWarpFrame): boolean { const [leftX, rightX] = span; return finite(leftX) && finite(rightX) && leftX >= 0 && rightX <= frame.width && leftX <= rightX; }
// prettier-ignore
function validGuide(guide: PhotoWarpGuide): boolean { if (!validFrame(guide.frame) || !finite(guide.centerX) || guide.centerX < 0 || guide.centerX > guide.frame.width) return false; let previousY = -Infinity; return guide.rows.every((row) => { const index = row.centerRunIndex; const validIndex = index === null || (Number.isInteger(index) && index >= 0 && index < row.runs.length); const ordered = finite(row.y) && row.y >= 0 && row.y <= guide.frame.height && row.y > previousY; previousY = row.y; return ordered && validIndex && row.runs.every((span) => validRun(span, guide.frame)); }); }
// prettier-ignore
function validAnchor(anchor: PhotoWarpAnchor, frame: PhotoWarpFrame): boolean { if (!finite(anchor.centerX) || !finite(anchor.joinY) || !finite(anchor.hemY) || anchor.centerX < 0 || anchor.centerX > frame.width || anchor.joinY < 0 || anchor.joinY >= anchor.hemY || anchor.hemY > frame.height) return false; const leftX = anchor.joinLeftX; const rightX = anchor.joinRightX; if ((leftX === undefined) !== (rightX === undefined)) return false; if (leftX === undefined && rightX === undefined) return true; return leftX !== undefined && rightX !== undefined && finite(leftX) && finite(rightX) && leftX >= 0 && rightX <= frame.width && leftX < rightX; }
// prettier-ignore
function validInput(input: PhotoWarpInput): boolean {
  if (!validId(input.sourceImageId) || !validId(input.namespace) || (input.targetMaskId !== undefined && !validId(input.targetMaskId))) return false;
  if (!validGuide(input.sourceGuide) || !validGuide(input.targetGuide)) return false;
  const sourceFrame = input.sourceGuide.frame; const targetFrame = input.targetGuide.frame;
  return sourceFrame.width === targetFrame.width && sourceFrame.height === targetFrame.height && validAnchor(input.source, sourceFrame) && validAnchor(input.target, targetFrame);
}
// prettier-ignore
function centralSpan(row: PhotoWarpRow, frame: PhotoWarpFrame): PhotoWarpSpan | undefined { const span = row.centerRunIndex === null ? undefined : row.runs[row.centerRunIndex]; return validSpan(span, frame) ? span : undefined; }
// prettier-ignore
function expandedSpan(span: PhotoWarpSpan, frame: PhotoWarpFrame): PhotoWarpSpan { return [Math.max(0, span[0] - EDGE_MARGIN_PX), Math.min(frame.width, span[1] + EDGE_MARGIN_PX)]; }
// prettier-ignore
function spanAt(rows: readonly GuideRow[], position: number): PhotoWarpSpan | undefined {
  const first = rows[0]; if (!first) return undefined; if (position <= first.position) return first.span;
  for (let index = 1; index < rows.length; index += 1) { const previous = rows[index - 1]; const current = rows[index]; if (!previous || !current) continue; if (position <= current.position) { const ratio = (position - previous.position) / (current.position - previous.position); return [previous.span[0] + (current.span[0] - previous.span[0]) * ratio, previous.span[1] + (current.span[1] - previous.span[1]) * ratio]; } }
  return rows.at(-1)?.span;
}
// prettier-ignore
function normalizedRows(guide: PhotoWarpGuide, anchor: PhotoWarpAnchor): readonly NormalizedRow[] { const measured: GuideRow[] = []; for (const row of guide.rows) { const span = centralSpan(row, guide.frame); if (span && row.y >= anchor.joinY && row.y <= anchor.hemY) measured.push({ position: row.y, span }); } if (measured.length === 0) return []; const leftX = anchor.joinLeftX; const rightX = anchor.joinRightX; const joinSpan: PhotoWarpSpan | undefined = leftX !== undefined && rightX !== undefined ? [leftX, rightX] : spanAt(measured, anchor.joinY); const hemSpan = spanAt(measured, anchor.hemY); if (!joinSpan || !hemSpan) return []; const points: GuideRow[] = [{ position: anchor.joinY, span: joinSpan }, ...measured, { position: anchor.hemY, span: hemSpan }]; points.sort((left, right) => left.position - right.position); const unique: GuideRow[] = []; for (const point of points) { const previous = unique.at(-1); if (previous && Math.abs(previous.position - point.position) <= EPSILON) unique[unique.length - 1] = point; else unique.push(point); } return unique.map((row) => ({ t: (row.position - anchor.joinY) / (anchor.hemY - anchor.joinY), span: row.span })); }
// prettier-ignore
function spanAtT(rows: readonly NormalizedRow[], t: number): PhotoWarpSpan | undefined { return spanAt(rows.map((row) => ({ position: row.t, span: row.span })), t); }
// prettier-ignore
function sameGeometry(input: PhotoWarpInput, source: readonly NormalizedRow[], target: readonly NormalizedRow[]): boolean {
  if (input.source.joinY !== input.target.joinY || input.source.hemY !== input.target.hemY || input.source.centerX !== input.target.centerX || source.length !== target.length) return false;
  return source.every((row, index) => { const other = target[index]; return other !== undefined && Math.abs(row.t - other.t) <= EPSILON && Math.abs(row.span[0] - other.span[0]) <= EPSILON && Math.abs(row.span[1] - other.span[1]) <= EPSILON; });
}
// prettier-ignore
function clipMarkup(id: string, path: string): string { return `<clipPath id="${escapeXml(id)}" clipPathUnits="userSpaceOnUse"><path d="${path}" fill-rule="nonzero" clip-rule="nonzero"/></clipPath>`; }
// prettier-ignore
function bodyPath(rows: readonly NormalizedRow[], anchor: PhotoWarpAnchor, frame: PhotoWarpFrame): string { const left = rows.map((row) => { const span = expandedSpan(row.span, frame); const y = anchor.joinY + (anchor.hemY - anchor.joinY) * row.t; return `${numberText(span[0])} ${numberText(y)}`; }); const right = [...rows].reverse().map((row) => { const span = expandedSpan(row.span, frame); const y = anchor.joinY + (anchor.hemY - anchor.joinY) * row.t; return `${numberText(span[1])} ${numberText(y)}`; }); return `M${left.join(" L")} L${right.join(" L")} Z`; }
// prettier-ignore
function rootAttributes(input: PhotoWarpInput, mode: "exact" | "global-affine" | "short-hem"): string { const sourceKind = input.source.joinKind ? ` data-source-join-kind="${escapeXml(input.source.joinKind)}"` : ""; const targetKind = input.target.joinKind ? ` data-target-join-kind="${escapeXml(input.target.joinKind)}"` : ""; const mask = input.targetMaskId ? ` mask="url(#${escapeXml(input.targetMaskId)})"` : ""; return `<g data-renderer="photo-lower-warp" data-coordinate-frame="source-pixels" data-source-image-id="${escapeXml(input.sourceImageId)}" data-fast-path="${mode}" data-strip-count="1" data-source-join-y="${numberText(input.source.joinY)}" data-target-join-y="${numberText(input.target.joinY)}" data-source-hem-y="${numberText(input.source.hemY)}" data-target-hem-y="${numberText(input.target.hemY)}"${sourceKind}${targetKind}${mask}>`; }
// prettier-ignore
function boundsForRows(rows: readonly NormalizedRow[], frame: PhotoWarpFrame): PhotoWarpSpan { let left = frame.width; let right = 0; for (const row of rows) { const span = expandedSpan(row.span, frame); left = Math.min(left, span[0]); right = Math.max(right, span[1]); } return [left, right]; }
// prettier-ignore
function globalAffineMarkup(input: PhotoWarpInput, sourceRows: readonly NormalizedRow[], targetRows: readonly NormalizedRow[], targetBodyClipId: string): string {
  const sourceMid = spanAtT(sourceRows, 0.5); const targetMid = spanAtT(targetRows, 0.5); const sourceWide = spanAtT(sourceRows, 0.9); const targetWide = spanAtT(targetRows, 0.9); const sourceWidth = sourceWide ? sourceWide[1] - sourceWide[0] : 0; const targetWidth = targetWide ? targetWide[1] - targetWide[0] : 0; const sourceHeight = input.source.hemY - input.source.joinY; const targetHeight = input.target.hemY - input.target.joinY;
  if (!sourceMid || !targetMid || !sourceWide || !targetWide || !(sourceWidth > 0) || !(targetWidth > 0) || !(sourceHeight > 0) || !(targetHeight > 0)) return "";
  const scaleX = targetWidth / sourceWidth; const scaleY = targetHeight / sourceHeight; const translateX = (targetMid[0] + targetMid[1]) / 2 - scaleX * ((sourceMid[0] + sourceMid[1]) / 2); const translateY = input.target.joinY - scaleY * input.source.joinY;
  if (![scaleX, scaleY, translateX, translateY].every(finite) || scaleX <= 0 || scaleY <= 0) return "";
  const defs = clipMarkup(targetBodyClipId, bodyPath(targetRows, input.target, input.targetGuide.frame)); const body = `<g clip-path="url(#${escapeXml(targetBodyClipId)})"><g data-strip-index="0" data-strip-mapping="global-affine" transform="matrix(${numberText(scaleX)} 0 0 ${numberText(scaleY)} ${numberText(translateX)} ${numberText(translateY)})"><use href="#${escapeXml(input.sourceImageId)}"/></g></g>`;
  return `${rootAttributes(input, "global-affine")}<defs>${defs}</defs>${body}</g>`;
}
// prettier-ignore
function shortHemMarkup(input: PhotoWarpInput, sourceRows: readonly NormalizedRow[], targetRows: readonly NormalizedRow[], targetBodyClipId: string): string {
  const sourceSpan = spanAtT(sourceRows, 0.35); const targetBounds = boundsForRows(targetRows, input.targetGuide.frame); const sourceHeight = input.source.hemY - input.source.joinY; const targetHeight = input.target.hemY - input.target.joinY;
  if (!sourceSpan || !(targetBounds[1] > targetBounds[0]) || !(sourceHeight > 0) || !(targetHeight > 0)) return "";
  const sourceView = expandedSpan(sourceSpan, input.sourceGuide.frame); const sourceWidth = sourceView[1] - sourceView[0]; const targetWidth = targetBounds[1] - targetBounds[0]; if (![sourceWidth, targetWidth, sourceView[0], sourceView[1]].every(finite) || sourceWidth <= 0 || targetWidth <= 0) return "";
  const sourceClipId = `${input.namespace}-photo-warp-short-source`; const defs = clipMarkup(sourceClipId, bodyPath(sourceRows, input.source, input.sourceGuide.frame)) + clipMarkup(targetBodyClipId, bodyPath(targetRows, input.target, input.targetGuide.frame)); const body = `<g clip-path="url(#${escapeXml(targetBodyClipId)})"><svg data-strip-index="0" data-strip-mapping="short-hem-viewbox" x="${numberText(targetBounds[0])}" y="${numberText(input.target.joinY)}" width="${numberText(targetWidth)}" height="${numberText(targetHeight)}" viewBox="${numberText(sourceView[0])} ${numberText(input.source.joinY)} ${numberText(sourceWidth)} ${numberText(sourceHeight)}" preserveAspectRatio="none" overflow="hidden"><use href="#${escapeXml(input.sourceImageId)}" clip-path="url(#${escapeXml(sourceClipId)})"/></svg></g>`;
  return `${rootAttributes(input, "short-hem")}<defs>${defs}</defs>${body}</g>`;
}
// prettier-ignore
export function buildPhotoWarpMarkup(input: PhotoWarpInput): string {
  if (!validInput(input)) return "";
  const sourceRows = normalizedRows(input.sourceGuide, input.source); const targetRows = normalizedRows(input.targetGuide, input.target); if (sourceRows.length < 2 || targetRows.length < 2) return "";
  const targetBodyClipId = `${input.namespace}-photo-warp-target-body`; if (sameGeometry(input, sourceRows, targetRows)) { const defs = clipMarkup(targetBodyClipId, bodyPath(targetRows, input.target, input.targetGuide.frame)); const body = `<g clip-path="url(#${escapeXml(targetBodyClipId)})"><use href="#${escapeXml(input.sourceImageId)}"/></g>`; return `${rootAttributes(input, "exact")}<defs>${defs}</defs>${body}</g>`; }
  const sourceHeight = input.source.hemY - input.source.joinY; const targetHeight = input.target.hemY - input.target.joinY; if (!(sourceHeight > 0) || !(targetHeight > 0)) return ""; if (targetHeight / sourceHeight < SHORT_HEM_RATIO) return shortHemMarkup(input, sourceRows, targetRows, targetBodyClipId); return globalAffineMarkup(input, sourceRows, targetRows, targetBodyClipId);
}
