import type {
  PresentedDress,
  PresentedNeckline,
  PresentedSilhouette,
  PresentedTopStyle,
} from "../dress/options";
import { blobToDataUrl } from "./processFace";

type LayerGroup = "bodice" | "top" | "skirt" | "volume";

export type DressLayerAssets = {
  readonly bodice: string;
  readonly top?: string;
  readonly skirt: string;
  readonly necklineAppearance?: string;
  readonly topAppearance?: string;
  readonly silhouetteAppearance?: string;
  readonly shadow: string;
  readonly highlight: string;
  readonly mermaidVolume?: string;
  readonly empireVolume?: string;
};

export type DressLayerSelection = Pick<
  PresentedDress,
  "neckline" | "silhouette" | "topStyle"
>;

const bodiceNames = {
  unknown: "straight",
  straight: "straight",
  sweetheart: "sweetheart",
  v: "v",
  square: "square",
  scoop: "scoop",
  asymmetric: "asymmetric",
} as const satisfies Record<PresentedNeckline, string>;

const topNames = {
  unknown: undefined,
  strapless: undefined,
  offShoulder: "offShoulder",
  strap: "strap",
  halter: "halter",
  shortSleeve: "shortSleeve",
  longSleeve: "longSleeve",
} as const satisfies Record<PresentedTopStyle, string | undefined>;

const skirtNames = {
  unknown: "unknown",
  aLine: "aLine",
  ballGown: "ballGown",
  empire: "empire",
  mermaid: "mermaid",
} as const satisfies Record<PresentedSilhouette, string>;

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

function loadImage(url: string) {
  const cached = cache.get(url);
  if (cached) return cached;
  const loaded = fetch(url)
    .then(async (response) => {
      if (!response.ok)
        throw new Error("드레스 참고 이미지를 불러오지 못했어요.");
      return blobToDataUrl(await response.blob());
    })
    .catch((error: unknown) => {
      cache.delete(url);
      throw error;
    });
  cache.set(url, loaded);
  return loaded;
}

export async function loadDressLayerAssets(
  dress: DressLayerSelection,
): Promise<DressLayerAssets> {
  const topName = topNames[dress.topStyle];
  const [
    bodice,
    top,
    skirt,
    necklineAppearance,
    topAppearance,
    silhouetteAppearance,
    shadow,
    highlight,
    mermaidVolume,
    empireVolume,
  ] = await Promise.all([
    loadLayer("bodice", bodiceNames[dress.neckline]),
    topName ? loadLayer("top", topName) : Promise.resolve(undefined),
    loadLayer("skirt", skirtNames[dress.silhouette]),
    dress.neckline === "unknown"
      ? Promise.resolve(undefined)
      : loadImage("/assets/dress-appearances/bodice/base.webp"),
    topName && topName !== "longSleeve"
      ? loadImage(`/assets/dress-appearances/top/${topName}.webp`)
      : Promise.resolve(undefined),
    dress.silhouette === "unknown"
      ? Promise.resolve(undefined)
      : loadImage(
          `/assets/dress-appearances/silhouette/${dress.silhouette}.webp`,
        ),
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
    bodice,
    top,
    skirt,
    necklineAppearance,
    topAppearance,
    silhouetteAppearance,
    shadow,
    highlight,
    mermaidVolume,
    empireVolume,
  };
}
