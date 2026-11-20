import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { db } from "../../db/database";
import { addDress, addShop, createTour } from "../../db/repositories";
import { ShopPage } from "./ShopPage";

afterEach(async () => {
  cleanup();
  await db.delete();
  await db.open();
});

function DressDestination() {
  const location = useLocation();
  return (
    <output data-testid="dress-destination">
      {location.pathname}
      {location.search}
    </output>
  );
}

function openShop(tourId: string, shopId: string) {
  render(
    <MemoryRouter initialEntries={[`/tour/${tourId}/shop/${shopId}`]}>
      <Routes>
        <Route path="/tour/:tourId/shop/:shopId" element={<ShopPage />} />
        <Route
          path="/tour/:tourId/dress/:dressId"
          element={<DressDestination />}
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("shop name safety", () => {
  it("opens each dress directly and keeps record actions without comparison", async () => {
    const tourId = await createTour();
    const shopId = await addShop(tourId, { name: "첫 샵" });
    const ids = [
      await addDress(shopId),
      await addDress(shopId),
      await addDress(shopId),
    ];
    openShop(tourId, shopId);
    const choices = await screen.findAllByRole("button", {
      name: /상세 편집$/,
    });
    expect(choices).toHaveLength(3);
    expect(
      screen.queryByRole("button", { name: /비교/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "드레스 추가" })).toBeEnabled();
    expect(
      screen.getByRole("button", { name: "다음 드레스 기록" }),
    ).toBeEnabled();
    expect(screen.getAllByRole("button", { name: /기록 보기$/ })).toHaveLength(
      3,
    );
    expect(screen.getAllByRole("button", { name: /기록 복사$/ })).toHaveLength(
      3,
    );
    fireEvent.click(choices[1]);
    expect(await screen.findByTestId("dress-destination")).toHaveTextContent(
      `/tour/${tourId}/dress/${ids[1]}`,
    );
    expect(await db.dresses.count()).toBe(3);
  });

  it("allows replacement typing without committing an empty shop name", async () => {
    const tourId = await createTour();
    const shopId = await addShop(tourId, { name: "첫 드레스샵" });
    openShop(tourId, shopId);
    const name = await screen.findByRole("textbox", { name: "드레스샵 이름" });

    fireEvent.change(name, { target: { value: "" } });
    expect(name).toHaveValue("");
    expect((await db.shops.get(shopId))?.name).toBe("첫 드레스샵");
    fireEvent.blur(name);
    expect(await screen.findByRole("alert")).toHaveTextContent("이전 이름");
    expect(name).toHaveValue("첫 드레스샵");

    fireEvent.change(name, { target: { value: "다시 찾을 샵" } });
    fireEvent.blur(name);
    await waitFor(async () => {
      expect((await db.shops.get(shopId))?.name).toBe("다시 찾을 샵");
    });
    expect(
      screen.getByRole("textbox", { name: "샵 상담 메모" }),
    ).toBeInTheDocument();
  });

  it("recovers from a shop that does not belong to the tour in the URL", async () => {
    const tourId = await createTour();
    const otherTourId = await createTour();
    const shopId = await addShop(otherTourId, { name: "다른 투어의 샵" });
    openShop(tourId, shopId);

    expect(
      await screen.findByRole("heading", {
        name: "드레스샵 기록을 찾을 수 없어요.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "드레스샵 이름" }),
    ).not.toBeInTheDocument();
  });

  it("autosaves the shop name before blur without trimming its editing draft", async () => {
    const tourId = await createTour();
    const shopId = await addShop(tourId, { name: "첫 샵" });
    openShop(tourId, shopId);
    const name = await screen.findByRole("textbox", { name: "드레스샵 이름" });

    fireEvent.change(name, { target: { value: "다시 찾을 샵 " } });

    await waitFor(async () => {
      expect((await db.shops.get(shopId))?.name).toBe("다시 찾을 샵");
    });
    expect(name).toHaveValue("다시 찾을 샵 ");
  });

  it("keeps the latest shop name when an edit is immediately changed back", async () => {
    const tourId = await createTour();
    const shopId = await addShop(tourId, { name: "원래 샵" });
    openShop(tourId, shopId);
    const name = await screen.findByRole("textbox", { name: "드레스샵 이름" });

    fireEvent.change(name, { target: { value: "잠깐 바꾼 샵" } });
    fireEvent.change(name, { target: { value: "원래 샵" } });

    await waitFor(() =>
      expect(screen.getByText("자동 저장됨")).toBeInTheDocument(),
    );
    expect((await db.shops.get(shopId))?.name).toBe("원래 샵");
  });
});
