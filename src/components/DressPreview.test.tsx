import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  GarmentArtworkResult,
  GarmentAsset,
} from "../lib/renderer/garment";
import type { Dress } from "../types/domain";

const { clearGarmentAssetCache, prepareGarmentArtwork } = vi.hoisted(() => ({
  clearGarmentAssetCache: vi.fn(),
  prepareGarmentArtwork: vi.fn(),
}));

vi.mock("../lib/renderer/garment", () => ({
  clearGarmentAssetCache,
  prepareGarmentArtwork,
}));

import { DressPreview } from "./DressPreview";

const dress: Dress = {
  id: "preview-dress",
  tourId: "tour",
  shopId: "shop",
  order: 0,
  label: "Preview dress",
  topStyle: "longSleeve",
  neckline: "high",
  silhouette: "aLine",
  waistline: "natural",
  backStyle: "unknown",
  fabric: "mikadoSatin",
  color: "ivory",
  train: "none",
  details: [],
  quickTags: [],
  memo: "",
  isFavorite: false,
  createdAt: "2026-09-12T00:00:00.000Z",
  updatedAt: "2026-09-12T00:00:00.000Z",
};

const asset = {
  assetId: "preview-asset",
  path: "/assets/garment/test.webp",
  role: "matched-upper",
  mime: "image/webp",
  byteLength: 1,
  sourceSha256: "source",
  optimizedSha256: "optimized",
  sourceFrame: {
    width: 1,
    height: 1,
    logicalWidth: 360,
    logicalHeight: 640,
    scale: 1,
    offsetX: 0,
    offsetY: 0,
  },
  logicalBounds: { x: 0, y: 0, width: 360, height: 640 },
  anchors: { centerX: 180, waistY: 170, hemY: 552 },
  regions: {},
  coverage: { view: "front-full" },
  alpha: "runtime-matte",
  rendererVersion: "test",
} satisfies GarmentAsset;

const artwork = {
  view: "full",
  color: "ivory",
  status: "ready",
  markup:
    '<svg viewBox="0 0 360 640"><defs></defs><g data-layer="garment-composition"><image href="/assets/garment/test.webp" /></g></svg>',
  viewBox: { x: 0, y: 0, width: 360, height: 640 },
  logicalBounds: { x: 0, y: 0, width: 360, height: 640 },
  layers: [{ asset, region: "full" }],
  textures: [],
  assetIds: [asset.assetId],
  resolvedFields: [],
  missingFields: [],
  warnings: [],
} satisfies GarmentArtworkResult;

const detailAsset = {
  ...asset,
  assetId: "preview-detail",
  path: "/assets/garment/detail/test.webp",
  role: "detail-master",
} satisfies GarmentAsset;

