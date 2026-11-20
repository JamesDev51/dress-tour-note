import {
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Dress } from "../../types/domain";
import { DressPreviewButton } from "./DressPreviewDialog";
describe("explicit dress preview", () => {
  it("shows only on request, keeps the current composition and restores the trigger focus", async () => {
    const view = render(<DressPreviewButton preview={<p>레이스 상체</p>} />);
    expect(screen.queryByText("레이스 상체")).not.toBeInTheDocument();
    const trigger = screen.getByRole("button", { name: "미리보기" });
    trigger.focus();
    fireEvent.click(trigger);
    const dialog = screen.getByRole("dialog", { name: "드레스 미리보기" });
    expect(within(dialog).getByText("레이스 상체")).toBeVisible();
    expect(
      within(dialog).queryByRole("button", { name: "그림에 표시하기" }),
    ).toBeNull();
    view.rerender(
      <DressPreviewButton preview={<p>레이스 상체 · 쉬폰 치마</p>} />,
    );
    expect(within(dialog).getByText("레이스 상체 · 쉬폰 치마")).toBeVisible();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "미리보기 닫기" }),
    );
    await waitFor(() => expect(trigger).toHaveFocus());
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});

const annotatedDress: Dress = {
  id: "dress-1",
  tourId: "tour-1",
  shopId: "shop-1",
  order: 0,
  label: "드레스 01",
  topStyle: "strapless",
  neckline: "sweetheart",
  silhouette: "aLine",
  waistline: "unknown",
  fabric: "lace",
  color: "pureWhite",
  train: "unknown",
  details: [],
  quickTags: [],
  memo: "",
  isFavorite: false,
  createdAt: "",
  updatedAt: "",
  sketchStrokes: [{ width: 4, points: [[0.5, 0.5]] }],
};

it("keeps undo local on cancellation and preserves the draft across a failed save", async () => {
  const onSave = vi
    .fn()
    .mockRejectedValueOnce(new Error("disk full"))
    .mockResolvedValue(undefined);
  render(
    <DressPreviewButton
      preview={<span>전체 도안</span>}
      sketch={{ dress: annotatedDress, onSave }}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "미리보기" }));
  const button = (name: string) => screen.getByRole("button", { name });
  fireEvent.click(button("그림에 표시하기"));
  expect(button("보통")).toHaveFocus();
  fireEvent.click(button("굵게"));
  expect(button("굵게")).toHaveAttribute("aria-pressed", "true");
  fireEvent.click(button("되돌리기"));
  expect(button("되돌리기")).toBeDisabled();
  fireEvent.click(button("취소"));
  expect(onSave).not.toHaveBeenCalled();
  expect(button("그림에 표시하기")).toHaveFocus();
  fireEvent.click(button("그림에 표시하기"));
  expect(button("되돌리기")).toBeEnabled();
  fireEvent.click(button("되돌리기"));
  fireEvent.click(button("표시 저장"));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "표시를 저장하지 못했어요",
  );
  expect(button("되돌리기")).toBeDisabled();
  fireEvent.click(button("표시 저장"));
  await waitFor(() => expect(button("그림에 표시하기")).toHaveFocus());
  expect(onSave.mock.calls).toEqual([[[]], [[]]]);
});
