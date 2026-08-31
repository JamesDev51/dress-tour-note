import { afterEach, describe, expect, it } from "vitest";
import { db } from "./database";
import {
  addDress,
  addShop,
  createTour,
  deleteShop,
  duplicateDress,
  getTourSnapshot,
  reorderDresses,
} from "./repositories";
afterEach(async () => {
  await db.delete();
  await db.open();
});
describe("repositories", () => {
  it("creates tour shop dresses and cascades shop delete", async () => {
    const t = await createTour({ title: "투어" });
    const s = await addShop(t, { name: "샵" });
    await addDress(s);
    await addDress(s);
    expect((await getTourSnapshot(t)).dresses).toHaveLength(2);
    await deleteShop(s);
    const snap = await getTourSnapshot(t);
    expect(snap.shops).toHaveLength(0);
    expect(snap.dresses).toHaveLength(0);
  });
  it("duplicate resets favorite and reorder relabels", async () => {
    const t = await createTour({ title: "투어" });
    const s = await addShop(t, { name: "샵" });
    const d1 = await addDress(s, { isFavorite: true });
    const d2 = await duplicateDress(d1);
    let ds = (await getTourSnapshot(t)).dresses;
    expect(ds.find((d) => d.id === d2)?.isFavorite).toBe(false);
    await reorderDresses(s, [d2, d1]);
    ds = (await getTourSnapshot(t)).dresses.sort((a, b) => a.order - b.order);
    expect(ds[0].id).toBe(d2);
    expect(ds[0].label).toBe("Dress 01");
  });
});
