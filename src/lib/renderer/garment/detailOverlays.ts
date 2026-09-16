import type { DressDetail } from "../../../types/domain";
import type { GarmentAsset, GarmentRecipe } from "./types";
import {
  joinYFor,
  slitMaskId,
  type DetailAssetRefs,
  type ModifierAssetRef,
} from "./modifiers";
import { sourceIndexFor } from "./markupParts";
import { numberText } from "./svgUtils";

const BOW_BOUNDS = { x: 222, y: 145 } as const;
const BOW_KNOT = { x: 620, y: 374 } as const;
const PHOTO_SCALE = 0.08;

type DetailRegion = "upper" | "lower";

function sourceAssetsFor(recipe: GarmentRecipe): readonly GarmentAsset[] {
  return [
    ...recipe.layers.map(({ asset }) => asset),
    ...recipe.textures.map(({ asset }) => asset),
    ...(recipe.detailAssets ?? []),
  ].filter(
    (asset, index, assets) =>
      assets.findIndex((candidate) => candidate.assetId === asset.assetId) ===
      index,
  );
}

function photoAssetFor(
  recipe: GarmentRecipe,
  region: DetailRegion,
): GarmentAsset | undefined {
  return (
    recipe.textures.find((texture) => texture.region === region)?.asset ??
    recipe.layers.find((layer) => layer.region === region)?.asset ??
    recipe.layers.find((layer) => layer.region === "full")?.asset
  );
}

function bowPlacement(
  anchorX: number,
  anchorY: number,
): { readonly x: number; readonly y: number } {
  return {
    x: anchorX - (BOW_KNOT.x - BOW_BOUNDS.x) * PHOTO_SCALE,
    y: anchorY - (BOW_KNOT.y - BOW_BOUNDS.y) * PHOTO_SCALE,
  };
}

function detailClipId(namespace: string, detail: string): string {
  return `${namespace}-detail-${detail}-photo-clip`;
}

function clipPathMarkup(id: string, paths: readonly string[]): string {
  return `<clipPath id="${id}" clipPathUnits="userSpaceOnUse" data-clip-rule="nonzero-union">${paths.map((path) => `<path d="${path}" fill-rule="nonzero" clip-rule="nonzero"/>`).join("")}</clipPath>`;
}

function photoDetailMarkup(
  recipe: GarmentRecipe,
  context: DetailAssetRefs,
  detail: string,
  region: DetailRegion,
  clipId: string,
  transform = "",
  opacity?: number,
): string {
  const asset = photoAssetFor(recipe, region);
  if (!asset) return "";
  const sourceAssets = sourceAssetsFor(recipe);
  const sourceIndex = sourceIndexFor(sourceAssets, asset.assetId);
  const alpha =
    opacity === undefined ? "" : ` opacity="${numberText(opacity)}"`;
  return `<g data-layer="detail-photo" data-detail="${detail}" data-renderer="photo-${detail}" data-material="${asset.coverage.fabric ?? "unknown"}" data-source-region="${region}" clip-path="url(#${clipId})"${transform ? ` transform="${transform}"` : ""}${alpha}><use data-layer="detail-photo-source" data-detail="${detail}" data-asset-id="${asset.assetId}" href="#${context.namespace}-source-${sourceIndex}" filter="url(#${context.matteFilterId})"/></g>`;
}

function overskirtPaths(y: number): readonly string[] {
  const bottom = 590;
  return [
    `M180 ${numberText(y + 2)} C164 206 143 269 124 342 C103 421 77 510 34 ${bottom - 4} C74 ${bottom - 14} 117 ${bottom - 3} 160 ${bottom} C168 522 173 416 177 309 C179 248 180 204 180 ${numberText(y + 2)} Z`,
    `M180 ${numberText(y + 2)} C196 206 217 269 236 342 C257 421 283 510 326 ${bottom - 4} C286 ${bottom - 14} 243 ${bottom - 3} 200 ${bottom} C192 522 187 416 183 309 C181 248 180 204 180 ${numberText(y + 2)} Z`,
  ];
}

function drapingPaths(y: number): readonly string[] {
  return [
    `M140 112 C155 120 168 136 180 ${numberText(y - 8)} L174 ${numberText(y + 6)} C160 147 150 135 140 122 Z`,
    `M220 112 C205 120 192 136 180 ${numberText(y - 8)} L186 ${numberText(y + 6)} C200 147 210 135 220 122 Z`,
    `M148 125 C160 138 171 151 180 ${numberText(y - 2)} L176 ${numberText(y + 8)} C165 153 155 143 146 133 Z`,
  ];
}

