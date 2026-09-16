import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OptionArtwork } from "./OptionArtwork";
import { OptionTile } from "./OptionTile";

describe("OptionTile", () => {
  it("places the selected badge beside the label instead of over artwork", () => {
    render(
      <OptionTile
        label="오프숄더"
        selected
        onClick={() => undefined}
        icon={<span>그림</span>}
      />,
    );

    const badge = screen
      .getByRole("button")
      .querySelector("[data-selected-check]");
    expect(badge).toBeInTheDocument();
    expect(badge).not.toHaveClass("absolute");
    expect(badge?.parentElement).toHaveTextContent("오프숄더");
  });

  it("keeps a disabled choice unavailable to pointer activation", () => {
    const onClick = vi.fn();
    render(
      <OptionTile
        label="선택 불가"
        selected={false}
        disabled
        onClick={onClick}
      />,
    );

    const choice = screen.getByRole("button", { name: /선택 불가/ });
    fireEvent.click(choice);
    expect(choice).toBeDisabled();
    expect(choice).toHaveAttribute("aria-pressed", "false");
    expect(onClick).not.toHaveBeenCalled();
  });

  it("keeps the complete choice actionable after its artwork returns 404", () => {
    const onClick = vi.fn();
    render(
      <OptionTile
        label="오프숄더"
        description="어깨를 살짝 드러내고 소매가 팔 윗부분을 감싸요."
        aliases={["오프 숄더"]}
        selected={false}
        onClick={onClick}
        icon={<OptionArtwork category="top" id="offShoulder" />}
      />,
    );

    const choice = screen.getByRole("button", { name: /오프숄더/ });
    const image = choice.querySelector("img");
    if (!image) throw new Error("expected option image");
    fireEvent.error(image);
    fireEvent.click(choice);

    expect(choice).toHaveTextContent("오프숄더");
    expect(choice).toHaveTextContent(
      "어깨를 살짝 드러내고 소매가 팔 윗부분을 감싸요.",
    );
    expect(choice).toHaveTextContent("오프 숄더");
    expect(choice).not.toBeDisabled();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
