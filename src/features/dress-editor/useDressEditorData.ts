import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../db/database";

export function useDressEditorData(dressId: string) {
  return useLiveQuery(async () => {
    const dress = await db.dresses.get(dressId);
    if (!dress) return null;
    const [tour, shop] = await Promise.all([
      db.tours.get(dress.tourId),
      db.shops.get(dress.shopId),
    ]);
    if (!tour || !shop) return null;
    return { dress, tour, shop };
  }, [dressId]);
}
