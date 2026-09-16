import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { topStyleOptions } from "../../lib/dress/options";
import { DressOptionSection } from "./DressOptionSection";

describe("DressOptionSection", () => {
  it("renders known cards as image, Korean term, description, then common aliases", () => {
    const onCustomCommit = vi.fn();
    render(
      <DressOptionSection
        category="top"
        title="어깨/끈은 어떻게 생겼나요?"
        options={topStyleOptions}
        value="offShoulder"
        onPick={() => undefined}
        onCustomCommit={onCustomCommit}
      />,
    );

    const option = screen.getByRole("button", { name: /오프숄더/ });
    expect(option).toHaveAttribute("aria-pressed", "true");
    expect(option.querySelector("[data-option-art]")).toBeInTheDocument();
    expect(option).toHaveTextContent(
      "어깨를 살짝 드러내고 소매가 팔 윗부분을 감싸요.",
    );
    expect(option).toHaveTextContent("오프 숄더");
    expect(
      screen.getByRole("button", { name: /비슷하지만 달라요/ }),
    ).toBeVisible();
  });

  it("keeps 기억 안 남 as a text-only action outside the artwork grid", () => {
    render(
      <DressOptionSection
        category="top"
        title="선택"
        options={topStyleOptions}
        value="unknown"
        onPick={() => undefined}
        onCustomCommit={() => undefined}
      />,
    );
    const unknown = screen.getByRole("button", { name: /기억 안 남/ });
    expect(unknown).toHaveAttribute("aria-pressed", "true");
    expect(unknown).not.toContainElement(screen.getByTestId("option-grid"));
    expect(
      screen.queryByTestId("option-grid")?.querySelector("img"),
    ).not.toBeNull();
    expect(screen.queryByTestId("option-grid")?.textContent).not.toContain(
      "기억 안 남",
    );
  });

  it("opens a category-labelled 80-character closest-choice note after a known choice", () => {
    render(
      <DressOptionSection
        category="top"
        title="어깨/끈은 어떻게 생겼나요?"
        options={topStyleOptions}
        value="strapless"
        onPick={() => undefined}
        onCustomCommit={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /비슷하지만 달라요/ }));
    const note = screen.getByRole("textbox", {
      name: "상의 디자인에서 다른 점",
    });
    expect(note).toHaveAttribute("maxLength", "80");
  });

  it("clears the closest-choice note when 기억 안 남 is chosen", () => {
    const onPick = vi.fn();
    const onCustomCommit = vi.fn();
    const view = render(
      <DressOptionSection
        category="top"
        title="어깨/끈은 어떻게 생겼나요?"
        options={topStyleOptions}
        value="strapless"
        onPick={onPick}
        customValue="끈 위치만 달라요"
        onCustomCommit={onCustomCommit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /기억 안 남/ }));
    expect(onPick).not.toHaveBeenCalled();
    fireEvent.click(
      screen.getByRole("button", {
        name: "메모 지우고 기억 안 남 선택",
      }),
    );
    expect(onPick).toHaveBeenCalledWith("unknown");
    expect(onCustomCommit).toHaveBeenCalledWith("");
    view.rerender(
      <DressOptionSection
        category="top"
        title="어깨/끈은 어떻게 생겼나요?"
        options={topStyleOptions}
        value="unknown"
        onPick={onPick}
        onCustomCommit={onCustomCommit}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /비슷하지만 달라요/ }),
    ).toBeNull();
  });

  it("supports independent detail selections through its multi-select API", () => {
    const onToggle = vi.fn();
    render(
      <DressOptionSection
        category="details"
        title="디테일"
        options={[
          { id: "corset", label: "코르셋", description: "몸통 구조" },
          { id: "draping", label: "드레이핑", description: "천 주름" },
        ]}
        selectionMode="multiple"
        selectedValues={["corset"]}
        onToggle={onToggle}
        onCustomCommit={() => undefined}
      />,
    );

    const corset = screen.getByRole("button", { name: /코르셋/ });
    const draping = screen.getByRole("button", { name: /드레이핑/ });
    fireEvent.click(draping);

    expect(corset).toHaveAttribute("aria-pressed", "true");
    expect(draping).toHaveAttribute("aria-pressed", "false");
    expect(onToggle).toHaveBeenCalledWith("draping");
  });

  it("requires an explicit keep or clear choice before changing a noted known option", () => {
    const onPick = vi.fn();
    const onCustomCommit = vi.fn();
    render(
      <DressOptionSection
        category="top"
        title="상의"
        options={topStyleOptions}
        value="strapless"
        onPick={onPick}
        customValue="끈 위치만 달라요"
        onCustomCommit={onCustomCommit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /오프숄더/ }));
    expect(onPick).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: "메모 처리 선택" }),
    ).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "메모 지우고 변경" }));
    expect(onCustomCommit).toHaveBeenCalledWith("");
    expect(onPick).toHaveBeenCalledWith("offShoulder");
  });

  it("does not clear a noted choice for 기억 안 남 until confirmed", () => {
    const onPick = vi.fn();
    const onCustomCommit = vi.fn();
    render(
      <DressOptionSection
        category="top"
        title="상의"
        options={topStyleOptions}
        value="strapless"
        onPick={onPick}
        customValue="끈 위치만 달라요"
        onCustomCommit={onCustomCommit}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /기억 안 남/ }));
    expect(onPick).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onCustomCommit).not.toHaveBeenCalled();
    expect(onPick).not.toHaveBeenCalled();
  });
});
