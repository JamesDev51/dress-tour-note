import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { MemoryRouter, Route, Routes, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ExportOptions } from "../../types/portable";
import { ExportPage } from "./ExportPage";

const { exportPortablePdf, downloadBlob, getTour } = vi.hoisted(() => ({
  exportPortablePdf: vi.fn(),
  downloadBlob: vi.fn(),
  getTour: vi.fn(),
}));

vi.mock("../../db/database", () => ({
  db: {
    tours: { get: getTour },
    shops: { where: () => ({ equals: () => ({ count: async () => 1 }) }) },
    dresses: {
      where: () => ({
        equals: () => ({ toArray: async () => [{ isFavorite: true }] }),
      }),
    },
  },
}));
vi.mock("../../lib/pdf/exportPdf", () => ({
  exportPortablePdf,
  downloadBlob,
  shareBlob: vi.fn().mockResolvedValue(false),
}));

function ChangeTour() {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate("/tour/tour-2/export")}>다른 투어</button>
  );
}

function renderExport() {
  return render(
    <MemoryRouter initialEntries={["/tour/tour-1/export"]}>
      <ChangeTour />
      <Routes>
        <Route path="/tour/:tourId/export" element={<ExportPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("ExportPage generation settings", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getTour.mockImplementation(async (id: string) => ({
      id,
      title: id === "tour-1" ? "첫 투어" : "다른 투어 기록",
      faceAssetId: "face",
    }));
  });

  it("locks privacy settings until the PDF made with those settings is ready", async () => {
    let finish!: (blob: Blob) => void;
    const pdf = new Blob(["portable-face-pdf"]);
    exportPortablePdf.mockImplementation(
      () =>
        new Promise<Blob>((resolve) => {
          finish = resolve;
        }),
    );
    renderExport();
    const generate = await screen.findByRole("button", {
      name: "백업용 PDF 만들기",
    });
    fireEvent.click(generate);
    await waitFor(() => expect(exportPortablePdf).toHaveBeenCalledOnce());
    const viewOnly = screen.getByRole("button", {
      name: /보기 전용 PDF 보여주기/,
    });
    expect(
      screen.queryByRole("checkbox", { name: /얼굴/ }),
    ).not.toBeInTheDocument();
    expect(viewOnly).toBeDisabled();
    fireEvent.click(viewOnly);
    await act(async () => finish(pdf));
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(downloadBlob).toHaveBeenCalledWith(pdf, "첫 투어.pdf"),
    );
    expect(exportPortablePdf.mock.calls[0]?.[1]).toEqual({
      mode: "portable",
    });
  });

  it("invalidates a completed file when settings change and creates view-only without a face", async () => {
    const pdf = new Blob(["view-only"]);
    exportPortablePdf.mockResolvedValue(pdf);
    renderExport();
    fireEvent.click(
      await screen.findByRole("button", { name: "백업용 PDF 만들기" }),
    );
    await screen.findByRole("button", { name: "저장" });
    fireEvent.click(
      screen.getByRole("button", { name: /보기 전용 PDF 보여주기/ }),
    );
    expect(
      screen.queryByRole("button", { name: "저장" }),
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", { name: "보기 전용 PDF 만들기" }),
    );
    await screen.findByRole("button", { name: "저장" });
    expect(exportPortablePdf.mock.calls[1]?.[1]).toEqual<ExportOptions>({
      mode: "viewOnly",
    });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));
    await waitFor(() =>
      expect(downloadBlob).toHaveBeenCalledWith(pdf, "첫 투어_보기용.pdf"),
    );
  });

  it("does not publish a stale PDF after navigation to another tour", async () => {
    let finish!: (blob: Blob) => void;
    exportPortablePdf.mockImplementation(
      () =>
        new Promise<Blob>((resolve) => {
          finish = resolve;
        }),
    );
    renderExport();
    fireEvent.click(
      await screen.findByRole("button", { name: "백업용 PDF 만들기" }),
    );
    await waitFor(() => expect(exportPortablePdf).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole("button", { name: "다른 투어" }));
    await screen.findByText("다른 투어 기록");
    await act(async () => finish(new Blob(["old-tour"])));
    expect(
      screen.queryByRole("button", { name: "저장" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "백업용 PDF 만들기" }),
    ).toBeEnabled();
  });
});
