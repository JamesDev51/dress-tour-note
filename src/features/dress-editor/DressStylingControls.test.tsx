import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Dress, DressLookSnapshot } from "../../types/domain";
import { DressStylingControls } from "./DressStylingControls";

const snapshot: DressLookSnapshot = {
  topStyle: "strapless",
  neckline: "sweetheart",
  silhouette: "aLine",
  waistline: "unknown",
  fabric: "lace",
  color: "ivory",
  train: "unknown",
  details: [],
  quickTags: [],
  memo: "",
};
const dress: Dress = {
  ...snapshot,
  id: "dress-1",
  tourId: "tour-1",
  shopId: "shop-1",
  order: 1,
  label: "드레스 01",
  isFavorite: false,
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
  stylingVariants: [
    {
      id: "look-1",
      label: "어깨를 감싼 연출",
      snapshot: { ...snapshot, topStyle: "offShoulder" },
      createdAt: "2026-11-01T00:00:00.000Z",
      updatedAt: "2026-11-01T00:00:00.000Z",
    },
  ],
};

describe("DressStylingControls", () => {
  it("keeps individual viewing and representative selection without comparison controls", () => {
    const props = {
      dress,
      lookId: "base",
      busy: false,
      onSwitch: vi.fn(),
      name: "어깨를 감싼 연출",
      onNameChange: vi.fn(),
      onNameBlur: vi.fn(),
      onDelete: vi.fn(),
      onPrefer: vi.fn(),
    };
    const { rerender } = render(
      <DressStylingControls
        {...props}
        dress={{ ...dress, stylingVariants: undefined }}
      />,
    );
    expect(screen.queryByRole("group")).not.toBeInTheDocument();
    rerender(<DressStylingControls {...props} />);
    expect(screen.queryByText("연출 추가")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "기본 연출 · 대표" }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "어깨를 감싼 연출" }));
    expect(props.onSwitch).toHaveBeenCalledWith("look-1");

    rerender(<DressStylingControls {...props} lookId="look-1" />);
    expect(
      screen.getByRole("button", { name: "어깨를 감싼 연출" }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "대표 연출로 선택" }));
    expect(props.onPrefer).toHaveBeenCalledOnce();

    rerender(
      <DressStylingControls
        {...props}
        lookId="look-1"
        dress={{ ...dress, preferredStylingId: "look-1" }}
      />,
    );
    expect(
      screen.getByRole("button", { name: "어깨를 감싼 연출 · 대표" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.queryByRole("button", { name: "대표 연출로 선택" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText(/연출 비교/)).not.toBeInTheDocument();
  });
});
