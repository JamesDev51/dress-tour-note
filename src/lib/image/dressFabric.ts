import type { Fabric } from "../../types/domain";
import { blobToDataUrl } from "./processFace";

const fabricPath: Partial<Record<Fabric, string>> = {
  mikadoSatin: "/assets/render-textures/fabric/mikadoSatin.webp",
  lace: "/assets/render-textures/fabric/lace.webp",
  subtleBeaded: "/assets/render-textures/fabric/subtleBeaded.webp",
  ornateBeaded: "/assets/render-textures/fabric/ornateBeaded.webp",
  organzaChiffon: "/assets/render-textures/fabric/organzaChiffon.webp",
  floral3D: "/assets/render-textures/fabric/floral3D.webp",
};

const cache = new Map<string, Promise<string>>();

export function loadDressFabricTexture(fabric: Fabric) {
  const path = fabricPath[fabric];
  if (!path) return Promise.resolve(undefined);
  const cached = cache.get(path);
  if (cached) return cached;
  const loaded = fetch(path).then(async (response) => {
    if (!response.ok) throw new Error("소재 이미지를 불러오지 못했어요.");
    return blobToDataUrl(await response.blob());
  });
  cache.set(path, loaded);
  return loaded;
}
