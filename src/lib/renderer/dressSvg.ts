import type { Dress } from "../../types/domain";
import {
  backStyleOptions,
  colorOptions,
  detailOptions,
  fabricOptions,
  necklineOptions,
  optionLabel,
  silhouetteOptions,
  topStyleOptions,
  trainOptions,
  waistlineOptions,
} from "../dress/options";
import { dressRenderTokens } from "../dress/renderTokens";
import {
  backPaths,
  fabricMarks,
  necklinePaths,
  silhouettePaths,
  topPaths,
  trainLengths,
  waistY,
} from "./memorySketchPrimitives";

export type DressSketchView = "full" | "upper" | "back";
export type DressSketchMode = "annotated" | "visual";

const escapeXml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ] ?? character,
  );

const field = (label: string, value: string, known: boolean, y: number) =>
  `<g data-field="${escapeXml(label)}"${known ? "" : ' data-state="unknown"'}><text x="254" y="${y}" font-size="9" fill="${dressRenderTokens.volume.contourShadow}">${escapeXml(label)}</text><text x="254" y="${y + 15}" font-size="9" font-weight="700" fill="${dressRenderTokens.garmentDropShadow}">${escapeXml(known ? value : "미기록")}</text></g>`;

function fieldsFor(dress: Dress, view: DressSketchView) {
  const top = field(
    "상의",
    optionLabel(topStyleOptions, dress.topStyle),
    dress.topStyle !== "unknown",
    92,
  );
  const neckline = field(
    "네크라인",
    optionLabel(necklineOptions, dress.neckline),
    dress.neckline !== "unknown",
    132,
  );
  const silhouette = field(
    "실루엣",
    optionLabel(silhouetteOptions, dress.silhouette),
    dress.silhouette !== "unknown",
    172,
  );
  const waist = field(
    "허리선",
    optionLabel(waistlineOptions, dress.waistline),
    dress.waistline !== "unknown",
    212,
  );
  const train = field(
    "트레인",
    optionLabel(trainOptions, dress.train),
    dress.train !== "unknown",
    252,
  );
  const color = field(
    "색상",
    optionLabel(colorOptions, dress.color),
    dress.color !== "unknown",
    292,
  );
  const back = field(
    "등 디자인",
    optionLabel(backStyleOptions, dress.backStyle),
    Boolean(dress.backStyle && dress.backStyle !== "unknown"),
    132,
  );
  switch (view) {
    case "full":
      return `${top}${neckline}${silhouette}${waist}${train}${color}`;
    case "upper":
      return `${top}${neckline}${waist}${color}`;
    case "back":
      return `${back}${silhouette}${train}${color}`;
  }
}

function garment(dress: Dress, view: DressSketchView, visual = false) {
  const edge = visual
    ? dressRenderTokens.volume.contourShadow
    : dressRenderTokens.garmentEdge[dress.color];
  const fill = dressRenderTokens.garmentColor[dress.color];
  const dash = ' stroke-dasharray="6 5" data-state="unknown"';
  const skirt =
    view !== "upper"
      ? dress.silhouette === "unknown"
        ? `<path d="M111 284 Q88 420 70 558 Q135 582 200 558 Q182 420 159 284 Z" fill="${fill}" stroke="${edge}"${dash}/>`
        : `<path data-shape="${dress.silhouette}" d="${silhouettePaths[dress.silhouette]}" fill="${fill}" stroke="${edge}" stroke-width="2"/>`
      : "";
  const top =
    view === "back"
      ? `<path d="M105 204 Q96 236 105 284 L165 284 Q174 236 165 204" fill="${fill}" stroke="${edge}" stroke-width="2"/>`
      : dress.topStyle === "unknown"
        ? `<path d="M105 204 Q96 236 105 284 L165 284 Q174 236 165 204" fill="${fill}" stroke="${edge}"${dash}/>`
        : `<path data-shape="${dress.topStyle}" d="${topPaths[dress.topStyle]}" fill="${fill}" stroke="${edge}" stroke-width="2"/>`;
  const neckline =
    view === "back"
      ? dress.backStyle && dress.backStyle !== "unknown"
        ? `<path data-shape="${dress.backStyle}" d="${backPaths[dress.backStyle]}" fill="none" stroke="${edge}" stroke-width="3"/>`
        : `<path d="M110 198 Q135 218 160 198" fill="none" stroke="${edge}"${dash}/>`
      : dress.neckline === "unknown"
        ? `<path d="M112 201 Q135 214 158 201" fill="none" stroke="${edge}"${dash}/>`
        : `<path data-shape="${dress.neckline}" d="${necklinePaths[dress.neckline]}" fill="none" stroke="${edge}" stroke-width="3"/>`;
  const waist =
    dress.waistline === "unknown" || view === "back"
      ? ""
      : `<path data-shape="${dress.waistline}" d="M108 ${waistY[dress.waistline]} Q135 ${dress.waistline === "basque" ? 306 : waistY[dress.waistline]} 162 ${waistY[dress.waistline]}" fill="none" stroke="${edge}" stroke-width="2"/>`;
  const train =
    view !== "upper" && dress.train !== "unknown" && dress.train !== "none"
      ? `<path data-shape="${dress.train}" d="M180 552 Q${220 + trainLengths[dress.train]} 565 ${220 + trainLengths[dress.train]} 590" fill="none" stroke="${edge}" stroke-width="4" stroke-linecap="round"/>`
      : "";
  return `<g data-layer="garment">${skirt}${top}${neckline}${waist}${train}</g>`;
}

