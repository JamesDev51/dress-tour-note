import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, it, vi } from "vitest";
import { ImportPage } from "./ImportPage";

const { inspectPortablePdf, importPortablePreview } = vi.hoisted(() => ({
  inspectPortablePdf: vi.fn(),
  importPortablePreview: vi.fn(),
}));
vi.mock("../../lib/pdf/importPdf", () => ({
  inspectPortablePdf,
  importPortablePreview,
}));

it("keeps the selected file locked during inspection so preview and file cannot diverge", async () => {
  let reject!: (error: Error) => void;
  inspectPortablePdf.mockImplementation(
    () =>
      new Promise((_, fail) => {
        reject = fail;
      }),
  );
  const { container } = render(
    <MemoryRouter>
      <ImportPage />
    </MemoryRouter>,
  );
  const input = container.querySelector('input[type="file"]')!;
  fireEvent.change(input, {
    target: {
      files: [new File(["pdf"], "backup.pdf", { type: "application/pdf" })],
    },
  });
  await waitFor(() => expect(inspectPortablePdf).toHaveBeenCalledOnce());
  expect(input).toBeDisabled();
  await act(async () => reject(new Error("검증하지 못했어요.")));
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "검증하지 못했어요.",
  );
  expect(input).toBeEnabled();
});

it.each(["copy", "overwrite"] as const)(
  "labels the final import action accurately for %s",
  async (strategy) => {
    const preview = {
      payload: {
        tour: { title: "저장한 투어" },
        exportedAt: "2026-10-31T00:00:00Z",
      },
      hasConflict: true,
      faceIncluded: false,
      shopCount: 1,
      dressCount: 2,
      favoriteCount: 0,
    };
    inspectPortablePdf.mockResolvedValue(preview);
    importPortablePreview.mockClear().mockResolvedValue("tour");
    const { container } = render(
      <MemoryRouter>
        <ImportPage />
      </MemoryRouter>,
    );
    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: {
        files: [new File(["pdf"], "backup.pdf", { type: "application/pdf" })],
      },
    });
    await screen.findByRole("button", { name: "새 투어로 추가" });
    if (strategy === "overwrite") {
      fireEvent.click(
        screen.getByRole("radio", { name: "기존 투어 덮어쓰기" }),
      );
      expect(
        screen.getByText(/이 투어의 현재 기록을 PDF에 담긴 기록으로 바꿔요/),
      ).toBeInTheDocument();
    }
    fireEvent.click(
      screen.getByRole("button", {
        name: strategy === "copy" ? "새 투어로 추가" : "기존 투어 덮어쓰기",
      }),
    );
    await waitFor(() =>
      expect(importPortablePreview).toHaveBeenCalledWith(preview, strategy),
    );
  },
);
