import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { useUIStore } from "../stores/uiStore";
import { MobileShell } from "./MobileShell";

const { flushBeforeAppUpdate } = vi.hoisted(() => ({
  flushBeforeAppUpdate: vi.fn(),
}));
vi.mock("../lib/storage/beforeAppUpdate", () => ({ flushBeforeAppUpdate }));

beforeEach(() => {
  flushBeforeAppUpdate.mockReset();
  useUIStore.setState({ pwaUpdateAvailable: true, toast: undefined });
});

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((accept) => {
    resolve = accept;
  });
  return { promise, resolve };
}
function renderShell() {
  return render(
    <MemoryRouter>
      <Routes>
        <Route element={<MobileShell />}>
          <Route path="/" element={<input aria-label="기억할 특징" />} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

it("locks editing until reload, including the gap after the worker update request resolves", async () => {
  const saving = deferred();
  const activating = deferred();
  flushBeforeAppUpdate.mockReturnValue(saving.promise);
  const updateSW = vi.fn(() => activating.promise);
  useUIStore.setState({ updateSW });
  const { container } = renderShell();
  const editor = container.querySelector(".app-shell")!;
  fireEvent.click(screen.getByRole("button", { name: "업데이트" }));
  expect(editor).toHaveAttribute("inert");
  expect(updateSW).not.toHaveBeenCalled();
  await act(async () => saving.resolve());
  expect(updateSW).toHaveBeenCalledOnce();
  expect(editor).toHaveAttribute("inert");
  // vite-plugin-pwa resolves the update request before the controlling event reloads.
  await act(async () => activating.resolve());
  expect(editor).toHaveAttribute("inert");
});

it("keeps the current page editable and skips the worker update when saving fails", async () => {
  flushBeforeAppUpdate.mockRejectedValue(new Error("저장 실패"));
  const updateSW = vi.fn();
  useUIStore.setState({ updateSW });
  const { container } = renderShell();
  fireEvent.click(screen.getByRole("button", { name: "업데이트" }));
  await waitFor(() =>
    expect(container.querySelector(".app-shell")).not.toHaveAttribute("inert"),
  );
  expect(updateSW).not.toHaveBeenCalled();
  expect(
    screen.getByText("기록을 저장한 뒤 다시 시도해 주세요."),
  ).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "업데이트" })).toBeEnabled();
});