function sheerPaths(): readonly string[] {
  return [
    "M141 74 H219 V121 C205 111 194 120 180 132 C166 120 155 111 141 121 Z",
  ];
}

const FLORAL_BOUNDS = { x: 260, y: 191 } as const;
const FLORAL_ANCHOR = { x: 663, y: 577 } as const;
const FLORAL_SCALE = 0.05;

function detailColor(recipe: GarmentRecipe): string {
  return recipe.color === "champagne" ? "#775b42" : "#66584e";
}

function detailImageUse(
  ref: ModifierAssetRef | undefined,
  context: DetailAssetRefs,
  detail: string,
  x: number,
  y: number,
  scale: number,
  bounds: { readonly x: number; readonly y: number },
): string {
  if (!ref) return "";
  const tx = x - bounds.x * scale;
  const ty = y - bounds.y * scale;
  const filterId = ref.filterId ?? context.matteFilterId;
  return `<use data-layer="detail-photo" data-detail="${detail}" data-asset-id="${ref.asset.assetId}" href="#${context.namespace}-source-${ref.sourceIndex}" filter="url(#${filterId})" transform="translate(${numberText(tx)} ${numberText(ty)}) scale(${numberText(scale)})"/>`;
}

function detailPath(
  detail: DressDetail,
  recipe: GarmentRecipe,
  edge: string,
  context: DetailAssetRefs,
): string {
  if (
    recipe.view === "back" &&
    [
      "corset",
      "draping",
      "waistBow",
      "pearl",
      "sequin",
      "floral",
      "slit",
      "overskirt",
    ].includes(detail)
  ) {
    return "";
  }
  if (
    recipe.view === "upper" &&
    ["slit", "overskirt", "backBow"].includes(detail)
  ) {
    return "";
  }
  const y = joinYFor(recipe.waistline);
  const silhouette = recipe.silhouette;
  switch (detail) {
    case "corset":
      return `<g data-detail="corset" fill="none" stroke="${edge}" stroke-opacity=".62" stroke-width="1.25"><path d="M157 103 C159 123 158 145 154 ${numberText(y - 4)}"/><path d="M166 101 C168 126 167 148 165 ${numberText(y - 3)}"/><path d="M194 101 C192 126 193 148 195 ${numberText(y - 3)}"/><path d="M203 103 C201 123 202 145 206 ${numberText(y - 4)}"/></g>`;
    case "draping": {
      const clipId = detailClipId(context.namespace, "draping");
      const photo = photoDetailMarkup(
        recipe,
        context,
        "draping",
        "upper",
        clipId,
      );
      return `<g data-detail="draping" data-renderer="photo-draping" data-attachment="bodice-cross-drape">${photo}<path d="M145 116 C158 130 165 143 177 ${numberText(y - 8)}" fill="none" stroke="#fffaf1" stroke-opacity=".62" stroke-width="1.35" stroke-linecap="round"/><path d="M215 116 C202 130 195 143 183 ${numberText(y - 8)}" fill="none" stroke="#fffaf1" stroke-opacity=".62" stroke-width="1.35" stroke-linecap="round"/><path d="M148 126 C160 139 168 149 178 ${numberText(y - 2)}" fill="none" stroke="#fffaf1" stroke-opacity=".48" stroke-width="1.15" stroke-linecap="round"/></g>`;
    }
    case "waistBow":
      if (recipe.view === "back") return "";
      if (context.bow) {
        const placement = bowPlacement(180, y);
        return `<g data-detail="waistBow" data-attachment="front-waist" data-anchor="waist-knot" data-anchor-y="${numberText(y)}">${detailImageUse(context.bow, context, "waistBow", placement.x, placement.y, PHOTO_SCALE, BOW_BOUNDS)}</g>`;
      }
      return `<g data-detail="waistBow" fill="#fffaf1" fill-opacity=".48" stroke="${edge}" stroke-opacity=".68" stroke-width="1.15"><path d="M180 ${numberText(y)} C167 ${numberText(y - 10)} 151 ${numberText(y - 13)} 151 ${numberText(y - 3)} C151 ${numberText(y + 5)} 167 ${numberText(y + 3)} 180 ${numberText(y)} C193 ${numberText(y + 3)} 209 ${numberText(y + 5)} 209 ${numberText(y - 3)} C209 ${numberText(y - 13)} 193 ${numberText(y - 10)} 180 ${numberText(y)} Z"/><path d="M180 ${numberText(y)} C175 ${numberText(y + 10)} 171 ${numberText(y + 18)} 164 ${numberText(y + 23)} M180 ${numberText(y)} C185 ${numberText(y + 10)} 189 ${numberText(y + 18)} 196 ${numberText(y + 23)}" fill="none"/></g>`;
    case "backBow":
      if (recipe.backStyle === "bowBack") return "";
      if (context.bow && recipe.view === "back") {
        const placement = bowPlacement(180, y);
        return `<g data-detail="backBow" data-attachment="center-back" data-anchor="back-waist-knot" data-anchor-y="${numberText(y)}">${detailImageUse(context.bow, context, "backBow", placement.x, placement.y, PHOTO_SCALE, BOW_BOUNDS)}</g>`;
      }
      return recipe.view === "back"
        ? `<g data-detail="backBow" fill="#fffaf1" fill-opacity=".5" stroke="${edge}" stroke-opacity=".72" stroke-width="1.2"><path d="M180 228 C166 215 148 214 148 229 C148 242 166 242 180 232 C194 242 212 242 212 229 C212 214 194 215 180 228 Z"/><path d="M180 230 C176 245 171 255 165 262 M180 230 C184 245 189 255 195 262" fill="none"/></g>`
        : "";
    case "pearl":
      return `<g data-detail="pearl" fill="#fffaf1" fill-opacity=".82" stroke="${edge}" stroke-opacity=".34" stroke-width=".65">${[0, 1, 2, 3, 4, 5].map((index) => `<circle cx="180" cy="${numberText(116 + index * 9)}" r="2.25"/>`).join("")}</g>`;
    case "sequin":
      return `<g data-detail="sequin" fill="#fffaf1" fill-opacity=".68" stroke="${edge}" stroke-opacity=".44" stroke-width=".55">${[0, 1, 2, 3, 4, 5, 6].map((index) => `<path d="M${numberText(164 + (index % 2) * 32)} ${numberText(113 + index * 10)} l2.5 3.5 -2.5 3.5 -2.5 -3.5 Z"/>`).join("")}</g>`;
    case "floral":
      if (context.floral) {
        const x = 180 - (FLORAL_ANCHOR.x - FLORAL_BOUNDS.x) * FLORAL_SCALE;
        const floralY =
          136 - (FLORAL_ANCHOR.y - FLORAL_BOUNDS.y) * FLORAL_SCALE;
        return `<g data-detail="floral" data-attachment="front-applique" data-anchor="applique-center" data-anchor-x="180" data-anchor-y="136">${detailImageUse(context.floral, context, "floral", x, floralY, FLORAL_SCALE, FLORAL_BOUNDS)}</g>`;
      }
      return `<g data-detail="floral" fill="#fffaf1" fill-opacity=".54" stroke="${edge}" stroke-opacity=".52" stroke-width=".85"><circle cx="151" cy="143" r="5"/><circle cx="151" cy="135" r="4"/><circle cx="159" cy="143" r="4"/><circle cx="151" cy="151" r="4"/><circle cx="143" cy="143" r="4"/><circle cx="151" cy="143" r="2"/><circle cx="214" cy="${numberText(Math.min(300, y + 80))}" r="5"/><circle cx="214" cy="${numberText(Math.min(300, y + 72))}" r="4"/><circle cx="222" cy="${numberText(Math.min(300, y + 80))}" r="4"/><circle cx="206" cy="${numberText(Math.min(300, y + 80))}" r="4"/><circle cx="214" cy="${numberText(Math.min(300, y + 88))}" r="4"/><circle cx="214" cy="${numberText(Math.min(300, y + 80))}" r="2"/></g>`;
    case "slit": {
      if (recipe.view !== "full") return "";
      const end = recipe.silhouette === "teaLength" ? 435 : 636;
      return `<g data-detail="slit" data-renderer="constructed-slit" data-attachment="front-skirt-opening" fill="none" stroke="${edge}" stroke-opacity=".7" stroke-width="1.55" stroke-linecap="round"><path d="M188 ${numberText(y + 8)} C190 244 192 340 192 ${numberText(end)}"/><path d="M208 ${numberText(y + 8)} C210 244 212 340 218 ${numberText(end)}"/><path d="M192 ${numberText(end)} C201 ${numberText(end - 3)} 210 ${numberText(end - 3)} 218 ${numberText(end)}" stroke="#fffaf1" stroke-opacity=".72" stroke-width="1.1"/></g>`;
    }
    case "sheer": {
      const clipId = detailClipId(context.namespace, "sheer");
      const photo = photoDetailMarkup(
        recipe,
        context,
        "sheer",
        "upper",
        clipId,
        "",
        0.62,
      );
      return `<g data-detail="sheer" data-renderer="photo-sheer" data-attachment="illusion-bodice-panel">${photo}<path d="M141 74 H219 V121 C205 111 194 120 180 132 C166 120 155 111 141 121 Z" fill="none" stroke="#fffaf1" stroke-opacity=".62" stroke-width="1.15"/><path d="M150 80 L211 118 M162 76 L219 111 M198 76 L142 112" fill="none" stroke="#fffaf1" stroke-opacity=".5" stroke-width=".75"/></g>`;
    }
    case "detachableSleeve":
      return `<g data-detail="detachableSleeve" fill="#fffaf1" fill-opacity=".12" stroke="${edge}" stroke-opacity=".62" stroke-width="1.25"><path d="M137 111 C122 125 116 146 111 170 L103 204 C108 211 116 211 123 204 L138 164"/><path d="M223 111 C238 125 244 146 249 170 L257 204 C252 211 244 211 237 204 L222 164"/></g>`;
    case "overskirt": {
      if (recipe.view !== "full") return "";
      const clipId = detailClipId(context.namespace, "overskirt");
      const photo = photoDetailMarkup(
        recipe,
        context,
        "overskirt",
        "lower",
        clipId,
        "translate(0 3) scale(1 1.02)",
        0.94,
      );
      return `<g data-detail="overskirt" data-renderer="photo-overskirt" data-attachment="waist-draped-panels" data-material-source="selected-lower-layer">${photo}<path d="M180 ${numberText(y + 2)} C164 206 143 269 124 342 C103 421 77 510 34 586" fill="none" stroke="#fffaf1" stroke-opacity=".52" stroke-width="1.15" stroke-linecap="round"/><path d="M180 ${numberText(y + 2)} C196 206 217 269 236 342 C257 421 283 510 326 586" fill="none" stroke="#fffaf1" stroke-opacity=".52" stroke-width="1.15" stroke-linecap="round"/><path d="M160 590 C166 520 172 420 177 309 M200 590 C194 520 188 420 183 309" fill="none" stroke="#806b5a" stroke-opacity=".34" stroke-width=".95"/></g>`;
    }
    case "buttons":
      return `<g data-detail="buttons" fill="#fffaf1" fill-opacity=".78" stroke="${edge}" stroke-opacity=".54" stroke-width=".8">${[0, 1, 2, 3, 4, 5, 6, 7].map((index) => `<circle cx="180" cy="${numberText(166 + index * 11)}" r="2"/>`).join("")}</g>`;
  }
}

