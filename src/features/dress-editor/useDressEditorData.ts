import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/database";

export function useDressEditorData(dressId: string) {
  return useLiveQuery(async () => {
    const dress = await db.dresses.get(dressId);
    if (!dress) return undefined;
    const [tour, shop] = await Promise.all([
      db.tours.get(dress.tourId),
      db.shops.get(dress.shopId),
    ]);
    const face = tour?.faceAssetId
      ? await db.assets.get(tour.faceAssetId)
      : undefined;
    return { dress, tour, shop, face };
  }, [dressId]);
}
