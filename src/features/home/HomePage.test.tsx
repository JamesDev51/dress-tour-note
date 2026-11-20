import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { db } from "../../db/database";
import { createTour } from "../../db/repositories";
import { useUIStore } from "../../stores/uiStore";
import { HomePage } from "./HomePage";

afterEach(async () => {
  cleanup();
  vi.restoreAllMocks();
  useUIStore.getState().clearToast();
  await db.delete();
  await db.open();
});

function TourDestination() {
  const { tourId } = useParams();
  return <output data-testid="opened-tour">{tourId}</output>;
}

function openHome() {
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/tour/:tourId" element={<TourDestination />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("home tour actions", () => {
  it("offers tour creation and PDF import before any record exists", async () => {
    openHome();

    expect(
      await screen.findByRole("link", { name: /새 투어 시작/ }),
    ).toHaveAttribute("href", "/tour/new");
    expect(screen.getByRole("link", { name: /PDF.*가져오기/ })).toHaveAttribute(
      "href",
      "/import",
    );
    expect(
      screen.queryByRole("button", { name: /이전 기록 더 보기/ }),
    ).not.toBeInTheDocument();
  });

  it("opens the selected saved tour and keeps PDF import available", async () => {
    const tourId = await createTour({ title: "나의 첫 피팅" });
    openHome();

    const title = await screen.findByText("나의 첫 피팅");
    expect(screen.getByRole("link", { name: /PDF.*가져오기/ })).toHaveAttribute(
      "href",
      "/import",
    );
    const openAction = title.closest("a, button");
    expect(openAction).not.toBeNull();
    fireEvent.click(openAction!);

    expect(await screen.findByTestId("opened-tour")).toHaveTextContent(tourId);
  });

  it("keeps the start and import actions available when the dress example fails", async () => {
    openHome();
    fireEvent.error(
      await screen.findByRole("img", { name: /치맛자락을 펼쳐 보는 신부/ }),
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /새 투어 시작/ })).toHaveAttribute(
      "href",
      "/tour/new",
    );
    expect(screen.getByRole("link", { name: /PDF.*가져오기/ })).toHaveAttribute(
      "href",
      "/import",
    );
  });

  it("waits for stored records before choosing the first-use or returning home", async () => {
    await createTour({ title: "다시 볼 피팅 기록" });
    let resolveCount!: (total: number) => void;
    const pendingCount = new Promise<number>((resolve) => {
      resolveCount = resolve;
    });
    vi.spyOn(db.tours, "count").mockReturnValueOnce(
      pendingCount as ReturnType<typeof db.tours.count>,
    );
    openHome();

    expect(screen.getByRole("status")).toHaveTextContent("기록을 불러오는 중");
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(
      screen.queryByText("아직 저장된 드레스투어가 없어요."),
    ).not.toBeInTheDocument();

    await act(async () => {
      resolveCount(1);
    });
    expect(await screen.findByText("다시 볼 피팅 기록")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "나의 드레스투어" }),
    ).toBeInTheDocument();
    const photo = screen.getByRole("img", {
      name: /치맛자락을 펼쳐 보는 신부/,
    });
    const recent = screen.getByRole("heading", { name: "최근 기록" });
    expect(
      photo.compareDocumentPosition(recent) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("shows the five newest tours first and reveals older records on request", async () => {
    for (let index = 1; index <= 7; index++) {
      const tourId = await createTour({ title: `피팅 기록 ${index}` });
      await db.tours.update(tourId, {
        updatedAt: `2026-10-${String(index).padStart(2, "0")}T09:00:00.000Z`,
      });
    }
    openHome();

    await screen.findByText("피팅 기록 7");
    expect(
      screen
        .getAllByText(/^피팅 기록 \d$/)
        .map((element) => element.textContent),
    ).toEqual([
      "피팅 기록 7",
      "피팅 기록 6",
      "피팅 기록 5",
      "피팅 기록 4",
      "피팅 기록 3",
    ]);
    expect(screen.queryByText("피팅 기록 2")).not.toBeInTheDocument();

    fireEvent.click(
      await screen.findByRole("button", { name: /이전 기록 더 보기/ }),
    );

    await screen.findByText("피팅 기록 1");
    expect(
      screen
        .getAllByText(/^피팅 기록 \d$/)
        .map((element) => element.textContent),
    ).toEqual([
      "피팅 기록 7",
      "피팅 기록 6",
      "피팅 기록 5",
      "피팅 기록 4",
      "피팅 기록 3",
      "피팅 기록 2",
      "피팅 기록 1",
    ]);
    expect(
      screen.queryByRole("button", { name: /이전 기록 더 보기/ }),
    ).not.toBeInTheDocument();
  });

  it("keeps both records when tour deletion is cancelled", async () => {
    const selectedId = await createTour({ title: "취소할 기록" });
    const otherId = await createTour({ title: "남길 기록" });
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    openHome();

    fireEvent.click(
      await screen.findByRole("button", { name: "취소할 기록 삭제" }),
    );

    expect(confirm).toHaveBeenCalledOnce();
    expect(await db.tours.get(selectedId)).toBeDefined();
    expect(await db.tours.get(otherId)).toBeDefined();
    expect(screen.getByText("취소할 기록")).toBeInTheDocument();
    expect(screen.getByText("남길 기록")).toBeInTheDocument();
  });

  it("deletes only the confirmed tour and updates the visible records", async () => {
    const selectedId = await createTour({ title: "삭제할 기록" });
    const otherId = await createTour({ title: "보존할 기록" });
    vi.spyOn(window, "confirm").mockReturnValue(true);
    openHome();

    fireEvent.click(
      await screen.findByRole("button", { name: "삭제할 기록 삭제" }),
    );

    await waitFor(() => {
      expect(screen.queryByText("삭제할 기록")).not.toBeInTheDocument();
    });
    expect(await db.tours.get(selectedId)).toBeUndefined();
    expect(await db.tours.get(otherId)).toBeDefined();
    expect(screen.getByText("보존할 기록")).toBeInTheDocument();
  });
});
