import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Dress } from "../types/domain";
import { DressDecisionCard } from "./DressDecisionCard";

const dress: Dress = {
  id: "dress",
  tourId: "tour",
  shopId: "shop",
  order: 0,
  label: "Dress 01",
  memoryCue: "은은한 레이스와 진주",
  likedReason: "가볍고 허리선이 편했어요.",
  concern: "가슴선이 조금 떴어요.",
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
  it("renders the selection-aware image and the compact shop decision summary", async () => {
    const { container } = render(
      <DressDecisionCard dress={dress} variant="shop" />,
    );

    expect(
      screen.getByRole("heading", { name: "은은한 레이스와 진주" }),
    ).toBeInTheDocument();
    expect(screen.getByText("1번째 · Dress 01")).toBeInTheDocument();
    expect(screen.getByText("가볍고 허리선이 편했어요.")).toBeInTheDocument();
    expect(screen.getByText("후보")).toBeInTheDocument();
    expect(screen.getByText("5 / 5")).toBeInTheDocument();
    expect(screen.queryByText(/네크라인 차이/)).not.toBeInTheDocument();
    expect(screen.queryByText("기억 안 남")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        container.querySelector('svg[data-renderer="memory-sketch"]'),
      ).toBeInTheDocument(),
    );
    expect(
      container.querySelector("[data-reference-gown]"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(
        /드레스 형태를 기록하면|형태 참고 이미지예요|선택한 특징으로 재구성한 이미지예요/,
      ),
    ).toBeInTheDocument();
    expect(container.querySelector("button")).not.toBeInTheDocument();
  });

  it("keeps review cards concise while retaining recall and selection-aware visual cues", async () => {
    const { container } = render(
      <DressDecisionCard dress={dress} variant="review" />,
    );

    expect(screen.getByText("가볍고 허리선이 편했어요.")).toBeInTheDocument();
    expect(screen.getByText("신부 픽")).toBeInTheDocument();
    expect(
      container.querySelector('[data-option-art="fabric-lace"]'),
    ).not.toBeNull();
    expect(screen.queryByText("상의 디자인")).not.toBeInTheDocument();
    expect(screen.queryByText("나".repeat(80))).not.toBeInTheDocument();
    expect(screen.queryByText("가".repeat(80))).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        container.querySelector('svg[data-renderer="memory-sketch"]'),
      ).toBeInTheDocument(),
    );
    expect(
      container.querySelector("[data-reference-gown]"),
    ).not.toBeInTheDocument();
    expect(container.querySelector("button")).not.toBeInTheDocument();
  });
});
