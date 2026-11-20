import type { Dress } from "../../../types/domain";
import { resolveBackClosure } from "../../dress/backDetails";
import { findBackCore, findLowerAsset } from "./registry";
import {
  BACK_FIELDS,
  FRONT_FIELDS,
  assetIds,
  baseWarnings,
  duplicateDetails,
  finalize,
  hasCustomOption,
  partialWithoutImage,
  resolvedFields,
  unknownFields,
  unavailable,
} from "./recipeSupport";
import {
  fullFrontLayers,
  materialTextures,
  detailAssetsFor,
} from "./layerResolver";
import { layerJoinY } from "./modifiers";
import type {
  GarmentField,
  GarmentAsset,
  GarmentLayer,
  GarmentReason,
  GarmentStatus,
  GarmentTexture,
  GarmentView,
} from "./types";

function authoredLowStraplessUpper(
  dress: Dress,
  layers: readonly GarmentLayer[],
): readonly GarmentLayer[] {
  if (dress.topStyle !== "strapless" || dress.neckline !== "sweetheart") {
    return layers;
  }
  const lowUpper = findLowerAsset("mermaid", "natural");
  if (!lowUpper) return layers;
  return layers.map((layer) =>
    layer.region === "upper"
      ? {
          ...layer,
          asset: lowUpper,
          sourceJoinY: lowUpper.anchors.waistY,
        }
      : layer,
  );
}

function assetIdsWithDetails(
  layers: readonly GarmentLayer[],
  textures: readonly GarmentTexture[],
  details: readonly GarmentAsset[],
): readonly string[] {
  const primary = assetIds(layers, textures);
  return [
    ...primary,
    ...details
      .map(({ assetId }) => assetId)
      .filter((assetId) => !primary.includes(assetId)),
  ];
}

function frontRecipe(dress: Dress, view: "full" | "upper", namespace?: string) {
  const missing = unknownFields(dress, view);
  if (duplicateDetails(dress)) {
    return unavailable(
      view,
      dress.color,
      "duplicate-details",
      missing,
      "duplicate-details-no-match",
      namespace,
    );
  }
  // Crop the same complete composition for every upper comparison.
  const resolvedLayers = fullFrontLayers(dress);
  const layers = authoredLowStraplessUpper(dress, resolvedLayers);
  const custom = hasCustomOption(dress);
  if (layers.length === 0) {
    if (missing.length > 0 || custom) {
      return partialWithoutImage(
        view,
        dress.color,
        missing,
        custom ? "custom-option-unrendered" : "known-region-not-yet-rendered",
        custom ? "custom-option" : "unknown-field",
        namespace,
      );
    }
    return unavailable(
      view,
      dress.color,
      "no-match",
      missing,
      "front-composition-no-match",
      namespace,
    );
  }
  const unresolved: readonly GarmentField[] = missing;
  const status: GarmentStatus =
    unresolved.length > 0 || custom ? "partial" : "ready";
  const textures = materialTextures(dress, layers, true);
  const detailAssets = detailAssetsFor(dress, view);
  const reason: GarmentReason | undefined = custom
    ? "custom-option"
    : unresolved.length > 0
      ? "unknown-field"
      : undefined;
  const waistWarning =
    dress.silhouette === "empire" && dress.waistline === "natural"
      ? "empire-release-and-natural-waist-visible"
      : dress.waistline !== "natural"
        ? `waistline-${dress.waistline}-joined`
        : undefined;
  return finalize(
    {
      view,
      color: dress.color,
      topStyle: dress.topStyle,
      neckline: dress.neckline,
      silhouette: dress.silhouette,
      waistline: dress.waistline,
      fabric: dress.fabric,
      upperFabric: dress.upperFabric,
      lowerFabric: dress.lowerFabric,
      lowerFabricStart: dress.lowerFabricStart,
      train: dress.train,
      details: dress.details,
      status,
      reason,
      layers,
      textures,
      detailAssets,
      assetIds: assetIdsWithDetails(layers, textures, detailAssets),
      resolvedFields: resolvedFields(FRONT_FIELDS, unresolved),
      missingFields: unresolved,
      warnings: [
        ...baseWarnings(unresolved),
        ...(custom ? ["custom-option-unrendered"] : []),
        ...(waistWarning ? [waistWarning] : []),
        ...(dress.details.includes("backBow") && view === "full"
          ? ["backBow-view-scoped-to-back"]
          : []),
      ],
    },
    { namespace },
  );
}

function backRecipe(dress: Dress, namespace?: string) {
  const missing = unknownFields(dress, "back");
  if (duplicateDetails(dress)) {
    return unavailable(
      "back",
      dress.color,
      "duplicate-details",
      missing,
      "duplicate-details-no-match",
      namespace,
    );
  }
  const closure = resolveBackClosure(dress);
  const hasClosure = closure === "buttons" || closure === "laceUp";
  if (
    (!dress.backStyle || dress.backStyle === "unknown") &&
    !hasClosure &&
    !dress.details.includes("backBow")
  ) {
    return partialWithoutImage(
      "back",
      dress.color,
      missing,
      "back-construction-unknown",
      "unknown-field",
      namespace,
    );
  }
  const core = findBackCore();
  if (!core) {
    return unavailable(
      "back",
      dress.color,
      "missing-asset",
      missing,
      "neutral-back-asset-missing",
      namespace,
    );
  }
  const lower =
    dress.silhouette === "unknown"
      ? undefined
      : dress.silhouette === "aLine"
        ? core
        : (findLowerAsset(dress.silhouette, dress.waistline) ??
          findLowerAsset(
            dress.silhouette,
            dress.silhouette === "empire" ? "empire" : "natural",
          ));
  const layers: readonly GarmentLayer[] = [
    ...(lower
      ? [
          {
            asset: lower,
            region: "lower" as const,
            joinY: layerJoinY(lower, dress.waistline, "lower"),
            sourceJoinY: lower.anchors.waistY,
          },
        ]
      : []),
    {
      asset: core,
      region: "upper",
      topStyle: dress.topStyle,
      joinY: layerJoinY(core, dress.waistline, "upper"),
      sourceJoinY: core.anchors.waistY,
    },
  ];
  const custom = hasCustomOption(dress);
  const status: GarmentStatus =
    missing.length > 0 || custom ? "partial" : "ready";
  const textures = materialTextures(dress, layers);
  const detailAssets = detailAssetsFor(dress, "back");
  return finalize(
    {
      view: "back",
      color: dress.color,
      topStyle: dress.topStyle,
      neckline: dress.neckline,
      silhouette: dress.silhouette,
      waistline: dress.waistline,
      fabric: dress.fabric,
      upperFabric: dress.upperFabric,
      lowerFabric: dress.lowerFabric,
      backStyle: dress.backStyle ?? "unknown",
      backClosure: dress.backClosure,
      train: dress.train,
      details: dress.details,
      status,
      reason: custom
        ? "custom-option"
        : missing.length > 0
          ? "unknown-field"
          : undefined,
      layers,
      textures,
      detailAssets,
      assetIds: assetIdsWithDetails(layers, textures, detailAssets),
      resolvedFields: resolvedFields(BACK_FIELDS, missing),
      missingFields: missing,
      warnings: [
        ...baseWarnings(missing),
        ...(custom ? ["custom-option-unrendered"] : []),
      ],
    },
    { namespace },
  );
}

export function resolveGarmentRecipe(
  dress: Dress,
  view: GarmentView = "full",
  namespace?: string,
) {
  return view === "back"
    ? backRecipe(dress, namespace)
    : frontRecipe(dress, view, namespace);
}

export { buildGarmentArtworkMarkup } from "./markup";
