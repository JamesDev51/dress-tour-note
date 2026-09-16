import type { Dress } from "../../types/domain";
import {
  backStyleOptions,
  colorOptions,
  fabricOptions,
  optionLabel,
} from "../dress/options";
import { dressRenderTokens } from "../dress/renderTokens";
import { fabricMarks, trainLengths, waistY } from "./memorySketchPrimitives";
import {
  neutralProfile,
  profileForSilhouette,
  type DressProfile,
} from "./dressProfiles";
import {
  backConstructionMarkup,
  necklinePathFor,
  sleeveMaskPathFor,
  topConstructionMarkup,
} from "./dressProfileDetails";
import {
  createSvgIds,
  escapeXml,
  renderAnnotations,
  renderDefinitions,
  renderFields,
  renderMannequin,
  renderVolumeLayers,
  preparedArtworkFrameTransform,
  preparedArtworkVerticalBounds,
} from "./dressSvgSupport";
import type { GarmentArtworkResult } from "./garment";

export type DressSketchView = "full" | "upper" | "back";
export type DressSketchMode = "annotated" | "visual";

export type DressSvgMarkupOptions = {
  readonly preparedArtwork?: GarmentArtworkResult;
  readonly namespace?: string;
};

const neutralWaistY = 268;

function numberText(value: number) {
  return Number(value.toFixed(4))
    .toString()
    .replace(/^(-?)0\./, "$1.");
}

function waistFor(dress: Dress) {
  return dress.waistline === "unknown"
    ? neutralWaistY
    : waistY[dress.waistline];
}

function profileFor(dress: Dress): DressProfile {
  return dress.silhouette === "unknown"
    ? neutralProfile
    : profileForSilhouette(dress.silhouette);
}

function garmentPath(
  dress: Dress,
  view: DressSketchView,
  waist: number,
  profile = profileFor(dress),
) {
  const backStyle =
    view === "back" ? (dress.backStyle ?? "unknown") : undefined;
  return view === "upper"
    ? profile.upperPath(waist, dress.topStyle, dress.neckline, backStyle)
    : profile.bodyPath(waist, dress.topStyle, dress.neckline, backStyle);
}

type TrainGeometry = {
  readonly outline: string;
  readonly fold: string;
  readonly attachment: string;
  readonly reach: number;
  readonly baseInset: number;
};

function trainGeometry(dress: Dress): TrainGeometry | undefined {
  if (dress.train === "unknown" || dress.train === "none") return undefined;
  const metric = profileFor(dress).metric;
  const length = trainLengths[dress.train];
  const hemWidth = metric.hemRight - metric.hemLeft;
  const baseInset = Math.max(36, Math.min(64, Math.round(hemWidth * 0.34)));
  const baseLeft = metric.hemRight - baseInset;
  const extension = Math.min(72, Math.max(24, Math.round(length * 1.45)));
  const endX = Math.min(306, metric.hemRight + extension);
  const floorY = Math.min(603, metric.hemY + 34 + Math.round(length * 0.2));
  const attachment = `M${baseLeft} ${metric.hemY + 1} C${baseLeft + 18} ${metric.hemY - 3} ${metric.hemRight - 12} ${metric.hemY + 1} ${metric.hemRight + 4} ${metric.hemY + 8}`;
  return {
    outline: `${attachment} C${metric.hemRight + extension * 0.25} ${metric.hemY + 10} ${metric.hemRight + extension * 0.72} ${metric.hemY + 16} ${endX} ${metric.hemY + 23} C${endX + 6} ${metric.hemY + 34} ${endX - 4} ${floorY - 2} ${endX - 22} ${floorY + 1} C${metric.hemRight + extension * 0.52} ${floorY + 5} ${metric.hemRight + extension * 0.2} ${metric.hemY + 34} ${baseLeft + 12} ${metric.hemY + 18} C${baseLeft + 2} ${metric.hemY + 12} ${baseLeft - 3} ${metric.hemY + 6} ${baseLeft} ${metric.hemY + 1} Z`,
    fold: `M${baseLeft + 10} ${metric.hemY + 7} C${metric.hemRight + extension * 0.18} ${metric.hemY + 17} ${metric.hemRight + extension * 0.54} ${floorY - 9} ${endX - 16} ${floorY - 5} C${endX - 43} ${floorY - 5} ${metric.hemRight + extension * 0.28} ${metric.hemY + 26} ${baseLeft + 10} ${metric.hemY + 7} Z`,
    attachment,
    reach: length,
    baseInset,
  };
}