export function detailDefinitions(
  recipe: GarmentRecipe,
  namespace: string,
): string {
  if (recipe.view !== "full") return "";
  const details = recipe.details ?? [];
  const y = joinYFor(recipe.waistline);
  const definitions: string[] = [];
  if (details.includes("slit")) {
    const end = recipe.silhouette === "teaLength" ? 435 : 636;
    const path = `M188 ${numberText(y + 8)} C190 244 192 340 192 ${numberText(end)} C201 ${numberText(end + 2)} 210 ${numberText(end + 2)} 218 ${numberText(end)} C212 340 210 244 208 ${numberText(y + 8)} Z`;
    definitions.push(
      `<mask id="${slitMaskId(namespace)}" data-detail="slit" data-renderer="constructed-slit" maskUnits="userSpaceOnUse" mask-type="luminance" style="mask-type:luminance"><rect width="360" height="640" fill="white"/><path d="${path}" fill="black" fill-rule="nonzero"/></mask>`,
    );
  }
  if (details.includes("overskirt") && photoAssetFor(recipe, "lower")) {
    definitions.push(
      clipPathMarkup(detailClipId(namespace, "overskirt"), overskirtPaths(y)),
    );
  }
  if (details.includes("draping") && photoAssetFor(recipe, "upper")) {
    definitions.push(
      clipPathMarkup(detailClipId(namespace, "draping"), drapingPaths(y)),
    );
  }
  if (details.includes("sheer") && photoAssetFor(recipe, "upper")) {
    definitions.push(
      clipPathMarkup(detailClipId(namespace, "sheer"), sheerPaths()),
    );
  }
  return definitions.join("");
}

export function detailMarkup(
  recipe: GarmentRecipe,
  context: DetailAssetRefs,
): string {
  const details = recipe.details ?? [];
  if (details.length === 0) return "";
  const edge = detailColor(recipe);
  const rendered = details
    .map((detail) => detailPath(detail, recipe, edge, context))
    .filter((markup) => markup.length > 0)
    .join("");
  return rendered ? `<g data-layer="detail-overlays">${rendered}</g>` : "";
}
