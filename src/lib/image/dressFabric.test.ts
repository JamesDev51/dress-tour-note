import { beforeEach, describe, expect, it, vi } from "vitest";
import { loadDressFabricTexture } from "./dressFabric";

describe("dress fabric render texture routing", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("loads the flat render texture instead of the folded option artwork", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      blob: () =>
        Promise.resolve(new window.Blob(["texture"], { type: "image/webp" })),
    } as Response);

    await loadDressFabricTexture("lace");

    expect(fetchMock).toHaveBeenCalledWith(
      "/assets/render-textures/fabric/lace.webp",
    );
  });
});