function annotations(dress: Dress, view: DressSketchView) {
  const detailLabels = dress.details.map((detail) =>
    optionLabel(detailOptions, detail),
  );
  const notes = Object.entries(dress.customOptions ?? {}).flatMap(
    ([category, note]) => {
      if (
        view === "back" &&
        ["top", "neckline", "waistline"].includes(category)
      )
        return [];
      const categoryLabel: Readonly<Record<string, string>> = {
        top: "상의",
        neckline: "네크라인",
        silhouette: "실루엣",
        fabric: "소재",
        color: "색상",
        waistline: "허리선",
        backStyle: "등 디자인",
        train: "트레인",
        details: "디테일",
      };
      return note ? [{ label: categoryLabel[category] ?? category, note }] : [];
    },
  );
  const badges = detailLabels.slice(0, 2).map((text, index) => {
    const y = 402 + index * 30;
    return `<g data-layer="detail-badge"><rect x="254" y="${y}" width="92" height="22" rx="11" fill="${dressRenderTokens.garmentColor.ivory}" stroke="${dressRenderTokens.garmentEdge.ivory}"/><text x="300" y="${y + 14}" text-anchor="middle" font-size="8" font-weight="700" fill="${dressRenderTokens.garmentDropShadow}">${escapeXml(text)}</text></g>`;
  });
  const noteLabels = notes.slice(0, 2).map(({ label, note }, index) => {
    const y = 472 + index * 42;
    const visibleNote = note.length > 13 ? `${note.slice(0, 13)}…` : note;
    return `<g data-layer="unsupported-note"><text x="254" y="${y}" font-size="7" font-weight="700" fill="${dressRenderTokens.volume.contourShadow}">${escapeXml(label)} · 비슷하지만 달라요</text><text x="254" y="${y + 14}" font-size="8" fill="${dressRenderTokens.garmentDropShadow}">${escapeXml(visibleNote)}</text><title>${escapeXml(note)}</title></g>`;
  });
  return [...badges, ...noteLabels].join("");
}

