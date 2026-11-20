import { afterEach, describe, expect, it } from "vitest";
import { db } from "./database";
import {
  addDress,
  addDressStylingVariant,
  addShop,
  createTour,
  duplicateDress,
  getTourSnapshot,
  importSnapshot,
  patchDressLook,
  removeDressStylingVariant,
  renameDressStylingVariant,
  setPreferredStylingVariant,
} from "./repositories";
import {
  getDressLooks,
  getPreferredStylingId,
  resolveDressLook,
} from "../lib/dress/styling";
import type { Dress, SketchStroke } from "../types/domain";

afterEach(async () => {
  await db.delete();
  await db.open();
});
async function setup() {
  const tourId = await createTour({ title: "연출 투어" });
  const shopId = await addShop(tourId, { name: "첫 샵" });
  const dressId = await addDress(shopId, {
    silhouette: "aLine",
    fabric: "lace",
    topStyle: "strapless",
    neckline: "sweetheart",
    backStyle: "openBack",
    details: ["floral"],
    memoryCue: "큰 꽃 레이스",
    likedReason: "팔이 편함",
    concern: "길이가 김",
    memo: "기본 메모",
    quickTags: ["편함"],
    customOptions: { top: "넓은 꽃잎", backStyle: "등 아래까지 파임" },
    rating: 5,
    isFavorite: true,
  });
  return { tourId, shopId, dressId };
}
async function record(id: string): Promise<Dress> {
  const dress = await db.dresses.get(id);
  if (!dress) throw new Error("missing fixture");
  return dress;
}

