import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_FACE_TRANSFORM, type Dress } from "../../types/domain";
import { DressDetailsPanel } from "./DressDetailsPanel";

const dress: Dress = {
  id: "dress-1",
  tourId: "tour-1",
  shopId: "shop-1",
  order: 0,
  label: "드레스 1",
  topStyle: "strapless",
  neckline: "sweetheart",
  silhouette: "aLine",
  waistline: "unknown",
  backStyle: "unknown",
  fabric: "unknown",
  color: "unknown",
  train: "unknown",
  details: [],
  quickTags: [],
  memo: "",
  isFavorite: false,
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
};

function renderPanel(
  onPatch: (patch: Partial<Dress>) => Promise<void> = vi.fn(
    async () => undefined,
  ),
) {
  render(
    <DressDetailsPanel
      dress={dress}
      memo=""
      transform={DEFAULT_FACE_TRANSFORM}
      face={undefined}
      includeFace={false}
      onPatch={onPatch}
      onCustomCommit={vi.fn()}
      onMemoChange={vi.fn()}
      onMemoBlur={vi.fn()}
      onRemoveFace={vi.fn(async () => undefined)}
      onUploadFace={vi.fn(async () => undefined)}
      onIncludeFaceChange={vi.fn()}
      onTransformPatch={vi.fn()}
      onTransformCommit={vi.fn()}
      onResetFace={vi.fn()}
      onClose={vi.fn()}
    />,
  );
  return onPatch;
}

describe("DressDetailsPanel", () => {
  it("contains only three additional catalogs and retains supporting tools", () => {
    renderPanel();
    for (const heading of [
      "색상",
      "등 디자인",
      "디테일",
      "입어봤을 때 어땠나요?",
      "특이사항",
      "내 얼굴로 느낌 보기",
    ]) {
      expect(screen.getByRole("heading", { name: heading })).toBeVisible();
    }
    expect(
      Array.from(
        document.querySelectorAll("[data-option-category]"),
        (element) => element.getAttribute("data-option-category"),
      ),
    ).toEqual(["color", "backStyle", "details"]);
    expect(screen.getByText("얼굴 사진 추가")).toBeVisible();
  });

  it("persists detail choices independently and suppresses a repeated tap while saving", async () => {
    let finish: (() => void) | undefined;
    const onPatch = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    );
    renderPanel(onPatch);
    const pearl = screen.getByRole("button", { name: /진주 장식/ });
    fireEvent.click(pearl);
    fireEvent.click(pearl);

    expect(onPatch).toHaveBeenCalledTimes(1);
    expect(onPatch).toHaveBeenCalledWith({ details: ["pearl"] });
    expect(pearl).toBeDisabled();
    finish?.();
    await waitFor(() => expect(pearl).toBeEnabled());
  });

  it("clears a closest-choice note atomically with an unknown selection", () => {
    const onPatch = vi.fn(async () => undefined);
    render(
      <DressDetailsPanel
        dress={{
          ...dress,
          color: "ivory",
          customOptions: {
            color: "색이 달라요",
            neckline: "스캘럽 가장자리",
          },
        }}
        memo=""
        transform={DEFAULT_FACE_TRANSFORM}
        face={undefined}
        includeFace={false}
        onPatch={onPatch}
        onCustomCommit={vi.fn()}
        onMemoChange={vi.fn()}
        onMemoBlur={vi.fn()}
        onRemoveFace={vi.fn(async () => undefined)}
        onUploadFace={vi.fn(async () => undefined)}
        onIncludeFaceChange={vi.fn()}
        onTransformPatch={vi.fn()}
        onTransformCommit={vi.fn()}
        onResetFace={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const colorSection = document.querySelector(
      '[data-option-category="color"]',
    );
    if (!(colorSection instanceof HTMLElement))
      throw new Error("color section missing");
    fireEvent.click(
      colorSection.querySelector("[data-option-unknown]") ?? colorSection,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "메모 지우고 기억 안 남 선택" }),
    );

    expect(onPatch).toHaveBeenCalledOnce();
    expect(onPatch).toHaveBeenCalledWith({
      color: "unknown",
      customOptions: { color: undefined },
    });
  });

  it("requires an explicit opt-in before including a stored local face", () => {
    const onIncludeFaceChange = vi.fn();
    render(
      <DressDetailsPanel
        dress={dress}
        memo=""
        transform={DEFAULT_FACE_TRANSFORM}
        face={{
          id: "face-1",
          tourId: "tour-1",
          kind: "face",
          mimeType: "image/webp",
          blob: new Blob(),
          width: 2,
          height: 2,
          byteLength: 0,
          sha256: "face",
          createdAt: "2026-09-04T00:00:00.000Z",
        }}
        includeFace={false}
        onPatch={vi.fn(async () => undefined)}
        onCustomCommit={vi.fn()}
        onMemoChange={vi.fn()}
        onMemoBlur={vi.fn()}
        onRemoveFace={vi.fn(async () => undefined)}
        onUploadFace={vi.fn(async () => undefined)}
        onIncludeFaceChange={onIncludeFaceChange}
        onTransformPatch={vi.fn()}
        onTransformCommit={vi.fn()}
        onResetFace={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const toggle = screen.getByRole("button", {
      name: "얼굴 미리보기 켜기",
    });
    expect(toggle).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(toggle);
    expect(onIncludeFaceChange).toHaveBeenCalledWith(true);
  });

  it("communicates the four-detail cap and keeps selected details removable", () => {
    render(
      <DressDetailsPanel
        dress={{
          ...dress,
          details: ["corset", "draping", "waistBow", "backBow"],
        }}
        memo=""
        transform={DEFAULT_FACE_TRANSFORM}
        face={undefined}
        includeFace={false}
        onPatch={vi.fn(async () => undefined)}
        onCustomCommit={vi.fn()}
        onMemoChange={vi.fn()}
        onMemoBlur={vi.fn()}
        onRemoveFace={vi.fn(async () => undefined)}
        onUploadFace={vi.fn(async () => undefined)}
        onIncludeFaceChange={vi.fn()}
        onTransformPatch={vi.fn()}
        onTransformCommit={vi.fn()}
        onResetFace={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    const detailsSection = document.querySelector(
      '[data-option-category="details"]',
    );
    if (!(detailsSection instanceof HTMLElement)) {
      throw new Error("details section missing");
    }
    expect(screen.getByText("최대 4개 선택 · 4/4")).toBeVisible();
    expect(
      within(detailsSection).getByRole("button", { name: /코르셋/ }),
    ).toBeEnabled();
    expect(
      within(detailsSection).getByRole("button", { name: /진주 장식/ }),
    ).toBeDisabled();
  });
});
