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
import { snapshotDressLook } from "../lib/dress/styling";

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
  it("identifies the resolved look without replacing its fields with the representative look", () => {
    render(
      <RecallDressDetail
        dress={{
          ...dress,
          memoryCue: "현재 보는 기본형",
          preferredStylingId: "other-look",
          stylingVariants: [
            {
              id: "other-look",
              label: "다른 연출",
              snapshot: {
                ...snapshotDressLook(dress),
                memoryCue: "다른 연출의 기억",
              },
              createdAt: dress.createdAt,
              updatedAt: dress.updatedAt,
            },
          ],
        }}
        stylingLabel="기본 연출"
        onEditCore={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );
    expect(screen.getByText("기본 연출")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "현재 보는 기본형" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("다른 연출의 기억")).not.toBeInTheDocument();
  });

  it("places optional feedback editing after the visual and before the saved reasons", () => {
    render(
      <RecallDressDetail
        dress={dress}
        feedbackEditor={<button>느낌 덧붙이기</button>}
        onEditCore={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );
    const editor = screen.getByRole("button", { name: "느낌 덧붙이기" });
    expect(
      screen.getByLabelText("드레스 보기").compareDocumentPosition(editor),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(
      editor.compareDocumentPosition(
        screen.getByRole("heading", { name: "느낌과 평가" }),
      ),
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

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
    const taxonomy = screen.getByText("끈·소매");
    expect(cue.compareDocumentPosition(liked)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(liked.compareDocumentPosition(taxonomy)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(screen.getByText("가슴선이 조금 떴어요.")).toBeInTheDocument();
    expect(screen.getByText("꽃잎이 목선을 따라 이어짐")).toBeInTheDocument();
    expect(screen.getByText("진주 장식 · 단추 장식")).toBeInTheDocument();
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
    expect(within(viewer).getAllByRole("button")).toHaveLength(2);
    await waitFor(() =>
      expect(
        container.querySelector('svg[data-renderer="memory-sketch"]'),
      ).toBeInTheDocument(),
    );
    expect(
      container.querySelector("[data-reference-gown]"),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "상체" }));
    await waitFor(() =>
      expect(
        container.querySelector('svg[data-renderer="memory-sketch"]'),
      ).toHaveAttribute("data-view", "upper"),
    );
    expect(
      container.querySelector('svg[data-renderer="memory-sketch"]'),
    ).toHaveAttribute("data-mode", "visual");
    expect(
      container.querySelector('svg[data-renderer="memory-sketch"] image'),
    ).toBeInTheDocument();
    expect(
      container.querySelector(
        'svg[data-renderer="memory-sketch"] [data-layer="face"]',
      ),
    ).not.toBeInTheDocument();

    if (
      !screen
        .getByText("고른 특징의 예시 보기")
        .parentElement?.hasAttribute("open")
    )
      fireEvent.click(screen.getByText("고른 특징의 예시 보기"));
    fireEvent.click(screen.getByRole("button", { name: "전체 모양 예시" }));
    expect(container.querySelector("[data-reference-gown]")).toHaveAttribute(
      "data-reference-state",
      "available",
    );
    expect(
      container.querySelector('svg[data-renderer="memory-sketch"]'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "기본 기록 수정" }));
    fireEvent.click(screen.getByRole("button", { name: "자세히 기록" }));
    expect(onEditCore).toHaveBeenCalledOnce();
    expect(onOpenDetails).toHaveBeenCalledOnce();
  });

  it("omits retired rear and color controls even for legacy records", async () => {
    render(
      <RecallDressDetail
        dress={{
          ...dress,
          backStyle: "corsetBack",
          color: "champagne",
          train: "cathedral",
        }}
        onEditCore={vi.fn()}
        onOpenDetails={vi.fn()}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "뒷모습" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("등 파임")).not.toBeInTheDocument();
    expect(screen.queryByText("등 뒤 여밈")).not.toBeInTheDocument();
    expect(screen.queryByText("색상")).not.toBeInTheDocument();
    expect(screen.queryByText("뒤로 끌리는 길이")).not.toBeInTheDocument();
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
    if (
      !screen
        .getByText("고른 특징의 예시 보기")
        .parentElement?.hasAttribute("open")
    )
      fireEvent.click(screen.getByText("고른 특징의 예시 보기"));
    fireEvent.click(screen.getByRole("button", { name: "전체 모양 예시" }));
    expect(screen.getAllByText("고른 특징의 예시").length).toBeGreaterThan(0);
    expect(
      document.querySelector('[data-option-art="fabric-lace"]'),
    ).not.toBeNull();
    expect(
      document.querySelector('[data-option-art="backStyle-buttonBack"]'),
    ).toBeNull();
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

    if (
      !screen
        .getByText("고른 특징의 예시 보기")
        .parentElement?.hasAttribute("open")
    )
      fireEvent.click(screen.getByText("고른 특징의 예시 보기"));
    fireEvent.click(screen.getByRole("button", { name: "전체 모양 예시" }));
    expect(container.querySelector("[data-reference-gown]")).toHaveAttribute(
      "data-reference-state",
      "no-reference",
    );
    expect(
      container.querySelector('[data-option-art^="silhouette-"]'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/전체 모양 예시 이미지를 표시할 수 없어요/),
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
    if (
      !screen
        .getByText("고른 특징의 예시 보기")
        .parentElement?.hasAttribute("open")
    )
      fireEvent.click(screen.getByText("고른 특징의 예시 보기"));
    fireEvent.click(screen.getByRole("button", { name: "전체 모양 예시" }));
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
