import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Dress } from "../types/domain";
import { RecallDressDetail } from "./RecallDressDetail";

const dress: Dress = {
  id: "recall-dress",
  tourId: "tour",
  shopId: "shop",
  order: 1,
  label: "Dress 02",
  memoryCue: "실크 광택이 선명했던 드레스",
  likedReason: "허리선과 가벼운 느낌이 좋았어요.",
  concern: "가슴선이 조금 떴어요.",
  topStyle: "strapless",
  neckline: "sweetheart",
  silhouette: "mermaid",
  waistline: "natural",
  backStyle: "buttonBack",
  fabric: "lace",
  color: "ivory",
  train: "chapel",
  details: ["pearl", "buttons"],
  quickTags: ["가벼움", "신부 픽"],
  rating: 5,
  memo: "가".repeat(160),
  isFavorite: true,
  customOptions: { neckline: "꽃잎이 목선을 따라 이어짐" },
  createdAt: "2026-09-11T00:00:00.000Z",
  updatedAt: "2026-09-11T00:00:00.000Z",
};

describe("RecallDressDetail", () => {
  it("puts recall before taxonomy and keeps every saved note readable", () => {
    render(
      <RecallDressDetail
        dress={dress}
        onEditCore={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );

    const cue = screen.getByRole("heading", {
      name: "실크 광택이 선명했던 드레스",
    });
    const liked = screen.getByText("허리선과 가벼운 느낌이 좋았어요.");
    const taxonomy = screen.getByText("상의 디자인");
    expect(cue.compareDocumentPosition(liked)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(liked.compareDocumentPosition(taxonomy)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.getByText("가슴선이 조금 떴어요.")).toBeInTheDocument();
    expect(screen.getByText("꽃잎이 목선을 따라 이어짐")).toBeInTheDocument();
    expect(screen.getByText("진주 장식 · 버튼 장식")).toBeInTheDocument();
    expect(screen.getByText("가".repeat(160))).toHaveTextContent(
      "가".repeat(160),
    );
    expect(screen.getByText("2번째 · Dress 02")).toBeInTheDocument();
  });

  it("keeps long exception notes and memo in full detail", () => {
    render(
      <RecallDressDetail
        dress={{
          ...dress,
          customOptions: { neckline: "나".repeat(80) },
          memo: "가".repeat(80),
        }}
        onEditCore={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );

    expect(screen.getByText("나".repeat(80))).toHaveTextContent(
      "나".repeat(80),
    );
    expect(screen.getByText("가".repeat(80))).toHaveTextContent(
      "가".repeat(80),
    );
  });

  it("defaults to the selection-aware image and keeps the recorded sketch views", async () => {
    const onEditCore = vi.fn();
    const onOpenDetails = vi.fn();
    const { container } = render(
      <RecallDressDetail
        dress={dress}
        onEditCore={onEditCore}
        onOpenDetails={onOpenDetails}
      />,
    );

    const viewer = screen.getByLabelText("드레스 보기");
    expect(within(viewer).getAllByRole("button")).toHaveLength(4);
    await waitFor(() =>
      expect(
        container.querySelector('svg[data-renderer="memory-sketch"]'),
      ).toBeInTheDocument(),
    );
    expect(
      container.querySelector("[data-reference-gown]"),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "뒤태" }));
    await waitFor(() =>
      expect(
        container.querySelector('svg[data-renderer="memory-sketch"]'),
      ).toHaveAttribute("data-view", "back"),
    );
    expect(
      container.querySelector('svg[data-renderer="memory-sketch"]'),
    ).toHaveAttribute("data-mode", "visual");
    expect(
      container.querySelector('svg[data-renderer="memory-sketch"] image'),
    ).not.toBeInTheDocument();
    expect(
      container.querySelector(
        'svg[data-renderer="memory-sketch"] [data-shape="mermaid"]',
      ),
    ).toBeInTheDocument();
    expect(
      container.querySelector(
        'svg[data-renderer="memory-sketch"] [data-layer="face"]',
      ),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "실루엣 참고" }));
    expect(container.querySelector("[data-reference-gown]")).toHaveAttribute(
      "data-reference-state",
      "available",
    );
    expect(
      container.querySelector('svg[data-renderer="memory-sketch"]'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "핵심 기록 수정" }));
    fireEvent.click(screen.getByRole("button", { name: "상세 기록" }));
    expect(onEditCore).toHaveBeenCalledOnce();
    expect(onOpenDetails).toHaveBeenCalledOnce();
  });

  it("makes an unrecorded back view explicit and offers its detail action", async () => {
    const onOpenDetails = vi.fn();
    const { container } = render(
      <RecallDressDetail
        dress={{ ...dress, backStyle: "unknown" }}
        onEditCore={vi.fn()}
        onOpenDetails={onOpenDetails}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "뒤태" }));
    await waitFor(() =>
      expect(
        container.querySelector('svg[data-renderer="memory-sketch"]'),
      ).toHaveAttribute("data-view", "back"),
    );
    expect(
      screen.getByText(/뒤태를 아직 기록하지 않았어요/),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "뒤태 기록하기" }));
    expect(onOpenDetails).toHaveBeenCalledOnce();
  });

  it("shows known selected examples and does not invent unknown artwork", async () => {
    const { container, rerender } = render(
      <RecallDressDetail
        dress={dress}
        onEditCore={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );

    await waitFor(() =>
      expect(
        container.querySelector('svg[data-renderer="memory-sketch"]'),
      ).toBeInTheDocument(),
    );
    fireEvent.click(screen.getByRole("button", { name: "실루엣 참고" }));
    expect(screen.getByText("선택한 특징 · 예시 이미지")).toBeInTheDocument();
    expect(
      document.querySelector('[data-option-art="fabric-lace"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('[data-option-art="backStyle-buttonBack"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('[data-option-art="details-pearl"]'),
    ).not.toBeNull();

    rerender(
      <RecallDressDetail
        dress={{
          ...dress,
          fabric: "unknown",
          backStyle: "unknown",
          details: [],
        }}
        onEditCore={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );
    expect(
      document.querySelector('[data-option-art="fabric-unknown"]'),
    ).toBeNull();
    expect(
      document.querySelector('[data-option-art="backStyle-unknown"]'),
    ).toBeNull();
  });

  it("keeps a sparse legacy record honest", () => {
    render(
      <RecallDressDetail
        dress={{
          ...dress,
          memoryCue: undefined,
          likedReason: undefined,
          concern: undefined,
          label: "Dress 01",
        }}
        onEditCore={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Dress 01" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("기억할 특징을 아직 적지 않았어요."),
    ).toBeInTheDocument();
  });

  it("does not substitute a silhouette reference for an unknown or custom silhouette", () => {
    const { container, rerender } = render(
      <RecallDressDetail
        dress={{ ...dress, silhouette: "unknown" }}
        onEditCore={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "실루엣 참고" }));
    expect(container.querySelector("[data-reference-gown]")).toHaveAttribute(
      "data-reference-state",
      "no-reference",
    );
    expect(
      container.querySelector('[data-option-art^="silhouette-"]'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/실루엣 참고 이미지를 표시할 수 없어요/),
    ).toBeInTheDocument();

    rerender(
      <RecallDressDetail
        dress={{
          ...dress,
          customOptions: { silhouette: "허리선이 더 길었어요" },
        }}
        onEditCore={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "실루엣 참고" }));
    expect(container.querySelector("[data-reference-gown]")).toHaveAttribute(
      "data-reference-state",
      "no-reference",
    );
    expect(
      container.querySelector('[data-option-art^="silhouette-"]'),
    ).not.toBeInTheDocument();
  });
});

it("keeps the shop and fitting order visible beside a remembered feature", () => {
  render(
    <RecallDressDetail
      dress={dress}
      shopName="루미에르 브라이덜"
      onEditCore={() => undefined}
      onOpenDetails={() => undefined}
    />,
  );
  expect(screen.getByText(/루미에르 브라이덜/)).toHaveTextContent(
    "2번째 · Dress 02",
  );
});
