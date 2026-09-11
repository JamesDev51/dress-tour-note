import { afterEach, describe, expect, it } from "vitest";
import { db } from "./database";
import {
  addDress,
  addShop,
  createTour,
  deleteShop,
  duplicateDress,
  getTourSnapshot,
  importSnapshot,
  patchDress,
  reorderDresses,
} from "./repositories";
import { necklineOptions, topStyleOptions } from "../lib/dress/options";
import type { Dress } from "../types/domain";

const additiveQuickTags: Dress["quickTags"] = [
  "가벼움",
  "편함",
  "조임",
  "흘러내림",
  "까슬거림",
  "팔이 부각됨",
  "목이 길어 보임",
  "어깨가 정리됨",
  "상체가 짧아 보임",
  "골반이 강조됨",
];
const observationNotes: NonNullable<Dress["customOptions"]> = {
  top: "얇은 진주 끈",
  neckline: "스캘럽 가장자리",
  silhouette: "A라인보다 폭이 좁음",
  fabric: "잔잔한 광택",
  color: "아이보리보다 따뜻함",
  waistline: "곡선 절개",
  backStyle: "등 파임이 더 깊음",
  train: "채플보다 조금 짧음",
  details: "꽃잎 크기가 작음",
};
afterEach(async () => {
  await db.delete();
  await db.open();
});
describe("repositories", () => {
  it("persists the optional core acknowledgement without a schema or index change", async () => {
    const t = await createTour({ title: "투어" });
    const s = await addShop(t, { name: "샵" });
    const freshId = await addDress(s);
    expect((await db.dresses.get(freshId))?.coreRecordedAt).toBeUndefined();

    const coreRecordedAt = "2026-09-04T03:00:00.000Z";
    await patchDress(freshId, { isFavorite: false, coreRecordedAt });
    await db.close();
    await db.open();

    expect(db.verno).toBe(1);
    expect(db.dresses.schema.indexes.map(({ name }) => name)).not.toContain(
      "coreRecordedAt",
    );
    expect(await db.dresses.get(freshId)).toMatchObject({
      isFavorite: false,
      coreRecordedAt,
    });
  });
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

  it("keeps schema v1 while optional observations survive add patch and duplicate", async () => {
    const t = await createTour({ title: "투어" });
    const s = await addShop(t, { name: "샵" });
    const d = await addDress(s, {
      customOptions: {
        top: "  진주 장식  ",
        waistline: "가".repeat(81),
        details: "꽃잎 크기가 작음",
      },
      quickTags: [...additiveQuickTags, "동행인 픽"],
    });
    expect((await db.dresses.get(d))?.customOptions).toMatchObject({
      top: "진주 장식",
      waistline: "가".repeat(80),
    });

    await patchDress(d, {
      customOptions: {
        top: " ",
        neckline: "스캘럽 가장자리",
        silhouette: "A라인보다 폭이 좁음",
        fabric: "잔잔한 광택",
        color: "아이보리보다 따뜻함",
        waistline: "가".repeat(81),
        backStyle: "등 파임이 더 깊음",
        train: "채플보다 조금 짧음",
        details: "꽃잎 크기가 작음",
      },
    });
    const duplicateId = await duplicateDress(d);
    await db.close();
    await db.open();

    const original = await db.dresses.get(d);
    const duplicate = await db.dresses.get(duplicateId);
    const expectedOptions = {
      neckline: "스캘럽 가장자리",
      silhouette: "A라인보다 폭이 좁음",
      fabric: "잔잔한 광택",
      color: "아이보리보다 따뜻함",
      waistline: "가".repeat(80),
      backStyle: "등 파임이 더 깊음",
      train: "채플보다 조금 짧음",
      details: "꽃잎 크기가 작음",
    };
    expect(db.verno).toBe(1);
    expect(db.dresses.schema.indexes.map(({ name }) => name)).not.toContain(
      "customOptions",
    );
    expect(original?.customOptions).toEqual(expectedOptions);
    expect(duplicate?.customOptions).toEqual(expectedOptions);
    expect(duplicate?.quickTags).toEqual([...additiveQuickTags, "동행인 픽"]);
  });

  it("preserves rapid custom-option saves across different categories", async () => {
    const t = await createTour({ title: "투어" });
    const s = await addShop(t, { name: "샵" });
    const d = await addDress(s);

    const topSave = patchDress(d, {
      customOptions: { top: "  진주 끈  " },
    });
    await Promise.resolve();
    const necklineSave = patchDress(d, {
      customOptions: { neckline: "나".repeat(81) },
    });
    await Promise.all([topSave, necklineSave]);

    expect((await db.dresses.get(d))?.customOptions).toEqual({
      top: "진주 끈",
      neckline: "나".repeat(80),
    });
  });

  it("deletes an explicit note patch while preserving omitted sibling categories", async () => {
    const t = await createTour({ title: "투어" });
    const s = await addShop(t, { name: "샵" });
    const d = await addDress(s, {
      customOptions: {
        top: "얇은 진주 끈",
        neckline: "스캘럽 가장자리",
      },
    });
    await db.tours.update(t, {
      updatedAt: "2000-01-01T00:00:00.000Z",
      lastOpenedAt: "2000-01-01T00:00:00.000Z",
    });

    const clearTop = patchDress(d, { customOptions: { top: undefined } });
    const saveFabric = patchDress(d, {
      customOptions: { fabric: "  잔잔한 광택  " },
    });
    await Promise.all([clearTop, saveFabric]);

    expect((await db.dresses.get(d))?.customOptions).toEqual({
      neckline: "스캘럽 가장자리",
      fabric: "잔잔한 광택",
    });
    expect(await db.tours.get(t)).toMatchObject({
      updatedAt: expect.not.stringMatching(/^2000-/),
      lastOpenedAt: expect.not.stringMatching(/^2000-/),
    });
  });

  it("preserves observations through immediate copy and overwrite imports", async () => {
    const t = await createTour({ title: "투어" });
    const s = await addShop(t, { name: "샵" });
    await addDress(s, {
      customOptions: observationNotes,
      quickTags: additiveQuickTags,
    });
    const source = await getTourSnapshot(t);

    const copyId = await importSnapshot(source, "copy");
    const copy = await getTourSnapshot(copyId);
    expect(copy.dresses[0]).toMatchObject({
      customOptions: observationNotes,
      quickTags: additiveQuickTags,
    });

    await patchDress(source.dresses[0].id, {
      customOptions: { details: "덧꽃 장식" },
      quickTags: ["까슬거림", "골반이 강조됨"],
    });
    await importSnapshot(source, "overwrite");
    const overwritten = await getTourSnapshot(t);
    expect(overwritten.dresses[0]).toMatchObject({
      customOptions: observationNotes,
      quickTags: additiveQuickTags,
    });
  });
});
