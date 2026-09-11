import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Dress } from "../types/domain";
import { DressDecisionCard } from "./DressDecisionCard";

const dress: Dress = {
  id: "dress",
  tourId: "tour",
  shopId: "shop",
  order: 0,
  label: "Dress 01",
  topStyle: "strapless",
  neckline: "unknown",
  silhouette: "aLine",
  waistline: "natural",
  fabric: "lace",
  color: "ivory",
  train: "chapel",
  details: ["pearl"],
  quickTags: ["신부 픽"],
  rating: 5,
  memo: "가".repeat(80),
  isFavorite: true,
  customOptions: { neckline: "나".repeat(80) },
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
};

describe("DressDecisionCard", () => {
  it("renders a no-face full memory sketch and the compact shop decision summary", () => {
    const { container } = render(
      <DressDecisionCard dress={dress} variant="shop" />,
    );

    expect(screen.getByText("Dress 01")).toBeInTheDocument();
    expect(screen.getByText("후보")).toBeInTheDocument();
    expect(screen.getByText("5 / 5")).toBeInTheDocument();
    expect(screen.getByText(/네크라인 차이/)).toBeInTheDocument();
    expect(screen.getAllByText("기억 안 남")).toHaveLength(1);
    expect(container.querySelector("svg")).toHaveAttribute("data-view", "full");
    expect(container.querySelector("image")).not.toBeInTheDocument();
  });

  it("keeps unknown, details, exception, and an 80-character memo visible in review", () => {
    render(<DressDecisionCard dress={dress} variant="review" />);

    expect(screen.getByText("기억 안 남")).toBeInTheDocument();
    expect(screen.getAllByText("진주 장식").length).toBeGreaterThan(0);
    expect(
      screen
        .getAllByText("나".repeat(80))
        .find(({ tagName }) => tagName === "DD"),
    ).toHaveTextContent("나".repeat(80));
    expect(screen.getByText("가".repeat(80))).toHaveTextContent(
      "가".repeat(80),
    );
  });
});