describe("DressPreview", () => {
  afterEach(() => {
    clearGarmentAssetCache.mockReset();
    prepareGarmentArtwork.mockReset();
    vi.unstubAllGlobals();
  });

  it("shows a local asset failure and retries without keeping a stale image", async () => {
    prepareGarmentArtwork.mockResolvedValue(artwork);

    const { container } = render(<DressPreview dress={dress} mode="visual" />);

    expect(screen.getByText("선택한 특징 이미지 준비 중…")).toBeInTheDocument();
    const assetCheck = await screen.findByRole("img", {
      hidden: true,
    });
    fireEvent.error(
      container.querySelector("[data-garment-asset-check]") ?? assetCheck,
    );
    await screen.findByRole("alert");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();

    screen.getByRole("button", { name: "다시 시도" }).click();
    await waitFor(() =>
      expect(screen.getByRole("img")).toHaveAttribute(
        "data-renderer",
        "memory-sketch",
      ),
    );
    expect(clearGarmentAssetCache).toHaveBeenCalledOnce();
  });

  it("checks local detail assets before presenting prepared artwork", async () => {
    const detailArtwork = {
      ...artwork,
      markup:
        '<svg viewBox="0 0 360 640"><defs></defs><g data-layer="garment-composition"><image href="/assets/garment/detail/test.webp" /></g></svg>',
      detailAssets: [detailAsset],
      assetIds: [asset.assetId, detailAsset.assetId],
    } satisfies GarmentArtworkResult;
    prepareGarmentArtwork.mockResolvedValue(detailArtwork);

    const { container } = render(<DressPreview dress={dress} mode="visual" />);

    await waitFor(() =>
      expect(
        container.querySelectorAll("[data-garment-asset-check]"),
      ).toHaveLength(2),
    );
    fireEvent.error(
      container.querySelector('[data-garment-asset-check="preview-detail"]')!,
    );

    await screen.findByRole("alert");
    expect(container.querySelector("svg")).not.toBeInTheDocument();
  });

  it("labels an unknown back construction and opens its detail editor", async () => {
    const backArtwork = {
      ...artwork,
      view: "back",
      color: "unknown",
      status: "partial",
      markup: '<svg viewBox="0 0 360 640"><defs></defs></svg>',
      layers: [],
      assetIds: [],
      missingFields: ["backStyle"],
      reason: "unknown-field",
      warnings: ["back-construction-unknown"],
    } satisfies GarmentArtworkResult;
    const onOpenDetails = vi.fn();
    prepareGarmentArtwork.mockResolvedValue(backArtwork);

    render(
      <DressPreview
        dress={{ ...dress, backStyle: "unknown" }}
        view="back"
        mode="visual"
        onOpenDetails={onOpenDetails}
      />,
    );

    await screen.findByText(/뒤태를 아직 기록하지 않았어요/);
    expect(
      screen.getByText("뒤태 미기록", { exact: true }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "뒤태 기록하기" }));
    expect(onOpenDetails).toHaveBeenCalledOnce();
  });

  it("keeps SVG definitions unique for two previews of one record", async () => {
    prepareGarmentArtwork.mockResolvedValue(artwork);

    const { container } = render(
      <>
        <DressPreview dress={dress} mode="visual" />
        <DressPreview dress={dress} mode="visual" />
      </>,
    );

    await waitFor(() =>
      expect(
        container.querySelectorAll('svg[data-renderer="memory-sketch"]'),
      ).toHaveLength(2),
    );
    const ids = Array.from(container.querySelectorAll("svg [id]"), (node) =>
      node.getAttribute("id"),
    ).filter((id): id is string => Boolean(id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("drops a stale view result when the requested view changes quickly", async () => {
    let resolveFull: ((result: GarmentArtworkResult) => void) | undefined;
    let resolveUpper: ((result: GarmentArtworkResult) => void) | undefined;
    prepareGarmentArtwork.mockImplementation(
      (_dress: Dress, { view }: { readonly view: string }) => {
        return new Promise<GarmentArtworkResult>((resolve) => {
          if (view === "full") resolveFull = resolve;
          else resolveUpper = resolve;
        });
      },
    );
    const { container, rerender } = render(
      <DressPreview dress={dress} view="full" mode="visual" />,
    );
    rerender(<DressPreview dress={dress} view="upper" mode="visual" />);

    resolveFull?.(artwork);
    resolveUpper?.({
      ...artwork,
      view: "upper",
      markup:
        '<svg viewBox="0 0 360 640"><defs></defs><g data-layer="garment-composition"><image href="/assets/garment/test.webp" /></g></svg>',
    });

    await waitFor(() =>
      expect(
        container.querySelector('svg[data-renderer="memory-sketch"]'),
      ).toHaveAttribute("data-view", "upper"),
    );
  });

  it("drops a stale selection result when the dress changes quickly", async () => {
    let resolveFirst: ((result: GarmentArtworkResult) => void) | undefined;
    let resolveSecond: ((result: GarmentArtworkResult) => void) | undefined;
    const firstDress = dress;
    const secondDress = {
      ...dress,
      id: "preview-dress-second",
      label: "Second",
    };
    const secondAsset = { ...asset, assetId: "preview-asset-second" };
    prepareGarmentArtwork.mockImplementation((currentDress: Dress) => {
      return new Promise<GarmentArtworkResult>((resolve) => {
        if (currentDress.id === firstDress.id) resolveFirst = resolve;
        else resolveSecond = resolve;
      });
    });
    const { container, rerender } = render(
      <DressPreview dress={firstDress} mode="visual" />,
    );
    rerender(<DressPreview dress={secondDress} mode="visual" />);

    resolveFirst?.(artwork);
    resolveSecond?.({
      ...artwork,
      layers: [{ asset: secondAsset, region: "full" }],
      assetIds: [secondAsset.assetId],
    });

    await waitFor(() =>
      expect(
        container.querySelector('svg[data-renderer="memory-sketch"]'),
      ).toHaveAttribute("aria-label", "Second 드레스 기억 스케치"),
    );
    expect(
      container.querySelector('[data-asset-ids="preview-asset"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-asset-ids="preview-asset-second"]'),
    ).toBeInTheDocument();
  });
});
