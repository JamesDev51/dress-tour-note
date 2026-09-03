import type { Dress, FaceTransform } from "../../types/domain";
import {
  dressForPresentation,
  type PresentedDress,
  type PresentedFabric,
} from "../dress/options";
import { dressRenderTokens } from "../dress/renderTokens";
import { loadDressFabricTexture } from "../image/dressFabric";
import {
  loadDressLayerAssets,
  type DressLayerAssets,
} from "../image/dressLayers";
import { loadDressPersonBase } from "../image/dressPerson";

const esc = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ] ?? character,
  );

const fabricTileSize = {
  unknown: 108,
  mikadoSatin: 96,
  lace: 96,
  organzaChiffon: 100,
  subtleBeaded: 110,
  ornateBeaded: 96,
  floral3D: 110,
} as const satisfies Record<PresentedFabric, number>;

const fabricOpacity = {
  unknown: { bodice: 0, skirt: 0, top: 0 },
  mikadoSatin: { bodice: 0.2, skirt: 0.28, top: 0.22 },
  lace: { bodice: 0.62, skirt: 0.72, top: 0.66 },
  organzaChiffon: { bodice: 0.42, skirt: 0.56, top: 0.48 },
  subtleBeaded: { bodice: 0.58, skirt: 0.68, top: 0.62 },
  ornateBeaded: { bodice: 0.72, skirt: 0.78, top: 0.74 },
  floral3D: { bodice: 0.7, skirt: 0.78, top: 0.72 },
} as const satisfies Record<
  PresentedFabric,
  { readonly bodice: number; readonly skirt: number; readonly top: number }
>;

function fabricPattern(dress: PresentedDress, id: string, dataUrl?: string) {
  if (!dataUrl) return "";
  const size = fabricTileSize[dress.fabric];
  return `<pattern id="p-${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse"><image href="${esc(dataUrl)}" x="0" y="0" width="${size}" height="${size}" preserveAspectRatio="xMidYMid slice"/></pattern>`;
}

function fabricAccent(dress: PresentedDress, id: string) {
  if (dress.fabric === "subtleBeaded")
    return `<pattern id="b-${id}" width="60" height="60" patternUnits="userSpaceOnUse"><circle cx="15" cy="18" r="1.4" fill="${dressRenderTokens.garmentHighlight}"/><circle cx="43" cy="39" r="1.1" fill="${dressRenderTokens.beadShadow}"/></pattern>`;
  if (dress.fabric === "ornateBeaded")
    return `<pattern id="b-${id}" width="46" height="46" patternUnits="userSpaceOnUse"><circle cx="9" cy="11" r="1.5" fill="${dressRenderTokens.garmentHighlight}"/><circle cx="34" cy="27" r="1.2" fill="${dressRenderTokens.ornateBeadShadow}"/><circle cx="18" cy="40" r=".9" fill="${dressRenderTokens.garmentHighlight}"/></pattern>`;
  return "";
}

function maskDefinition(id: string, name: string, dataUrl: string) {
  return `<mask id="${name}-${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="360" height="640"><image href="${esc(dataUrl)}" x="0" y="0" width="360" height="640" preserveAspectRatio="none"/></mask>`;
}

function garmentPart(
  layer: string,
  mask: string,
  garmentFill: string,
  textureFill: string,
  textureOpacity: number,
) {
  return `<g data-layer="raster-${layer}" mask="url(#${mask})"><rect width="360" height="640" fill="${garmentFill}"/><rect width="360" height="640" fill="${textureFill}" opacity="${textureOpacity}"/></g>`;
}