function bodiceStructureMarkup(
  profile: DressProfile,
  transition: number,
  edge: string,
  view: DressSketchView,
) {
  if (view === "back") return "";
  const a = profile.anchors;
  return `<g data-layer="bodice-structure" data-profile-anchors="local"><path d="M${a.shoulderLeft + 10} ${a.topY + 15} C${a.shoulderLeft + 6} ${a.bustY - 3} ${a.waistLeft + 1} ${transition - 19} ${a.waistLeft + 2} ${transition - 4}" fill="none" stroke="${edge}" stroke-opacity=".14" stroke-width="1.4" stroke-linecap="round"/><path d="M${a.shoulderRight - 10} ${a.topY + 15} C${a.shoulderRight - 6} ${a.bustY - 3} ${a.waistRight - 1} ${transition - 19} ${a.waistRight - 2} ${transition - 4}" fill="none" stroke="${edge}" stroke-opacity=".14" stroke-width="1.4" stroke-linecap="round"/></g>`;
}

function garment(
  dress: Dress,
  view: DressSketchView,
  visual: boolean,
  ids: ReturnType<typeof createSvgIds>,
  train: TrainGeometry | undefined,
) {
  const edge = visual
    ? dressRenderTokens.volume.contourShadow
    : dressRenderTokens.garmentEdge[dress.color];
  const fill = dressRenderTokens.garmentColor[dress.color];
  const waist = waistFor(dress);
  const profile = profileFor(dress);
  const profileKey =
    dress.silhouette === "unknown" ? "neutral" : dress.silhouette;
  const transition = profile.transitionY(waist);
  const bodyPath = garmentPath(dress, view, waist, profile);
  const bodyContourPath =
    view === "upper"
      ? profile.upperContourPath(waist, dress.topStyle, dress.neckline)
      : profile.bodyContourPath(
          waist,
          dress.topStyle,
          dress.neckline,
          view === "back" ? (dress.backStyle ?? "unknown") : undefined,
        );
  const knownSilhouette = dress.silhouette !== "unknown" && view !== "upper";
  const contourUncertainty =
    dress.silhouette === "unknown"
      ? ' stroke-dasharray="6 5" stroke-opacity=".68"'
      : "";
  const silhouettePathMarkup = `<path data-layer="garment-base"${knownSilhouette ? ` data-shape="${dress.silhouette}"` : ' data-state="unknown"'} d="${bodyPath}" fill="url(#${ids.garmentGradient})" fill-rule="evenodd" stroke="none"/><path data-layer="garment-contour" d="${bodyContourPath}" fill="none" stroke="${edge}"${contourUncertainty} stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  const top =
    view === "back"
      ? ""
      : dress.topStyle === "unknown"
        ? `<path data-layer="top-unknown" d="M${profile.anchors.shoulderLeft} ${profile.anchors.topY + 4} Q135 ${profile.anchors.topY - 5} ${profile.anchors.shoulderRight} ${profile.anchors.topY + 4}" fill="none" stroke="${edge}" stroke-width="2" stroke-dasharray="6 5"/>`
        : topConstructionMarkup({
            style: dress.topStyle,
            anchors: profile.anchors,
            edge,
            gradientId: ids.garmentGradient,
          });
  const neckline =
    view === "back"
      ? dress.backStyle && dress.backStyle !== "unknown"
        ? backConstructionMarkup({
            style: dress.backStyle,
            anchors: profile.anchors,
            edge,
            fill,
          })
        : `<path data-layer="back-unknown" d="M${profile.anchors.necklineLeft - 1} ${profile.anchors.backTop} Q135 ${profile.anchors.backBottom - 4} ${profile.anchors.necklineRight + 1} ${profile.anchors.backTop}" fill="none" stroke="${edge}" stroke-width="2" stroke-dasharray="6 5"/>`
      : dress.neckline === "unknown"
        ? `<path data-layer="neckline-unknown" d="M${profile.anchors.necklineLeft} ${profile.anchors.bustY - 10} Q135 ${profile.anchors.bustY + 8} ${profile.anchors.necklineRight} ${profile.anchors.bustY - 10}" fill="none" stroke="${edge}" stroke-width="2" stroke-dasharray="6 5"/>`
        : `<path data-layer="neckline-detail" data-shape="${dress.neckline}" d="${necklinePathFor(dress.neckline, profile.anchors)}" fill="none" stroke="${edge}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  const waistCueY = waist;
  const waistCue =
    dress.waistline === "unknown" || view === "back"
      ? ""
      : `<path data-layer="waist-detail" data-shape="${dress.waistline}" d="M${profile.anchors.waistLeft} ${waistCueY} Q135 ${dress.waistline === "basque" ? waistCueY + 8 : waistCueY + 3} ${profile.anchors.waistRight} ${waistCueY}" fill="none" stroke="${edge}" stroke-opacity=".58" stroke-width="1.8" stroke-linecap="round"/>`;
  const trainMarkup =
    view === "upper" || !train
      ? ""
      : `<path data-layer="train" data-shape="${dress.train}" data-attachment="hem" data-reach="${train.reach}" data-base-inset="${train.baseInset}" d="${train.outline}" fill="url(#${ids.garmentGradient})" fill-opacity=".82" stroke="${edge}" stroke-opacity=".55" stroke-width="1.35" stroke-linejoin="round"/><path data-layer="train-attachment" d="${train.attachment}" fill="none" stroke="${edge}" stroke-opacity=".2" stroke-width="1.2" stroke-linecap="round"/><path data-layer="train-fold" clip-path="url(#${ids.trainMask})" d="${train.fold}" fill="${dressRenderTokens.garmentHighlight}" fill-opacity=".24" stroke="none"/>`;
  return `<g data-layer="garment" data-profile="${profileKey}">${silhouettePathMarkup}${renderVolumeLayers({ ids, volume: profile.volume(waist), profileKey, anchors: profile.anchors, transition, fabric: dress.fabric })}${bodiceStructureMarkup(profile, transition, edge, view)}${top}${neckline}${waistCue}${trainMarkup}</g>`;
}

