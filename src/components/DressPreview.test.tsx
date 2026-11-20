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
  it("keeps compact card error states free of nested retry buttons", async () => {
    prepareGarmentArtwork.mockRejectedValue(new Error("이미지 준비 실패"));
    render(<DressPreview dress={dress} mode="visual" allowRetry={false} />);
    await screen.findByRole("alert");
    expect(
      screen.queryByRole("button", { name: "다시 시도" }),
    ).not.toBeInTheDocument();
  });

  afterEach(() => {
    clearGarmentAssetCache.mockReset();
    prepareGarmentArtwork.mockReset();
    vi.unstubAllGlobals();
  });

  it("shows a local asset failure and retries without keeping a stale image", async () => {
    prepareGarmentArtwork.mockResolvedValue(artwork);

    const { container } = render(<DressPreview dress={dress} mode="visual" />);

    expect(screen.getByText("드레스 그림 준비 중…")).toBeInTheDocument();
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

  it("renders active front features without retired face, rear, color or train settings", async () => {
    prepareGarmentArtwork.mockResolvedValue(artwork);
    const legacy: Dress = {
      ...dress,
      color: "champagne",
      train: "cathedral",
      backStyle: "corsetBack",
      backClosure: "laceUp",
      details: ["pearl", "backBow", "detachableSleeve"],
      faceTransform: { x: 1, y: 1, scale: 1, rotation: 0 },
    };
    const original = JSON.stringify(legacy);
    const { container } = render(
      <DressPreview dress={legacy} view="back" includeFace mode="visual" />,
    );
    await screen.findByRole("img");
    expect(prepareGarmentArtwork).toHaveBeenCalledWith(
      expect.objectContaining({
        color: "pureWhite",
        train: "none",
        backStyle: "unknown",
        details: ["pearl"],
      }),
      expect.objectContaining({ view: "full" }),
    );
    expect(container.querySelector('[data-layer="face"]')).toBeNull();
    expect(screen.queryByText(/뒷모습/)).not.toBeInTheDocument();
    expect(JSON.stringify(legacy)).toBe(original);
  });

  it("keeps core-complete partial artwork concise without a redundant field disclosure", async () => {
    prepareGarmentArtwork.mockResolvedValue({
      ...artwork,
      status: "partial",
      reason: "unknown-field",
      resolvedFields: ["topStyle", "neckline", "silhouette", "fabric"],
      missingFields: ["waistline", "color", "train"],
    } satisfies GarmentArtworkResult);
    const { container } = render(
      <DressPreview
        dress={{
          ...dress,
          waistline: "unknown",
          color: "unknown",
          train: "unknown",
        }}
      />,
    );
    await screen.findByRole("img");
    expect(
      screen.queryByText("기록한 특징을 반영한 참고 그림이에요."),
    ).not.toBeInTheDocument();
    expect(container.querySelector("details")).toBeNull();
    expect(
      screen.queryByText("반영한 특징·미기록 항목"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("미기록 항목: 허리선 · 색상 · 트레인"),
    ).not.toBeInTheDocument();
    expect(container.querySelector("[data-garment-state]")).toHaveAttribute(
      "data-garment-state",
      "partial",
    );
  });

  it("keeps compact partial previews free of interactive disclosures", async () => {
    prepareGarmentArtwork.mockResolvedValue({
      ...artwork,
      status: "partial",
      reason: "unknown-field",
      resolvedFields: ["topStyle", "neckline", "silhouette", "fabric"],
      missingFields: ["waistline", "color", "train"],
    } satisfies GarmentArtworkResult);
    const { container } = render(
      <button type="button">
        <DressPreview dress={dress} mode="visual" allowRetry={false} />
      </button>,
    );
    await screen.findByRole("img");
    expect(
      screen.queryByText("기록한 특징을 반영한 참고 그림이에요."),
    ).not.toBeInTheDocument();
    expect(container.querySelector("details")).toBeNull();
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
