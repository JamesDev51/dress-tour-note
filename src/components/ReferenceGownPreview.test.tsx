import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Dress } from "../types/domain";
import { ReferenceGownPreview } from "./ReferenceGownPreview";

const dress: Dress = {
  id: "reference-dress",
  tourId: "tour",
  shopId: "shop",
  order: 0,
  label: "Dress 01",
  topStyle: "longSleeve",
  neckline: "high",
  silhouette: "mermaid",
  waistline: "natural",
  backStyle: "buttonBack",
  fabric: "lace",
  color: "ivory",
  train: "none",
  details: ["pearl"],
  quickTags: [],
  memo: "",
  isFavorite: false,
  createdAt: "2026-09-12T00:00:00.000Z",
  updatedAt: "2026-09-12T00:00:00.000Z",
};

describe("ReferenceGownPreview", () => {
  it("renders the silhouette image and recorded option examples separately", () => {
    const { container } = render(<ReferenceGownPreview dress={dress} />);

    expect(
      screen.getByRole("heading", { name: "전체 모양 예시" }),
    ).toBeInTheDocument();
    expect(container.querySelector("[data-reference-gown]")).toHaveAttribute(
      "data-reference-silhouette",
      "mermaid",
    );
    expect(
      container.querySelector('[data-option-art="silhouette-mermaid"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-option-art="top-longSleeve"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-option-art="neckline-high"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-option-art="fabric-lace"]'),
    ).toBeInTheDocument();
    expect(screen.getByText("긴 소매 예시")).toBeInTheDocument();
    expect(screen.getByText("목까지 덮임 예시")).toBeInTheDocument();
    expect(screen.getByText("레이스 예시")).toBeInTheDocument();
  });

  it("keeps unknown and custom silhouettes text-only", () => {
    const { container, rerender } = render(
      <ReferenceGownPreview dress={{ ...dress, silhouette: "unknown" }} />,
    );

    expect(container.querySelector("[data-reference-gown]")).toHaveAttribute(
      "data-reference-state",
      "no-reference",
    );
    expect(
      container.querySelector('[data-option-art^="silhouette-"]'),
    ).not.toBeInTheDocument();

    rerender(
      <ReferenceGownPreview
        dress={{
          ...dress,
          customOptions: { silhouette: "허리선이 더 길었어요" },
        }}
      />,
    );
    expect(container.querySelector("[data-reference-gown]")).toHaveAttribute(
      "data-reference-state",
      "no-reference",
    );
    expect(
      container.querySelector('[data-option-art^="silhouette-"]'),
    ).not.toBeInTheDocument();
  });

  it("uses compact recorded labels for cards", () => {
    render(<ReferenceGownPreview dress={dress} variant="compact" />);

    expect(screen.getByText("전체 모양 예시 · 머메이드")).toBeInTheDocument();
    expect(
      screen.getByLabelText(
        "기록된 주요 선택 끈·소매 긴 소매 · 목·가슴선 목까지 덮임 · 소재·표면 레이스",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText("고른 특징의 예시")).not.toBeInTheDocument();
  });
});
