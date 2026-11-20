import type { Fabric, LowerFabricStart } from "../../../types/domain";
import type { GarmentRecipe, GarmentTexture } from "./types";
import { numberText } from "./svgUtils";

type Materials = {
  readonly fabric?: Fabric;
  readonly upperFabric?: Fabric;
  readonly lowerFabric?: Fabric;
  readonly lowerFabricStart?: LowerFabricStart;
};

export function materialTransitionStart(
  record: Materials,
): Exclude<LowerFabricStart, "waist"> | undefined {
  const upper = record.upperFabric ?? record.fabric ?? "unknown";
  const lower = record.lowerFabric ?? record.fabric ?? "unknown";
  return upper !== "unknown" &&
    lower !== "unknown" &&
    upper !== lower &&
    record.lowerFabricStart !== "waist"
    ? record.lowerFabricStart
    : undefined;
}

const skirtFractions = { hip: 0.18, thigh: 0.35, knee: 0.55 } as const;

/** Fabric boundaries use the existing skirt frame; they never move its waist. */
export function materialTransitionFor(
  recipe: GarmentRecipe,
  namespace: string,
) {
  const start = materialTransitionStart(recipe);
  const skirt = recipe.layers.find(({ region }) => region === "lower");
  if (!start || !skirt || recipe.view === "back") return undefined;
  const waist = skirt.joinY ?? skirt.asset.anchors.waistY ?? 170;
  const hem = skirt.asset.anchors.hemY ?? 554;
  const y = Number((waist + (hem - waist) * skirtFractions[start]).toFixed(2));
  const lace = (recipe.upperFabric ?? recipe.fabric) === "lace";
  const offsets = lace
    ? [0, 7, -5, 13, 2, -8, 9, -1, 4, -6, 15, -3]
    : [0, 0.5, -0.5, 0];
  const count = lace ? 24 : 8;
  let edge = `M0 ${numberText(y)}`;
  for (let index = 0; index < count; index += 1) {
    const width = 360 / count;
    const endY = y + offsets[(index + 1) % offsets.length];
    // Alternating lobes keep a lace applique edge organic rather than a seam.
    const controlY = lace
      ? y + 6 + offsets[index % offsets.length] * 1.3
      : y + offsets[index % offsets.length];
    edge += ` Q${numberText((index + 0.5) * width)} ${numberText(controlY)} ${numberText((index + 1) * width)} ${numberText(endY)}`;
  }
  const upperId = `${namespace}-material-boundary-upper`;
  const lowerId = `${namespace}-material-boundary-lower`;
  const definitions = `<clipPath id="${upperId}" clipPathUnits="userSpaceOnUse" data-material-boundary="upper"><path d="${edge} L360 0 H0 Z"/></clipPath><clipPath id="${lowerId}" clipPathUnits="userSpaceOnUse" data-material-boundary="lower"><path d="${edge} L360 640 H0 Z"/></clipPath>`;
  return {
    definitions,
    wrap(texture: GarmentTexture, markup: string) {
      if (texture.region !== "lower") return markup;
      const upper = texture.materialSection === "upper-extension";
      return `<g data-layer="material-transition" data-material-section="${upper ? "upper-extension" : "lower"}" data-material="${texture.asset.coverage.fabric ?? "unknown"}" data-lower-fabric-start="${start}" data-transition-y="${numberText(y)}" clip-path="url(#${upper ? upperId : lowerId})">${markup}</g>`;
    },
  };
}
