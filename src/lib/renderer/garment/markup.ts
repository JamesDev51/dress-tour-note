import type {
  GarmentAsset,
  GarmentLayer,
  GarmentMarkupOptions,
  GarmentRecipe,
  GarmentTexture,
} from "./types";
import { trainMarkup, waistMarkup } from "./modifiers";
import { detailDefinitions, detailMarkup } from "./detailOverlays";
import { FULL_VIEW_BOX, viewBoxText } from "./viewBounds";
import { matteFilterMarkup } from "./matteFilter";
import { escapeXml } from "./svgUtils";
import { createGarmentNamespace } from "./namespace";
import {
  clipPathFor,
  lowerTextureClipPath,
  maskIdFor,
  necklineMaskMarkup,
  sourceImageMarkup,
  sourceIndexFor,
  textureMaskId,
  textureMaskMarkup,
  textureUseMarkup,
  upperTextureClipPath,
  upperSelectionForLayer,
  type UpperSelectionRuntime,
  useMarkup,
} from "./markupParts";
import {
  backConstructionFor,
  photoWarpTextureMarkup,
  waistTransitionMarkup,
} from "./compositionMarkup";

export function buildGarmentArtworkMarkup(
  recipe: GarmentRecipe,
  options: GarmentMarkupOptions = {},
): string {
  const namespace = createGarmentNamespace(options.namespace);
  const hrefs = options.assetHrefs;
  const filters = matteFilterMarkup(`${namespace}-matte`, recipe.color);
  const sourceAssets: readonly GarmentAsset[] = [
    ...recipe.layers.map(({ asset }) => asset),
    ...recipe.textures.map(({ asset }) => asset),
    ...(recipe.detailAssets ?? []),
  ].filter(
    (asset, index, assets) =>
      assets.findIndex((candidate) => candidate.assetId === asset.assetId) ===
      index,
  );
  const referenceMode =
    recipe.status === "partial" && recipe.layers.length > 0
      ? ' data-reference-mode="form"'
      : "";
  const detailFilters = (recipe.detailAssets ?? [])
    .map((asset) => {
      const filterId = `${namespace}-detail-matte-${sourceIndexFor(sourceAssets, asset.assetId)}`;
      return matteFilterMarkup(filterId, recipe.color, {
        x: -12,
        y: -12,
        width: asset.sourceFrame.width + 24,
        height: asset.sourceFrame.height + 24,
      });
    })
    .join("");
  const nativeBowAsset =
    recipe.backStyle === "bowBack"
      ? recipe.detailAssets?.find((detail) =>
          detail.coverage.details?.includes("backBow"),
        )
      : undefined;
  const nativeBowImageId = nativeBowAsset
    ? `${namespace}-native-bow`
    : undefined;
  const nativeBowSymbol = nativeBowAsset
    ? `<symbol id="${nativeBowImageId}" viewBox="0 0 ${nativeBowAsset.sourceFrame.width} ${nativeBowAsset.sourceFrame.height}" preserveAspectRatio="none"><use href="#${namespace}-source-${sourceIndexFor(sourceAssets, nativeBowAsset.assetId)}" filter="url(#${namespace}-detail-matte-${sourceIndexFor(sourceAssets, nativeBowAsset.assetId)})"/></symbol>`
    : "";
  const backConstruction = backConstructionFor(
    recipe,
    namespace,
    nativeBowImageId,
  );
  const constructionMaskId = backConstruction?.maskId;
  const upperViewBottom =
    recipe.view === "upper"
      ? recipe.viewBox.y + recipe.viewBox.height
      : undefined;
  const upperSelections = recipe.layers
    .filter(({ region }) => region === "upper")
    .map((layer) => ({
      assetId: layer.asset.assetId,
      selection: upperSelectionForLayer(layer, namespace),
    }));
  const selectionFor = (assetId: string): UpperSelectionRuntime | undefined =>
    upperSelections.find((entry) => entry.assetId === assetId)?.selection;
  const lowerLayer =
    recipe.layers.find(({ region }) => region === "lower") ??
    recipe.layers.find(({ region }) => region === "full");
  const trainSource =
    recipe.textures.find(({ region }) => region === "lower")?.asset ??
    lowerLayer?.asset;
  const train = trainMarkup(
    recipe,
    namespace,
    trainSource
      ? {
          asset: trainSource,
          sourceIndex: sourceIndexFor(sourceAssets, trainSource.assetId),
        }
      : undefined,
    lowerLayer,
    lowerLayer
      ? sourceIndexFor(sourceAssets, lowerLayer.asset.assetId)
      : undefined,
  );
  const clips =
    recipe.layers
      .map((layer) => {
        const clipLayer =
          train.replacedRegion === "full" && layer.region === "full"
            ? { ...layer, region: "upper" as const }
            : layer;
        return clipLayer.region === "full"
          ? ""
          : clipPathFor(
              clipLayer,
              `${namespace}-clip-${sourceIndexFor(sourceAssets, clipLayer.asset.assetId)}-${clipLayer.region}`,
              upperViewBottom,
              clipLayer.region === "upper" &&
                Boolean(selectionFor(clipLayer.asset.assetId)),
            );
      })
      .join("") +
    recipe.textures
      .filter(({ region }) => region === "lower")
      .map((texture) =>
        lowerTextureClipPath(
          `${namespace}-texture-clip-${sourceIndexFor(sourceAssets, texture.maskAssetId)}-${texture.region}`,
          sourceAssets.find((asset) => asset.assetId === texture.maskAssetId)
            ?.coverage.silhouette,
          texture.joinY,
        ),
      )
      .filter((markup, index, all) => all.indexOf(markup) === index)
      .join("");
  const upperTextureClips = recipe.textures
    .filter(({ region }) => region === "upper")
    .map((texture) => {
      const target = sourceAssets.find(
        (asset) => asset.assetId === texture.maskAssetId,
      );
      return upperTextureClipPath(
        `${namespace}-texture-clip-${sourceIndexFor(sourceAssets, texture.maskAssetId)}-${texture.region}`,
        target
          ? {
              asset: target,
              region: "upper",
              neckline: texture.neckline,
              joinY: texture.joinY,
            }
          : {
              asset: texture.asset,
              region: "upper",
              neckline: texture.neckline,
              joinY: texture.joinY,
            },
        upperViewBottom,
      );
    })
    .filter((markup, index, all) => all.indexOf(markup) === index)
    .join("");
  const allClips = clips + upperTextureClips;
  const maskKeys = new Set<string>();
  const masks = [
    ...recipe.layers
      .filter(
        (layer) =>
          layer.region === "upper" &&
          layer.neckline &&
          layer.neckline !== "high" &&
          !(
            layer.asset.role === "lower-silhouette" &&
            layer.asset.coverage.topStyle === "strapless" &&
            layer.asset.coverage.neckline === "sweetheart" &&
            layer.neckline === "sweetheart"
          ),
      )
      .map((layer) => ({
        key: maskIdFor(namespace, layer.asset.assetId, layer.region),
        markup: necklineMaskMarkup(layer, namespace),
      })),
    ...upperSelections
      .map(({ selection }) => selection)
      .filter(
        (selection): selection is UpperSelectionRuntime =>
          selection !== undefined,
      )
      .map((selection) => ({
        key: selection.maskId,
        markup: selection.defs,
      })),
    ...recipe.textures.map((texture) => ({
      key: textureMaskId(namespace, texture.maskAssetId, texture.region),
      markup: textureMaskMarkup(
        texture,
        sourceAssets,
        namespace,
        (recipe.details ?? []).includes("slit"),
        constructionMaskId,
        texture.region === "upper"
          ? selectionFor(texture.maskAssetId)?.maskId
          : undefined,
      ),
    })),
    {
      key: `${namespace}-detail-slit`,
      markup: detailDefinitions(recipe, namespace),
    },
  ]
    .filter(({ key }) => {
      if (maskKeys.has(key)) return false;
      maskKeys.add(key);
      return true;
    })
    .map(({ markup }) => markup)
    .join("");
  const images = sourceAssets
    .map((asset, index) =>
      sourceImageMarkup(
        asset,
        index,
        hrefs?.get(asset.assetId) ?? asset.path,
        namespace,
      ),
    )
    .join("");
  const uses = [
    ...recipe.layers
      .filter(
        (layer) =>
          layer.region !== train.replacedRegion ||
          train.replacedRegion === "full",
      )
      .map((layer, index) =>
        useMarkup(
          train.replacedRegion === "full" && layer.region === "full"
            ? { ...layer, region: "upper" as const }
            : layer,
          index,
          namespace,
          sourceIndexFor(sourceAssets, layer.asset.assetId),
          (recipe.details ?? []).includes("slit"),
          constructionMaskId,
          layer.region === "upper"
            ? selectionFor(layer.asset.assetId)?.maskId
            : undefined,
        ),
      ),
    ...recipe.textures
      .filter((texture) => texture.region !== train.replacedRegion)
      .map(
        (texture) =>
          photoWarpTextureMarkup(texture, sourceAssets, namespace) ||
          textureUseMarkup(texture, sourceAssets, namespace),
      ),
  ].join("");
  const bowAsset = (recipe.detailAssets ?? []).find((asset) =>
    asset.coverage.details?.includes("waistBow"),
  );
  const floralAsset = (recipe.detailAssets ?? []).find((asset) =>
    asset.coverage.details?.includes("floral"),
  );
  const modifierContext = {
    namespace,
    matteFilterId: `${namespace}-matte`,
    ...(bowAsset
      ? {
          bow: {
            asset: bowAsset,
            sourceIndex: sourceIndexFor(sourceAssets, bowAsset.assetId),
            filterId: `${namespace}-detail-matte-${sourceIndexFor(sourceAssets, bowAsset.assetId)}`,
          },
        }
      : {}),
    ...(floralAsset
      ? {
          floral: {
            asset: floralAsset,
            sourceIndex: sourceIndexFor(sourceAssets, floralAsset.assetId),
            filterId: `${namespace}-detail-matte-${sourceIndexFor(sourceAssets, floralAsset.assetId)}`,
          },
        }
      : {}),
  };
  const modifiers = `${backConstruction?.markup ?? ""}${waistTransitionMarkup(recipe, sourceAssets, namespace)}${waistMarkup(recipe)}${detailMarkup(recipe, modifierContext)}`;
  const assetIds = recipe.assetIds.map(escapeXml).join(",");
  const missingFields = recipe.missingFields.map(escapeXml).join(",");
  const reason = recipe.reason ? ` data-reason="${recipe.reason}"` : "";
  const viewBox = viewBoxText(recipe.viewBox);
  const logicalBounds = viewBoxText(recipe.logicalBounds);
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="${viewBox}" width="${recipe.viewBox.width}" height="${recipe.viewBox.height}" role="img" aria-label="선택한 드레스 의상 이미지" data-renderer="garment-artwork" data-view="${recipe.view}" data-state="${recipe.status}"${referenceMode} data-logical-bounds="${logicalBounds}" data-asset-ids="${assetIds}" data-missing-fields="${missingFields}"${recipe.train ? ` data-train="${recipe.train}"` : ""}${recipe.waistline ? ` data-waistline="${recipe.waistline}"` : ""}${reason}><title>선택한 의상 기록 이미지</title><defs>${filters}${detailFilters}${nativeBowSymbol}${allClips}${train.definitions}${backConstruction?.defs ?? ""}${masks}${images}</defs><g data-layer="garment-composition" data-view="${recipe.view}">${train.content}${uses}${modifiers}</g></svg>`;
}

export { FULL_VIEW_BOX as LOGICAL_FRAME };
export { createGarmentNamespace } from "./namespace";