function allUnknown(dress: Dress, view: DressSketchView) {
  const values =
    view === "full"
      ? [
          dress.topStyle,
          dress.neckline,
          dress.silhouette,
          dress.waistline,
          dress.color,
          dress.train,
        ]
      : view === "upper"
        ? [dress.topStyle, dress.neckline, dress.waistline, dress.color]
        : [
            dress.backStyle ?? "unknown",
            dress.silhouette,
            dress.train,
            dress.color,
          ];
  return values.every((value) => value === "unknown");
}

type PreparedArtworkMarkup = {
  readonly definitions: string;
  readonly content: string;
};

function preparedArtworkMarkup(
  artwork: GarmentArtworkResult | undefined,
  view: DressSketchView,
  viewportClipId: string,
): PreparedArtworkMarkup {
  if (!artwork || artwork.view !== view)
    return { definitions: "", content: "" };
  const openEnd = artwork.markup.indexOf(">", artwork.markup.indexOf("<svg"));
  const closeStart = artwork.markup.lastIndexOf("</svg>");
  if (openEnd < 0 || closeStart <= openEnd)
    return { definitions: "", content: "" };
  const inner = artwork.markup.slice(openEnd + 1, closeStart);
  const definitions =
    inner.match(/<defs(?:\s[^>]*)?>[\s\S]*?<\/defs>/)?.[0] ?? "";
  const content = inner
    .replace(definitions, "")
    .replace(/<title>[\s\S]*?<\/title>/g, "")
    .trim();
  if (!content) return { definitions, content: "" };

  const source = artwork.viewBox;
  const sourceCenterX = artwork.layers[0]?.asset.anchors.centerX ?? 180;
  const targetCenterX = view === "upper" ? source.x + source.width / 2 : 135;
  const registration = Number((targetCenterX - sourceCenterX).toFixed(4));
  const viewportClip = `<clipPath id="${viewportClipId}" clipPathUnits="userSpaceOnUse"><rect x="${source.x}" y="${source.y}" width="${source.width}" height="${source.height}"/></clipPath>`;
  const viewport = `<g data-layer="prepared-viewport" data-viewbox="${source.x} ${source.y} ${source.width} ${source.height}" clip-path="url(#${viewportClipId})">${content}</g>`;
  const assetIds = artwork.assetIds.join(",");
  const missingFields = artwork.missingFields.join(",");
  return {
    definitions: `${definitions}${viewportClip}`,
    content: `<g data-layer="prepared-garment" data-view="${artwork.view}" data-state="${artwork.status}" data-asset-ids="${escapeXml(assetIds)}" data-missing-fields="${escapeXml(missingFields)}" transform="translate(${registration} 0)">${viewport}</g>`,
  };
}

