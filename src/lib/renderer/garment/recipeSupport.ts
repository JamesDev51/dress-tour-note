import type { Dress, DressColor } from "../../../types/domain";
import { buildGarmentArtworkMarkup } from "./markup";
import { viewBoxFor } from "./viewBounds";
import type {
  GarmentField,
  GarmentLayer,
  GarmentMarkupOptions,
  GarmentRecipe,
  GarmentReason,
  GarmentTexture,
  GarmentView,
} from "./types";

export const FRONT_FIELDS: readonly GarmentField[] = [
  "topStyle",
  "neckline",
  "silhouette",
  "waistline",
  "fabric",
  "color",
  "train",
  "details",
];

export const BACK_FIELDS: readonly GarmentField[] = [
  "silhouette",
  "waistline",
  "fabric",
  "color",
  "backStyle",
  "train",
  "details",
];

export function hasUnknownField(dress: Dress, field: GarmentField): boolean {
  switch (field) {
    case "topStyle":
      return dress.topStyle === "unknown";
    case "neckline":
      return dress.neckline === "unknown";
    case "silhouette":
      return dress.silhouette === "unknown";
    case "waistline":
      return dress.waistline === "unknown";
    case "fabric":
      return dress.fabric === "unknown";
    case "color":
      return dress.color === "unknown";
    case "backStyle":
      return !dress.backStyle || dress.backStyle === "unknown";
    case "train":
      return dress.train === "unknown";
    case "details":
      return false;
  }
}

export function unknownFields(
  dress: Dress,
  view: GarmentView,
): readonly GarmentField[] {
  const fields = view === "back" ? BACK_FIELDS : FRONT_FIELDS;
  return fields.filter((field) => hasUnknownField(dress, field));
}

export function hasCustomOption(dress: Dress): boolean {
  return Object.values(dress.customOptions ?? {}).some(
    (value) => typeof value === "string" && value.trim().length > 0,
  );
}

export function duplicateDetails(dress: Dress): boolean {
  return new Set(dress.details).size !== dress.details.length;
}

export function baseWarnings(
  missingFields: readonly GarmentField[],
): readonly string[] {
  return missingFields.map((field) => `${field}-unknown`);
}

type RecipeInput = Omit<
  GarmentRecipe,
  "markup" | "viewBox" | "logicalBounds" | "textures"
> & { readonly textures?: readonly GarmentTexture[] };

export function finalize(
  input: RecipeInput,
  options: GarmentMarkupOptions = {},
): GarmentRecipe {
  const base = {
    ...input,
    textures: input.textures ?? [],
    viewBox: viewBoxFor(input.view),
    logicalBounds: viewBoxFor(input.view),
    markup: "",
  } satisfies GarmentRecipe;
  return { ...base, markup: buildGarmentArtworkMarkup(base, options) };
}

export function unavailable(
  view: GarmentView,
  color: DressColor,
  reason: GarmentReason,
  missingFields: readonly GarmentField[],
  warning: string,
  namespace?: string,
): GarmentRecipe {
  return finalize(
    {
      view,
      color,
      status: "unavailable",
      reason,
      layers: [],
      assetIds: [],
      resolvedFields: [],
      missingFields,
      warnings: [warning],
    },
    { namespace },
  );
}

export function partialWithoutImage(
  view: GarmentView,
  color: DressColor,
  missingFields: readonly GarmentField[],
  warning: string,
  reason: GarmentReason = "unknown-field",
  namespace?: string,
): GarmentRecipe {
  return finalize(
    {
      view,
      color,
      status: "partial",
      reason,
      layers: [],
      assetIds: [],
      resolvedFields: resolvedFields(
        view === "back" ? BACK_FIELDS : FRONT_FIELDS,
        missingFields,
      ),
      missingFields,
      warnings: [...baseWarnings(missingFields), warning],
    },
    { namespace },
  );
}

export function resolvedFields(
  fields: readonly GarmentField[],
  missingFields: readonly GarmentField[],
): readonly GarmentField[] {
  return fields.filter((field) => !missingFields.includes(field));
}

export function assetIds(
  layers: readonly GarmentLayer[],
  textures: readonly GarmentTexture[],
): readonly string[] {
  return [...layers, ...textures]
    .map(({ asset }) => asset.assetId)
    .filter((assetId, index, all) => all.indexOf(assetId) === index);
}
