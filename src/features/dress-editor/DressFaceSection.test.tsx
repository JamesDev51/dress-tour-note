import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DEFAULT_FACE_TRANSFORM, type LocalAsset } from "../../types/domain";
import { DressFaceSection } from "./DressFaceSection";

const face: LocalAsset = {
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
};

describe("DressFaceSection", () => {
  it("keeps the face delete control at the 44px minimum in a shrinking header", () => {
    render(
      <DressFaceSection
        face={face}
        includeFace={false}
        transform={DEFAULT_FACE_TRANSFORM}
        onRemove={vi.fn(async () => undefined)}
        onUpload={vi.fn(async () => undefined)}
        onIncludeChange={vi.fn()}
        onTransformPatch={vi.fn()}
        onTransformCommit={vi.fn()}
        onReset={vi.fn()}
      />,
    );

    const deleteButton = screen.getByRole("button", {
      name: "얼굴 사진 삭제",
    });
    fireEvent.focus(deleteButton);

    expect(deleteButton).toHaveClass("min-w-11", "shrink-0");
    expect(deleteButton).toHaveAttribute("aria-label", "얼굴 사진 삭제");
  });
});