export function dressSvgMarkup(
  dress: Dress,
  faceDataUrl?: string,
  includeFace = false,
  view: DressSketchView = "full",
  mode: DressSketchMode = "annotated",
  options: DressSvgMarkupOptions = {},
) {
  const faceAllowed = view !== "back" && includeFace && Boolean(faceDataUrl);
  const ids = createSvgIds(dress, view, mode, options.namespace);
  const waist = waistFor(dress);
  const profile = profileFor(dress);
  const bodyPath = garmentPath(dress, view, waist, profile);
  const train = view === "upper" ? undefined : trainGeometry(dress);
  const sleeveMaskPath =
    view === "back" || dress.topStyle === "unknown"
      ? undefined
      : sleeveMaskPathFor(dress.topStyle, profile.anchors);
  const prepared = preparedArtworkMarkup(
    options.preparedArtwork,
    view,
    `${ids.garmentMask}-prepared-viewport`,
  );
  const hasExplicitArtwork = options.preparedArtwork?.view === view;
  const usesPreparedArtwork =
    hasExplicitArtwork &&
    options.preparedArtwork.assetIds.length > 0 &&
    prepared.content.length > 0;
  const usesPreparedPlaceholder =
    hasExplicitArtwork &&
    options.preparedArtwork.status === "partial" &&
    !usesPreparedArtwork;
  const faceAnchorX =
    usesPreparedArtwork && view === "upper"
      ? options.preparedArtwork.viewBox.x +
        options.preparedArtwork.viewBox.width / 2
      : mode === "visual" && usesPreparedPlaceholder && view === "full"
        ? 180
        : 135;
  const defs = `${usesPreparedArtwork ? prepared.definitions : ""}${renderDefinitions({ ids, bodyPath, fill: dressRenderTokens.garmentColor[dress.color], sleeveMaskPath, trainPath: train?.outline })}${faceAllowed ? `<defs>${`<clipPath id="${ids.faceMask}"><ellipse cx="${faceAnchorX}" cy="116" rx="28" ry="32"/></clipPath>`}</defs>` : ""}`;
  const faceTransform = faceAllowed ? dress.faceTransform : undefined;
  const face =
    faceAllowed && faceDataUrl
      ? `<g data-layer="face" clip-path="url(#${ids.faceMask})"><image href="${escapeXml(faceDataUrl)}" x="${faceAnchorX - 36}" y="79" width="72" height="76" preserveAspectRatio="xMidYMid slice" transform="translate(${(faceTransform?.x ?? 0) * 18} ${(faceTransform?.y ?? 0) * 15}) rotate(${faceTransform?.rotation ?? 0} ${faceAnchorX} 117) translate(${faceAnchorX} 117) scale(${faceTransform?.scale ?? 1}) translate(-${faceAnchorX} -117)"/></g>`
      : "";
  const fabricKnown = dress.fabric !== "unknown";
  const fabricMark =
    dress.fabric === "unknown" ? "" : fabricMarks[dress.fabric];
  const supportingAnnotations =
    mode === "visual" || view === "upper"
      ? ""
      : `<g data-layer="fabric-swatch" data-material="${dress.fabric}"${fabricKnown ? "" : ' data-state="unknown"'} color="${dressRenderTokens.garmentEdge[dress.color]}"><circle cx="270" cy="352" r="17" fill="${dressRenderTokens.garmentColor[dress.color]}" stroke="${dressRenderTokens.garmentEdge[dress.color]}"${fabricKnown ? "" : ' stroke-dasharray="4 3"'}/>${fabricMark}<text x="294" y="348" font-size="9" fill="${dressRenderTokens.volume.contourShadow}">소재</text><text x="294" y="363" font-size="10" font-weight="700" fill="${dressRenderTokens.garmentDropShadow}">${escapeXml(fabricKnown ? optionLabel(fabricOptions, dress.fabric) : "미기록")}</text></g>${renderAnnotations(dress, view)}`;
  const visual = mode === "visual";
  const visualPreparedUpper =
    visual &&
    view === "upper" &&
    (usesPreparedArtwork || usesPreparedPlaceholder);
  const visualPreparedFull =
    visual &&
    view === "full" &&
    (usesPreparedArtwork || usesPreparedPlaceholder);
  const visualPreparedBack =
    visual &&
    view === "back" &&
    (usesPreparedArtwork || usesPreparedPlaceholder);
  const preparedFullScale = usesPreparedArtwork ? 0.7 : 0.68;
  const preparedFullBounds =
    visualPreparedFull && options.preparedArtwork
      ? preparedArtworkVerticalBounds(options.preparedArtwork, faceAllowed)
      : undefined;
  const preparedFullTransform = preparedFullBounds
    ? `translate(${numberText(usesPreparedArtwork ? 65.5 : 37.6)} ${numberText(213.5 - preparedFullScale * ((preparedFullBounds.top + preparedFullBounds.bottom) / 2))}) scale(${numberText(preparedFullScale)})`
    : undefined;
  const preparedBackBounds =
    visualPreparedBack && options.preparedArtwork
      ? preparedArtworkVerticalBounds(options.preparedArtwork)
      : undefined;
  const preparedBackFrame = preparedBackBounds
    ? preparedArtworkFrameTransform({
        bounds: preparedBackBounds,
        sourceCenterX: usesPreparedArtwork ? 135 : 180,
        baseScale: 0.8,
        safeInset: 8,
      })
    : undefined;
  const preparedBackTransform = preparedBackFrame
    ? `translate(${numberText(preparedBackFrame.translateX)} ${numberText(preparedBackFrame.translateY)}) scale(${numberText(preparedBackFrame.scale)})`
    : undefined;
  const viewBox = visual
    ? visualPreparedUpper
      ? `${options.preparedArtwork.viewBox.x} ${options.preparedArtwork.viewBox.y} ${options.preparedArtwork.viewBox.width} ${options.preparedArtwork.viewBox.height}`
      : "0 0 320 427"
    : "0 0 360 640";
  const figureTransform = visual
    ? visualPreparedUpper
      ? undefined
      : visualPreparedFull
        ? preparedFullTransform
        : visualPreparedBack
          ? preparedBackTransform
          : view === "upper"
            ? "translate(-42 -130) scale(1.5)"
            : "translate(22 -58) scale(.8)"
    : view === "upper"
      ? "translate(0 74) scale(1.18)"
      : undefined;
  const heading = visual
    ? ""
    : `<text x="24" y="34" font-size="15" font-weight="700" fill="${dressRenderTokens.garmentDropShadow}">드레스 기억 스케치</text><text x="24" y="51" font-size="9" fill="${dressRenderTokens.volume.contourShadow}">${view === "full" ? "전체" : view === "upper" ? "상체" : "뒤태"} · 선택한 기록을 단순화한 그림</text>`;
  const background = visual
    ? `<rect width="100%" height="100%" fill="${dressRenderTokens.previewSurface}"/>`
    : `<rect width="360" height="640" fill="${dressRenderTokens.previewSurface}"/>`;
  const mannequin =
    usesPreparedArtwork || usesPreparedPlaceholder
      ? renderMannequin(undefined, false, {
          includeBody: false,
          includeNeck: false,
          includeArms: false,
          includeHead: false,
          includeFloorShadow: false,
        })
      : renderMannequin(
          sleeveMaskPath ? ids.sleeveMask : undefined,
          dress.silhouette === "teaLength" && view !== "upper",
        );
  const placeholderBounds = options.preparedArtwork?.viewBox ?? {
    x: 0,
    y: 0,
    width: 320,
    height: 427,
  };
  const placeholderInset = Math.min(
    12,
    Math.max(
      2,
      Math.min(placeholderBounds.width, placeholderBounds.height) / 10,
    ),
  );
  const placeholder = usesPreparedPlaceholder
    ? `<g data-layer="prepared-placeholder" data-view="${view}" data-state="${options.preparedArtwork?.status ?? "unavailable"}"><rect x="${placeholderBounds.x + placeholderInset}" y="${placeholderBounds.y + placeholderInset}" width="${Math.max(1, placeholderBounds.width - placeholderInset * 2)}" height="${Math.max(1, placeholderBounds.height - placeholderInset * 2)}" rx="8" fill="none" stroke="${dressRenderTokens.volume.contourShadow}" stroke-opacity=".45" stroke-width="2" stroke-dasharray="7 6"/><path d="M${placeholderBounds.x + placeholderBounds.width / 2} ${placeholderBounds.y + placeholderInset * 2} V${placeholderBounds.y + placeholderBounds.height - placeholderInset * 2}" stroke="${dressRenderTokens.volume.contourShadow}" stroke-opacity=".16" stroke-width="1" stroke-dasharray="3 5"/></g>`
    : "";
  const figureArtwork = usesPreparedArtwork
    ? `${prepared.content}${face}`
    : usesPreparedPlaceholder
      ? `${face}${placeholder}`
      : `${face}${garment(dress, view, visual, ids, train)}`;
  const preparedState =
    options.preparedArtwork?.view === view
      ? ` data-garment-state="${options.preparedArtwork.status}"`
      : "";
  const preparedReferenceMode =
    options.preparedArtwork?.view === view &&
    options.preparedArtwork.status === "partial" &&
    options.preparedArtwork.assetIds.length > 0
      ? ' data-reference-mode="form"'
      : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="${escapeXml(dress.label)} 드레스 기억 스케치" data-renderer="memory-sketch" data-view="${view}"${visual ? ' data-mode="visual"' : ""}${allUnknown(dress, view) ? ' data-state="unknown"' : ""}${preparedState}${preparedReferenceMode}>${defs}${background}${heading}<g data-layer="figure"${figureTransform ? ` transform="${figureTransform}"` : ""}>${mannequin}${figureArtwork}</g>${visual ? "" : renderFields(dress, view)}${supportingAnnotations}</svg>`;
}

export async function dressSvgToJpeg(
  dress: Dress,
  faceDataUrl?: string,
  includeFace = false,
  width = 720,
  height = 1280,
  view: DressSketchView = "full",
  options: DressSvgMarkupOptions = {},
): Promise<Uint8Array> {
  const blob = new Blob(
    [
      dressSvgMarkup(
        dress,
        faceDataUrl,
        includeFace,
        view,
        "annotated",
        options,
      ),
    ],
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
