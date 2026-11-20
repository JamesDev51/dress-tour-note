import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "../../db/database";
import {
  addDress,
  addShop,
  createTour,
  deleteShop,
} from "../../db/repositories";
import { useDressEditorData } from "./useDressEditorData";

afterEach(async () => {
  cleanup();
  await db.delete();
  await db.open();
});

describe("dress record loading", () => {
  it("does not load a legacy face asset when opening a dress", async () => {
    const tourId = await createTour();
    const shopId = await addShop(tourId, { name: "샵" });
    const dressId = await addDress(shopId);
    await db.tours.update(tourId, { faceAssetId: "legacy-face" });
    const assetRead = vi.spyOn(db.assets, "get");
    try {
      const hook = renderHook(() => useDressEditorData(dressId));
      await waitFor(() => expect(hook.result.current?.dress.id).toBe(dressId));
      expect(assetRead).not.toHaveBeenCalled();
    } finally {
      assetRead.mockRestore();
    }
  });
  it("distinguishes an unresolved lookup from a resolved missing record", async () => {
    const hook = renderHook(() => useDressEditorData("missing-dress"));
    expect(hook.result.current).toBeUndefined();
    await waitFor(() => expect(hook.result.current).toBeNull());
  });

  it("changes an open record to missing after its shop is deleted", async () => {
    const tourId = await createTour();
    const shopId = await addShop(tourId, { name: "샵" });
    const dressId = await addDress(shopId);
    const hook = renderHook(() => useDressEditorData(dressId));
    await waitFor(() => expect(hook.result.current?.dress.id).toBe(dressId));

    await deleteShop(shopId);

    await waitFor(() => expect(hook.result.current).toBeNull());
  });
});
