import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes, useParams } from "react-router-dom";
import { db } from "../../db/database";
import { createTour } from "../../db/repositories";
import { TourDashboardPage } from "./TourDashboardPage";

afterEach(async () => {
  cleanup();
  await db.delete();
  await db.open();
});

function ShopDestination() {
  const { shopId } = useParams();
  return <output data-testid="new-shop">{shopId}</output>;
}

function openTour(tourId: string) {
  render(
    <MemoryRouter initialEntries={[`/tour/${tourId}`]}>
      <Routes>
        <Route path="/tour/:tourId" element={<TourDashboardPage />} />
        <Route
          path="/tour/:tourId/shop/:shopId"
          element={<ShopDestination />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("tour title safety", () => {
  it("opens the newly created shop and prevents duplicate submissions", async () => {
    const tourId = await createTour();
    openTour(tourId);
    fireEvent.click(await screen.findByRole("button", { name: "샵 추가" }));
    fireEvent.change(
      screen.getByRole("textbox", { name: "추가할 드레스샵 이름" }),
      { target: { value: "첫 피팅샵" } },
    );
    const add = screen.getByRole("button", { name: "추가하기" });
    fireEvent.click(add);
    fireEvent.click(add);
    const destination = await screen.findByTestId("new-shop");
    const shops = await db.shops.where("tourId").equals(tourId).toArray();
    expect(shops).toHaveLength(1);
    expect(destination).toHaveTextContent(shops[0].id);
    expect(shops[0].name).toBe("첫 피팅샵");
    expect(await db.dresses.count()).toBe(0);
  });

  it("allows an empty editing draft but restores the saved title on blur", async () => {
    const tourId = await createTour({ title: "안전한 투어" });
    openTour(tourId);
    const title = await screen.findByRole("textbox", { name: "투어 제목" });

    fireEvent.change(title, { target: { value: "" } });
    expect(title).toHaveValue("");
    expect((await db.tours.get(tourId))?.title).toBe("안전한 투어");
    fireEvent.blur(title);

    expect(await screen.findByRole("alert")).toHaveTextContent("이전 제목");
    expect(title).toHaveValue("안전한 투어");
  });

  it("commits the replacement title after finishing an edit", async () => {
    const tourId = await createTour({ title: "안전한 투어" });
    openTour(tourId);
    const title = await screen.findByRole("textbox", { name: "투어 제목" });

    fireEvent.change(title, { target: { value: "  새로운 투어  " } });
    fireEvent.blur(title);

    await waitFor(async () => {
      expect((await db.tours.get(tourId))?.title).toBe("새로운 투어");
    });
    await waitFor(() => expect(title).toHaveValue("새로운 투어"));
  });

  it("autosaves a valid name without blur while preserving spaces in the editing draft", async () => {
    const tourId = await createTour({ title: "안전한 투어" });
    openTour(tourId);
    const title = await screen.findByRole("textbox", { name: "투어 제목" });

    fireEvent.change(title, { target: { value: "새로운 이름 " } });

    await waitFor(async () => {
      expect((await db.tours.get(tourId))?.title).toBe("새로운 이름");
    });
    expect(title).toHaveValue("새로운 이름 ");
    fireEvent.blur(title);
    await waitFor(() => expect(title).toHaveValue("새로운 이름"));
  });

  it("keeps the latest title when an edit is immediately changed back", async () => {
    const tourId = await createTour({ title: "원래 제목" });
    openTour(tourId);
    const title = await screen.findByRole("textbox", { name: "투어 제목" });

    fireEvent.change(title, { target: { value: "잠깐 바꾼 제목" } });
    fireEvent.change(title, { target: { value: "원래 제목" } });

    await waitFor(() =>
      expect(screen.getByText("자동 저장됨")).toBeInTheDocument(),
    );
    expect((await db.tours.get(tourId))?.title).toBe("원래 제목");
  });

  it("offers home recovery after a missing tour finishes loading", async () => {
    openTour("missing-tour");
    expect(
      await screen.findByRole("heading", {
        name: "투어 기록을 찾을 수 없어요.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "홈에서 기록 찾기" }),
    ).toHaveAttribute("href", "/");
    expect(screen.queryByText("기록을 불러오는 중...")).not.toBeInTheDocument();
  });
});