function dressLayers(
  dress: PresentedDress,
  id: string,
  assets: DressLayerAssets,
  textureDataUrl?: string,
) {
  const edge = dressRenderTokens.garmentEdge[dress.color];
  const opacity = fabricOpacity[dress.fabric];
  const pattern = fabricPattern(dress, id, textureDataUrl);
  const textureFill = pattern ? `url(#p-${id})` : "none";
  const accent = fabricAccent(dress, id);
  const topMask = assets.top ? maskDefinition(id, "top-mask", assets.top) : "";
  const skirtMask = `<mask id="skirt-mask-${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="360" height="700"><image href="${esc(assets.skirt)}" x="0" y="-20" width="360" height="690" preserveAspectRatio="none"/></mask>`;
  const combinedTop = assets.top
    ? `<image href="${esc(assets.top)}" x="0" y="0" width="360" height="640" preserveAspectRatio="none"/>`
    : "";
  const defs = `${pattern}${accent}<linearGradient id="g-${id}" x1="0" x2="1"><stop stop-color="${edge}"/><stop offset=".18" stop-color="${dressRenderTokens.garmentColor[dress.color]}"/><stop offset=".52" stop-color="${dressRenderTokens.garmentHighlight}"/><stop offset=".82" stop-color="${dressRenderTokens.garmentColor[dress.color]}"/><stop offset="1" stop-color="${edge}"/></linearGradient>${maskDefinition(id, "bodice-mask", assets.bodice)}${skirtMask}${topMask}<mask id="garment-mask-${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="360" height="700"><image href="${esc(assets.skirt)}" x="0" y="-20" width="360" height="690" preserveAspectRatio="none"/><image href="${esc(assets.bodice)}" x="0" y="0" width="360" height="640" preserveAspectRatio="none"/>${combinedTop}</mask><filter id="s-${id}" x="-30%" y="-20%" width="160%" height="150%"><feDropShadow dx="0" dy="0" stdDeviation=".65" flood-color="${edge}" flood-opacity=".9"/><feDropShadow dx="0" dy="10" stdDeviation="10" flood-color="${dressRenderTokens.garmentDropShadow}" flood-opacity=".18"/></filter>`;
  const skirt = `<g data-layer="raster-skirt" mask="url(#skirt-mask-${id})"><rect width="360" height="700" fill="url(#g-${id})"/><rect width="360" height="700" fill="${textureFill}" opacity="${opacity.skirt}"/></g>`;
  const top = assets.top
    ? garmentPart(
        "top",
        `top-mask-${id}`,
        `url(#g-${id})`,
        textureFill,
        opacity.top,
      )
    : "";
  const accentLayer = accent
    ? `<g data-layer="fabric-accent" mask="url(#garment-mask-${id})" opacity="${dress.fabric === "subtleBeaded" ? 0.56 : 0.38}"><rect width="360" height="640" fill="url(#b-${id})"/></g>`
    : "";
  const mermaidVolume = assets.mermaidVolume
    ? `<image data-layer="raster-mermaid-volume" href="${esc(assets.mermaidVolume)}" x="0" y="0" width="360" height="640" preserveAspectRatio="none" mask="url(#garment-mask-${id})"/>`
    : "";
  const empireVolume = assets.empireVolume
    ? `<image data-layer="raster-empire-volume" href="${esc(assets.empireVolume)}" x="0" y="0" width="360" height="640" preserveAspectRatio="none" mask="url(#garment-mask-${id})"/>`
    : "";
  const markup = `<g data-layer="dress-fit" data-renderer="raster-layers" transform="translate(0 -18)" filter="url(#s-${id})">${skirt}${garmentPart("bodice", `bodice-mask-${id}`, `url(#g-${id})`, textureFill, opacity.bodice)}${top}${accentLayer}<image data-layer="raster-volume-shadow" href="${esc(assets.shadow)}" x="0" y="0" width="360" height="640" preserveAspectRatio="none" mask="url(#garment-mask-${id})" opacity=".72"/><image data-layer="raster-volume-highlight" href="${esc(assets.highlight)}" x="0" y="0" width="360" height="640" preserveAspectRatio="none" mask="url(#garment-mask-${id})" opacity=".72"/>${mermaidVolume}${empireVolume}</g>`;
  return { defs, markup };
}

export function dressSvgMarkup(
  dress: Dress,
  personDataUrl: string,
  layerAssets: DressLayerAssets,
  faceDataUrl?: string,
  includeFace = true,
  fabricTextureDataUrl?: string,
) {
  const presented = dressForPresentation(dress);
  const id = esc(
    presented.id.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 18) || "dress",
  );
  const layers = dressLayers(presented, id, layerAssets, fabricTextureDataUrl);
  const transform: FaceTransform = presented.faceTransform ?? {
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  };
  const face =
    includeFace && faceDataUrl
      ? `<g mask="url(#face-mask-${id})"><image data-layer="face" href="${esc(faceDataUrl)}" x="120" y="10" width="120" height="126" preserveAspectRatio="xMidYMid slice" transform="translate(${transform.x * 34} ${transform.y * 28}) rotate(${transform.rotation} 180 72) translate(${180 * (1 - transform.scale)} ${72 * (1 - transform.scale)}) scale(${transform.scale})"/></g>`
      : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 640" role="img" aria-label="${esc(presented.label)} 드레스 패션 일러스트"><defs><radialGradient id="face-fade-${id}"><stop offset=".76" stop-color="${dressRenderTokens.garmentHighlight}"/><stop offset="1" stop-color="${dressRenderTokens.garmentHighlight}" stop-opacity="0"/></radialGradient><mask id="face-mask-${id}"><ellipse cx="180" cy="72" rx="49" ry="55" fill="url(#face-fade-${id})"/></mask>${layers.defs}</defs><rect width="360" height="640" fill="${dressRenderTokens.previewSurface}"/><ellipse cx="180" cy="622" rx="118" ry="12" fill="${dressRenderTokens.floorShadow}" opacity=".24"/><image data-layer="raster-mannequin" href="${esc(personDataUrl)}" x="0" y="0" width="360" height="640" preserveAspectRatio="xMidYMid meet"/>${face}${layers.markup}</svg>`;
}

export async function dressSvgToJpeg(
  dress: Dress,
  faceDataUrl?: string,
  includeFace = true,
  width = 720,
  height = 1280,
): Promise<Uint8Array> {
  const presented = dressForPresentation(dress);
  const [personDataUrl, textureDataUrl, layerAssets] = await Promise.all([
    loadDressPersonBase(),
    loadDressFabricTexture(presented.fabric).catch(() => undefined),
    loadDressLayerAssets(presented),
  ]);
  const svg = dressSvgMarkup(
    presented,
    personDataUrl,
    layerAssets,
    faceDataUrl,
    includeFace,
    textureDataUrl,
  );
  const blob = new Blob([svg], { type: "image/svg+xml" });
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