describe("dress styling transactions", () => {
  it("keeps drawings independent when editing, duplicating, restoring and clearing a look", async () => {
    const { tourId, dressId } = await setup();
    const lookId = await addDressStylingVariant(dressId);
    const baseInk: SketchStroke[] = [{ width: 1, points: [[0, 1]] }];
    const lookInk: SketchStroke[] = [
      {
        width: 4,
        points: [
          [1, 0],
          [0.3, 0.7],
        ],
      },
    ];
    await patchDressLook(dressId, "base", { sketchStrokes: baseInk });
    expect(
      resolveDressLook(await record(dressId), lookId).sketchStrokes,
    ).toBeUndefined();
    await patchDressLook(dressId, lookId, { sketchStrokes: lookInk });
    const clone = await record(await duplicateDress(dressId));
    expect(clone.sketchStrokes).toEqual(baseInk);
    expect(clone.stylingVariants?.[0].snapshot.sketchStrokes).toEqual(lookInk);

    const source = await getTourSnapshot(tourId);
    const copy = await getTourSnapshot(await importSnapshot(source, "copy"));
    for (const dress of copy.dresses) {
      expect(dress.sketchStrokes).toEqual(baseInk);
      expect(dress.stylingVariants?.[0].snapshot.sketchStrokes).toEqual(
        lookInk,
      );
    }
    await patchDressLook(dressId, lookId, { sketchStrokes: undefined });
    expect(
      resolveDressLook(await record(dressId), lookId).sketchStrokes,
    ).toBeUndefined();
    expect((await record(dressId)).sketchStrokes).toEqual(baseInk);
    await importSnapshot(source, "overwrite");
    expect(
      resolveDressLook(await record(dressId), lookId).sketchStrokes,
    ).toEqual(lookInk);
  });

  it("persists independent material start positions and clears an old look without inheriting the base", async () => {
    const { tourId, dressId } = await setup();
    await patchDressLook(dressId, "base", {
      upperFabric: "lace",
      lowerFabric: "organzaChiffon",
      lowerFabricStart: "hip",
    });
    const lookId = await addDressStylingVariant(dressId);
    await patchDressLook(dressId, lookId, { lowerFabricStart: "knee" });
    const current = await record(dressId);
    expect(current.lowerFabricStart).toBe("hip");
    expect(resolveDressLook(current, lookId).lowerFabricStart).toBe("knee");
    const duplicate = await record(await duplicateDress(dressId));
    expect(duplicate.lowerFabricStart).toBe("hip");
    expect(duplicate.stylingVariants![0].snapshot.lowerFabricStart).toBe(
      "knee",
    );
    const source = await getTourSnapshot(tourId);
    const copy = await getTourSnapshot(await importSnapshot(source, "copy"));
    expect(
      copy.dresses.every((dress) => dress.lowerFabricStart === "hip"),
    ).toBe(true);
    expect(
      copy.dresses.every(
        (dress) =>
          dress.stylingVariants![0].snapshot.lowerFabricStart === "knee",
      ),
    ).toBe(true);
    await patchDressLook(dressId, lookId, { lowerFabricStart: undefined });
    expect(
      resolveDressLook(await record(dressId), lookId).lowerFabricStart,
    ).toBeUndefined();
    expect((await record(dressId)).lowerFabricStart).toBe("hip");
    await importSnapshot(source, "overwrite");
    expect(
      resolveDressLook(await record(dressId), lookId).lowerFabricStart,
    ).toBe("knee");
    await expect(
      patchDressLook(dressId, lookId, {
        lowerFabricStart: "ankle" as Dress["lowerFabricStart"],
      }),
    ).rejects.toThrow();
    expect(
      resolveDressLook(await record(dressId), lookId).lowerFabricStart,
    ).toBe("knee");
  });
  it("persists separate upper and skirt materials independently through looks, duplication and copy import", async () => {
    const { tourId, dressId } = await setup();
    await patchDressLook(dressId, "base", {
      upperFabric: "lace",
      lowerFabric: "organzaChiffon",
    });
    const lookId = await addDressStylingVariant(dressId);
    await patchDressLook(dressId, lookId, { upperFabric: "mikadoSatin" });
    const current = await record(dressId);
    expect(current).toMatchObject({
      upperFabric: "lace",
      lowerFabric: "organzaChiffon",
    });
    expect(resolveDressLook(current, lookId)).toMatchObject({
      upperFabric: "mikadoSatin",
      lowerFabric: "organzaChiffon",
    });
    const cloned = await record(await duplicateDress(dressId));
    expect(cloned.stylingVariants![0].snapshot).toMatchObject({
      upperFabric: "mikadoSatin",
      lowerFabric: "organzaChiffon",
    });
    const copiedTour = await importSnapshot(
      await getTourSnapshot(tourId),
      "copy",
    );
    const imported = await getTourSnapshot(copiedTour);
    expect(
      imported.dresses.every((dress) => dress.lowerFabric === "organzaChiffon"),
    ).toBe(true);
    await patchDressLook(dressId, lookId, {
      upperFabric: undefined,
      lowerFabric: undefined,
      fabric: "lace",
    });
    expect(resolveDressLook(await record(dressId), lookId)).toMatchObject({
      fabric: "lace",
      upperFabric: undefined,
      lowerFabric: undefined,
    });
    expect((await record(dressId)).lowerFabric).toBe("organzaChiffon");
  });
  it("keeps independent opening and closure in each look, clone, and copy import", async () => {
    const { tourId, dressId } = await setup();
    await patchDressLook(dressId, "base", {
      backStyle: "vBack",
      backClosure: "buttons",
    });
    const variant = await addDressStylingVariant(dressId);
    await patchDressLook(dressId, variant, { backClosure: "laceUp" });
    const current = await record(dressId);
    expect(current.backClosure).toBe("buttons");
    expect(resolveDressLook(current, variant)).toMatchObject({
      backStyle: "vBack",
      backClosure: "laceUp",
    });
    const copy = await record(await duplicateDress(dressId));
    expect(copy.backClosure).toBe("buttons");
    expect(copy.stylingVariants![0].snapshot.backClosure).toBe("laceUp");
    const snapshot = await getTourSnapshot(tourId);
    const copiedTour = await importSnapshot(snapshot, "copy");
    const imported = await getTourSnapshot(copiedTour);
    expect(
      imported.dresses.every((dress) => dress.backClosure === "buttons"),
    ).toBe(true);
    expect(
      imported.dresses.every(
        (dress) => dress.stylingVariants![0].snapshot.backClosure === "laceUp",
      ),
    ).toBe(true);
  });

  it("copies only appearance into an independent snapshot without adding another dress", async () => {
    const { tourId, dressId } = await setup();
    const lookId = await addDressStylingVariant(dressId);
    const dress = await record(dressId);
    expect(getDressLooks(dress)).toEqual([
      { id: "base", label: "기본 연출" },
      { id: lookId, label: "연출 1" },
    ]);
    expect(resolveDressLook(dress, lookId)).toMatchObject({
      silhouette: "aLine",
      fabric: "lace",
      topStyle: "strapless",
      neckline: "sweetheart",
      backStyle: "openBack",
      memoryCue: undefined,
      likedReason: undefined,
      concern: undefined,
      memo: "",
      quickTags: [],
      rating: 5,
      isFavorite: true,
      customOptions: dress.customOptions,
    });
    expect(dress.stylingVariants![0].snapshot).not.toHaveProperty("rating");
    expect(dress.stylingVariants![0].snapshot).not.toHaveProperty(
      "faceTransform",
    );
    await patchDressLook(dressId, "base", {
      fabric: "mikadoSatin",
      memoryCue: "기본만 수정",
    });
    expect(resolveDressLook(await record(dressId), lookId).fabric).toBe("lace");
    expect((await getTourSnapshot(tourId)).dresses).toHaveLength(1);
  });

  it("atomically updates paired top fields and preserves independent parts", async () => {
    const { dressId } = await setup();
    const lookId = await addDressStylingVariant(dressId);
    await patchDressLook(dressId, lookId, {
      topStyle: "offShoulder",
      neckline: "straight",
      memoryCue: "어깨 꽃",
    });
    await patchDressLook(dressId, lookId, { neckline: "sweetheart" });
    expect(resolveDressLook(await record(dressId), lookId)).toMatchObject({
      topStyle: "offShoulder",
      neckline: "sweetheart",
      fabric: "lace",
      memoryCue: "어깨 꽃",
    });
    await patchDressLook(dressId, lookId, { topStyle: "longSleeve" });
    expect(resolveDressLook(await record(dressId), lookId).neckline).toBe(
      "sweetheart",
    );
    await expect(
      patchDressLook(dressId, lookId, {
        topStyle: "strap",
        neckline: "invalid" as Dress["neckline"],
      }),
    ).rejects.toThrow();
    expect(resolveDressLook(await record(dressId), lookId).topStyle).toBe(
      "longSleeve",
    );
  });

  it("serializes concurrent latest-record patches and keeps shared feedback on the parent", async () => {
    const { dressId } = await setup();
    const first = await addDressStylingVariant(dressId);
    const second = await addDressStylingVariant(dressId, first);
    await Promise.all([
      patchDressLook(dressId, first, {
        memoryCue: "첫 연출 끝글자",
        customOptions: { top: "첫 메모" },
      }),
      patchDressLook(dressId, second, {
        memoryCue: "둘째 끝글자",
        fabric: "tulle",
      }),
      patchDressLook(dressId, first, {
        rating: 3,
        isFavorite: false,
        topStyle: "offShoulder",
      }),
    ]);
    const dress = await record(dressId);
    expect(dress.memoryCue).toBe("큰 꽃 레이스");
    expect(dress).toMatchObject({ rating: 3, isFavorite: false });
    expect(resolveDressLook(dress, first)).toMatchObject({
      memoryCue: "첫 연출 끝글자",
      topStyle: "offShoulder",
      customOptions: { top: "첫 메모", backStyle: "등 아래까지 파임" },
    });
    expect(resolveDressLook(dress, second)).toMatchObject({
      memoryCue: "둘째 끝글자",
      fabric: "tulle",
      rating: 3,
    });
    db.close();
    await db.open();
    expect(resolveDressLook(await record(dressId), first).memoryCue).toBe(
      "첫 연출 끝글자",
    );
  });

  it("preserves the first explicit completion time", async () => {
    const { dressId } = await setup();
    expect((await record(dressId)).coreRecordedAt).toBeUndefined();
    const firstTime = "2026-10-01T00:00:00.000Z";
    await patchDressLook(dressId, "base", { coreRecordedAt: firstTime });
    await patchDressLook(dressId, "base", {
      coreRecordedAt: "2026-10-02T00:00:00.000Z",
    });
    expect((await record(dressId)).coreRecordedAt).toBe(firstTime);
  });

  it("keeps viewed looks separate from representative selection and falls back after deleting it", async () => {
    const { dressId } = await setup();
    const lookId = await addDressStylingVariant(dressId);
    resolveDressLook(await record(dressId), lookId);
    expect(getPreferredStylingId(await record(dressId))).toBe("base");
    await renameDressStylingVariant(dressId, lookId, " 어깨 감쌈 ");
    await setPreferredStylingVariant(dressId, lookId);
    expect(getPreferredStylingId(await record(dressId))).toBe(lookId);
    expect(getDressLooks(await record(dressId))[1].label).toBe("어깨 감쌈");
    await expect(removeDressStylingVariant(dressId, "base")).rejects.toThrow(
      "기본 연출",
    );
    await removeDressStylingVariant(dressId, lookId);
    expect(getPreferredStylingId(await record(dressId))).toBe("base");
    await expect(
      patchDressLook(dressId, lookId, { memo: "늦게 도착한 저장" }),
    ).rejects.toThrow("연출");
    await expect(addDressStylingVariant(dressId, lookId)).rejects.toThrow(
      "연출",
    );
    expect((await record(dressId)).memo).toBe("기본 메모");
  });

  it("enforces limits without truncating previous choices or resurrecting missing records", async () => {
    const { dressId } = await setup();
    const variants = await Promise.all(
      Array.from({ length: 8 }, () => addDressStylingVariant(dressId)),
    );
    await expect(addDressStylingVariant(dressId)).rejects.toThrow("8개");
    await expect(
      renameDressStylingVariant(dressId, variants[0], "가".repeat(31)),
    ).rejects.toThrow("30자");
    await expect(
      patchDressLook(dressId, variants[0], {
        details: ["floral", "pearl", "corset", "draping", "buttons"],
      }),
    ).rejects.toThrow("4개");
    expect(
      resolveDressLook(await record(dressId), variants[0]).details,
    ).toEqual(["floral"]);
    await expect(
      patchDressLook("deleted-dress", "base", { memo: "늦은 저장" }),
    ).rejects.toThrow("드레스");
    expect((await record(dressId)).stylingVariants).toHaveLength(8);
  });

  it("remaps nested IDs and representative references for duplication and copy imports", async () => {
    const { tourId, dressId } = await setup();
    const lookId = await addDressStylingVariant(dressId);
    await patchDressLook(dressId, lookId, {
      memoryCue: "대표의 특징",
      topStyle: "offShoulder",
    });
    await setPreferredStylingVariant(dressId, lookId);
    const source = await getTourSnapshot(tourId);
    const duplicate = await record(await duplicateDress(dressId));
    expect(duplicate.preferredStylingId).not.toBe(lookId);
    expect(
      resolveDressLook(duplicate, getPreferredStylingId(duplicate)).memoryCue,
    ).toBe("대표의 특징");
    expect(duplicate.isFavorite).toBe(false);
    const copy = await getTourSnapshot(await importSnapshot(source, "copy"));
    expect(copy.dresses).toHaveLength(1);
    const copied = copy.dresses[0];
    expect(copied.preferredStylingId).not.toBe(lookId);
    expect(copied.id).not.toBe(dressId);
    expect(
      resolveDressLook(copied, getPreferredStylingId(copied)).topStyle,
    ).toBe("offShoulder");
    expect(source.dresses[0].preferredStylingId).toBe(lookId);
    await importSnapshot(source, "overwrite");
    expect((await getTourSnapshot(tourId)).dresses).toHaveLength(1);
    expect((await record(dressId)).preferredStylingId).toBe(lookId);
  });
});