export function dressSvgMarkup(
  dress: Dress,
  faceDataUrl?: string,
  includeFace = false,
  view: DressSketchView = "full",
  mode: DressSketchMode = "annotated",
) {
  const faceAllowed = view !== "back" && includeFace && Boolean(faceDataUrl);
  const faceTransform = faceAllowed ? dress.faceTransform : undefined;
  const faceDefs = faceAllowed
    ? '<defs><clipPath id="face-mask"><ellipse cx="135" cy="116" rx="28" ry="32"/></clipPath></defs>'
    : "";
  const face =
    faceAllowed && faceDataUrl
      ? `<g data-layer="face" clip-path="url(#face-mask)"><image href="${escapeXml(faceDataUrl)}" x="99" y="79" width="72" height="76" preserveAspectRatio="xMidYMid slice" transform="translate(${(faceTransform?.x ?? 0) * 18} ${(faceTransform?.y ?? 0) * 15}) rotate(${faceTransform?.rotation ?? 0} 135 117) translate(135 117) scale(${faceTransform?.scale ?? 1}) translate(-135 -117)"/></g>`
      : "";
  const allUnknown = (() => {
    switch (view) {
      case "full":
        return [
          dress.topStyle,
          dress.neckline,
          dress.silhouette,
          dress.waistline,
          dress.color,
          dress.train,
        ].every((value) => value === "unknown");
      case "upper":
        return [
          dress.topStyle,
          dress.neckline,
          dress.waistline,
          dress.color,
        ].every((value) => value === "unknown");
      case "back":
        return [
          dress.backStyle ?? "unknown",
          dress.silhouette,
          dress.train,
          dress.color,
        ].every((value) => value === "unknown");
    }
  })();
  const fabricKnown = dress.fabric !== "unknown";
  const fabricMark =
    dress.fabric === "unknown" ? "" : fabricMarks[dress.fabric];
  const supportingAnnotations =
    mode === "visual" || view === "upper"
      ? ""
      : `<g data-layer="fabric-swatch" data-material="${dress.fabric}"${fabricKnown ? "" : ' data-state="unknown"'} color="${dressRenderTokens.garmentEdge[dress.color]}"><circle cx="270" cy="352" r="17" fill="${dressRenderTokens.garmentColor[dress.color]}" stroke="${dressRenderTokens.garmentEdge[dress.color]}"${fabricKnown ? "" : ' stroke-dasharray="4 3"'}/>${fabricMark}<text x="294" y="348" font-size="9" fill="${dressRenderTokens.volume.contourShadow}">소재</text><text x="294" y="363" font-size="10" font-weight="700" fill="${dressRenderTokens.garmentDropShadow}">${escapeXml(fabricKnown ? optionLabel(fabricOptions, dress.fabric) : "미기록")}</text></g>${annotations(dress, view)}`;
  const visual = mode === "visual";
  const viewBox = visual ? "0 0 320 427" : "0 0 360 640";
  const figureTransform = visual
    ? view === "upper"
      ? "translate(-42 -130) scale(1.5)"
      : "translate(22 -58) scale(.8)"
    : view === "upper"
      ? "translate(0 74) scale(1.18)"
      : undefined;
  const heading = visual
    ? ""
    : `<text x="24" y="34" font-size="15" font-weight="700" fill="${dressRenderTokens.garmentDropShadow}">드레스 기억 스케치</text><text x="24" y="51" font-size="9" fill="${dressRenderTokens.volume.contourShadow}">${view === "full" ? "전체" : view === "upper" ? "상체" : "뒤태"} · 선택한 기록을 단순화한 그림</text>`;
  const visibleFields = visual ? "" : fieldsFor(dress, view);
  const background = visual
    ? `<rect width="100%" height="100%" fill="${dressRenderTokens.previewSurface}"/>`
    : `<rect width="360" height="640" fill="${dressRenderTokens.previewSurface}"/>`;
  const mannequin = visual
    ? `<g data-layer="mannequin"><circle cx="135" cy="116" r="31" fill="${dressRenderTokens.floorShadow}" stroke="${dressRenderTokens.garmentDropShadow}" stroke-opacity=".18" stroke-width="2"/><path data-layer="neck" d="M126 145 L126 161 Q111 166 104 183 L106 204 M144 145 L144 161 Q159 166 166 183 L164 204" fill="none" stroke="${dressRenderTokens.garmentDropShadow}" stroke-opacity=".28" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></g>`
    : `<circle cx="135" cy="116" r="31" fill="${dressRenderTokens.floorShadow}" opacity=".7"/><path d="M105 174 Q135 153 165 174" fill="none" stroke="${dressRenderTokens.floorShadow}" stroke-width="12" stroke-linecap="round"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${escapeXml(dress.label)} 드레스 기억 스케치" data-renderer="memory-sketch" data-view="${view}"${visual ? ' data-mode="visual"' : ""}${allUnknown ? ' data-state="unknown"' : ""}>${faceDefs}${background}${heading}<g data-layer="figure"${figureTransform ? ` transform="${figureTransform}"` : ""}>${mannequin}${face}${garment(dress, view, visual)}</g>${visibleFields}${supportingAnnotations}</svg>`;
}

export async function dressSvgToJpeg(
  dress: Dress,
  faceDataUrl?: string,
  includeFace = false,
  width = 720,
  height = 1280,
  view: DressSketchView = "full",
): Promise<Uint8Array> {
  const blob = new Blob(
    [dressSvgMarkup(dress, faceDataUrl, includeFace, view)],
    { type: "image/svg+xml" },
  );
  const url = URL.createObjectURL(blob);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () =>
        reject(new Error("드레스 이미지를 만들 수 없어요."));
      element.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas를 사용할 수 없어요.");
    context.fillStyle = dressRenderTokens.exportCanvas;
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const jpeg = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.9),
    );
    if (!jpeg) throw new Error("JPEG 변환에 실패했어요.");
    return new Uint8Array(await jpeg.arrayBuffer());
  } finally {
    URL.revokeObjectURL(url);
  }
}
