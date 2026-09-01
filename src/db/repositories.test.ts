import { afterEach, describe, expect, it } from "vitest";
import { db } from "./database";
import {
  addDress,
  addShop,
  createTour,
  deleteShop,
  duplicateDress,
  getTourSnapshot,
  patchDress,
  reorderDresses,
} from "./repositories";
import { necklineOptions, topStyleOptions } from "../lib/dress/options";
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

  it("saves every canonical shoulder and neckline pair in either selection order", async () => {
    const t = await createTour({ title: "투어" });
    const s = await addShop(t, { name: "샵" });
    const shoulders = topStyleOptions.slice(1).map(({ id }) => id);
    const necklines = necklineOptions.slice(1).map(({ id }) => id);
    const expected: Array<{
      id: string;
      topStyle: (typeof shoulders)[number];
      neckline: (typeof necklines)[number];
    }> = [];

    for (const topStyle of shoulders) {
      for (const neckline of necklines) {
        const forwardId = await addDress(s);
        await patchDress(forwardId, { topStyle });
        await patchDress(forwardId, { neckline });
        expected.push({ id: forwardId, topStyle, neckline });

        const reverseId = await addDress(s);
        await patchDress(reverseId, { neckline });
        await patchDress(reverseId, { topStyle });
        expected.push({ id: reverseId, topStyle, neckline });
      }
    }

    const dresses = await getTourSnapshot(t).then(
      (snapshot) => snapshot.dresses,
    );
    for (const item of expected) {
      const dress = dresses.find(({ id }) => id === item.id);
      expect(dress).toMatchObject(item);
    }
  });

  it("does not return a normalization result when an upper choice is patched", async () => {
    const t = await createTour({ title: "투어" });
    const s = await addShop(t, { name: "샵" });
    const d = await addDress(s);

    expect(
      await patchDress(d, { topStyle: "strapless", neckline: "v" }),
    ).toBeUndefined();
  });

  it("keeps raw legacy values when an unrelated field is patched", async () => {
    const t = await createTour({ title: "투어" });
    const s = await addShop(t, { name: "샵" });
    const d = await addDress(s, {
      topStyle: "spaghetti",
      neckline: "high",
      silhouette: "fitAndFlare",
      waistline: "empire",
      backStyle: "bowBack",
      fabric: "glitterBeaded",
      train: "chapel",
      details: ["backBow"],
    });

    await patchDress(d, { memo: "메모", rating: 5, isFavorite: true });
    const stored = await db.dresses.get(d);
    expect(stored).toMatchObject({
      topStyle: "spaghetti",
      neckline: "high",
      silhouette: "fitAndFlare",
      waistline: "empire",
      backStyle: "bowBack",
      fabric: "glitterBeaded",
      train: "chapel",
      details: ["backBow"],
    });
  });
});
