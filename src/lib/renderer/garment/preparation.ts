import type { Dress } from "../../../types/domain";
import { buildGarmentArtworkMarkup, createGarmentNamespace } from "./markup";
import { resolveGarmentRecipe } from "./core";
import type {
  GarmentArtworkOptions,
  GarmentArtworkResult,
  GarmentAsset,
  GarmentReason,
} from "./types";

type CachedBytes = Promise<Uint8Array>;

const bytesCache = new Map<string, CachedBytes>();

export class GarmentAssetPreparationError extends Error {
  readonly assetId: string;
  readonly path: string;

  constructor(asset: GarmentAsset, message: string) {
    super(message);
    this.name = "GarmentAssetPreparationError";
    this.assetId = asset.assetId;
    this.path = asset.path;
  }
}

function cacheKey(asset: GarmentAsset): string {
  return `${asset.rendererVersion}:${asset.assetId}:${asset.optimizedSha256}`;
}

function ensureLocalPath(asset: GarmentAsset): void {
  if (!asset.path.startsWith("/assets/garment/")) {
    throw new GarmentAssetPreparationError(
      asset,
      "Garment assets must be same-origin local files.",
    );
  }
}

async function fetchBytes(asset: GarmentAsset): Promise<Uint8Array> {
  ensureLocalPath(asset);
  let response: Response;
  try {
    response = await fetch(asset.path);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    if (error instanceof Error) {
      throw new GarmentAssetPreparationError(asset, error.message);
    }
    throw error;
  }
  if (!response.ok) {
    throw new GarmentAssetPreparationError(
      asset,
      `Local garment asset returned HTTP ${response.status}.`,
    );
  }
  return new Uint8Array(await response.arrayBuffer());
}

async function bytesFor(
  asset: GarmentAsset,
  signal?: AbortSignal,
): Promise<Uint8Array> {
  if (signal?.aborted)
    throw new DOMException(
      "Garment asset preparation was aborted.",
      "AbortError",
    );
  const key = cacheKey(asset);
  let pending = bytesCache.get(key);
  if (!pending) {
    pending = fetchBytes(asset).catch((error) => {
      bytesCache.delete(key);
      throw error;
    });
    bytesCache.set(key, pending);
  }
  const bytes = await pending;
  if (signal?.aborted)
    throw new DOMException(
      "Garment asset preparation was aborted.",
      "AbortError",
    );
  return bytes;
}

function bytesToBase64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    chunks.push(
      String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)),
    );
  }
  return btoa(chunks.join(""));
}

function failedResult(
  result: GarmentArtworkResult,
  reason: GarmentReason,
  namespace?: string,
): GarmentArtworkResult {
  const failed = {
    ...result,
    status: "unavailable" as const,
    reason,
    warnings: [...result.warnings, "asset-load-failed"],
    markup: "",
  } satisfies GarmentArtworkResult;
  return {
    ...failed,
    markup: buildGarmentArtworkMarkup(failed, { namespace }),
  };
}

export function clearGarmentAssetCache(): void {
  bytesCache.clear();
}

export async function prepareGarmentArtwork(
  dress: Dress,
  options: GarmentArtworkOptions,
): Promise<GarmentArtworkResult> {
  const recipe = resolveGarmentRecipe(dress, options.view, options.namespace);
  if (!options.embedAssets || recipe.layers.length === 0) return recipe;
  try {
    const assets = [...recipe.layers, ...recipe.textures]
      .map(({ asset }) => asset)
      .concat(recipe.detailAssets ?? [])
      .filter(
        (asset, index, all) =>
          all.findIndex((candidate) => candidate.assetId === asset.assetId) ===
          index,
      );
    const loaded = await Promise.all(
      assets.map(
        async (asset) =>
          [asset.assetId, await bytesFor(asset, options.signal)] as const,
      ),
    );
    const hrefs = new Map<string, string>();
    loaded.forEach(([assetId, bytes]) => {
      hrefs.set(assetId, `data:image/webp;base64,${bytesToBase64(bytes)}`);
    });
    const namespace = options.namespace ?? createGarmentNamespace();
    return {
      ...recipe,
      markup: buildGarmentArtworkMarkup(recipe, {
        namespace,
        assetHrefs: hrefs,
      }),
    };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError")
      throw error;
    if (error instanceof GarmentAssetPreparationError) {
      return failedResult(recipe, "asset-load-failed", options.namespace);
    }
    throw error;
  }
}
