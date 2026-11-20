import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { Dress } from "../types/domain";
import { DressDecisionCard } from "./DressDecisionCard";
import { snapshotDressLook } from "../lib/dress/styling";

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
  it("shows the preferred look while retaining the dress identity and common rating", async () => {
    const preferred: Dress = {
      ...dress,
      preferredStylingId: "shoulder-wrap",
      stylingVariants: [
        {
          id: "shoulder-wrap",
          label: "어깨 장식 추가",
          snapshot: {
            ...snapshotDressLook(dress),
            topStyle: "offShoulder",
            memoryCue: "어깨를 감싼 꽃 장식",
            likedReason: "어깨 장식이 마음에 들었어요.",
            customOptions: undefined,
          },
          createdAt: dress.createdAt,
          updatedAt: dress.updatedAt,
        },
      ],
    };
    render(<DressDecisionCard dress={preferred} shopName="첫 샵" />);

    expect(
      screen.getByRole("heading", { name: "어깨를 감싼 꽃 장식" }),
    ).toBeInTheDocument();
    expect(screen.getByText("첫 샵 · 1번째 · Dress 01")).toBeInTheDocument();
    expect(screen.getByText("대표 연출 · 어깨 장식 추가")).toBeInTheDocument();
    expect(
      screen.getByText("어깨 장식이 마음에 들었어요."),
    ).toBeInTheDocument();
    expect(screen.getByText("5 / 5")).toBeInTheDocument();
    expect(screen.queryByText("은은한 레이스와 진주")).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        document.querySelector('svg[data-renderer="memory-sketch"]'),
      ).toBeInTheDocument(),
    );
  });

  it("uses the dress name when the preferred look has no recall cue", async () => {
    render(
      <DressDecisionCard
        dress={{
          ...dress,
          preferredStylingId: "new-look",
          stylingVariants: [
            {
              id: "new-look",
              label: "연출 1",
              snapshot: {
                ...snapshotDressLook(dress),
                memoryCue: undefined,
                likedReason: undefined,
                concern: undefined,
                memo: "",
                quickTags: [],
              },
              createdAt: dress.createdAt,
              updatedAt: dress.updatedAt,
            },
          ],
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Dress 01" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("은은한 레이스와 진주")).not.toBeInTheDocument();
    expect(
      screen.queryByText("가볍고 허리선이 편했어요."),
    ).not.toBeInTheDocument();
    await waitFor(() =>
      expect(
        document.querySelector('svg[data-renderer="memory-sketch"]'),
      ).toBeInTheDocument(),
    );
  });

  it("renders the selection-aware image and the compact shop decision summary", async () => {
    const { container } = render(<DressDecisionCard dress={dress} />);

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
        "기록한 치마 모양이에요. 상체를 고르면 전체 모습을 볼 수 있어요.",
      ),
    ).toBeInTheDocument();
    expect(container.querySelector("button")).not.toBeInTheDocument();
  });

  it("keeps review cards concise while retaining recall and selection-aware visual cues", async () => {
    const { container } = render(<DressDecisionCard dress={dress} />);

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
