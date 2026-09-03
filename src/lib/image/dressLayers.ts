import type { PresentedDress } from "../dress/options";
import { blobToDataUrl } from "./processFace";

type LayerGroup = "bodice" | "top" | "skirt" | "volume";

export type DressLayerAssets = {
  readonly structure: string;
  readonly shadow: string;
  readonly highlight: string;
  readonly mermaidVolume?: string;
  readonly empireVolume?: string;
};

export type DressLayerSelection = Pick<
  PresentedDress,
  "neckline" | "silhouette" | "topStyle"
>;

const cache = new Map<string, Promise<string>>();

function layerUrl(group: LayerGroup, name: string) {
  return `/assets/dress-layers/${group}/${name}.webp`;
}

function loadLayer(group: LayerGroup, name: string) {
  const url = layerUrl(group, name);
  const cached = cache.get(url);
  if (cached) return cached;
  const loaded = fetch(url)
    .then(async (response) => {
      if (!response.ok)
        throw new Error(`드레스 ${group} 레이어를 불러오지 못했어요.`);
      return blobToDataUrl(await response.blob());
    })
    .catch((error: unknown) => {
      cache.delete(url);
      throw error;
    });
  cache.set(url, loaded);
  return loaded;
}

function loadAsset(path: string) {
  const cached = cache.get(path);
  if (cached) return cached;
  const loaded = fetch(path).then(async (response) => {
    if (!response.ok)
      throw new Error("드레스 이미지 에셋을 불러오지 못했어요.");
    return blobToDataUrl(await response.blob());
  });
  cache.set(path, loaded);
  return loaded;
}

export function dressStructureKey(dress: DressLayerSelection) {
  return `${dress.topStyle}__${dress.neckline}__${dress.silhouette}`;
}

export async function loadDressLayerAssets(
  dress: DressLayerSelection,
): Promise<DressLayerAssets> {
  const [structure, shadow, highlight, mermaidVolume, empireVolume] =
    await Promise.all([
      loadAsset(`/assets/dress-structures/${dressStructureKey(dress)}.webp`),
      loadLayer("volume", "shadow"),
      loadLayer("volume", "highlight"),
      dress.silhouette === "mermaid"
        ? loadLayer("volume", "mermaid")
        : Promise.resolve(undefined),
      dress.silhouette === "empire"
        ? loadLayer("volume", "empire")
        : Promise.resolve(undefined),
    ]);
  return {
    structure,
    shadow,
    highlight,
    mermaidVolume,
    empireVolume,
  };
}
