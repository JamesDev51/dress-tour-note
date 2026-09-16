import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { useUIStore } from "../../stores/uiStore";
import { DressRecallNotes } from "./DressRecallNotes";

afterEach(() => useUIStore.setState({ saveStatus: "idle" }));

it("allows retrying a failed recall save while retaining the user's text", () => {
  useUIStore.setState({ saveStatus: "error" });
  render(
    <DressRecallNotes
      values={{ memoryCue: "리본", likedReason: "편함", concern: "무거움" }}
      onChange={() => undefined}
      onBlur={() => useUIStore.setState({ saveStatus: "saved" })}
    />,
  );
  fireEvent.click(screen.getByRole("button", { name: "기억 메모 다시 저장" }));
  expect(useUIStore.getState().saveStatus).toBe("saved");
  expect(screen.getByRole("textbox", { name: "아쉬운 점" })).toHaveValue(
    "무거움",
  );
  expect(
    screen.queryByRole("button", { name: "기억 메모 다시 저장" }),
  ).not.toBeInTheDocument();
});
