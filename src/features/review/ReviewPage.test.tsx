import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { db } from "../../db/database";
import {
  addDress,
  addShop,
  createTour,
  patchDress,
} from "../../db/repositories";
import type { Dress } from "../../types/domain";
import { ReviewPage } from "./ReviewPage";

vi.mock("../../components/DressDecisionCard", () => ({
  DressDecisionCard: ({ dress }: { dress: Dress }) => (
    <span>{dress.label}</span>
  ),
}));

function Destination() {
  const location = useLocation();
  return (
    <output data-testid="destination">
      {location.pathname}
      {location.search}
    </output>
  );
}

afterEach(async () => {
  cleanup();
  await db.delete();
  await db.open();
});

async function seedReview() {
  const tourId = await createTour();
  const shopId = await addShop(tourId, { name: "첫 샵" });
  const ids: string[] = [];
  for (const label of ["첫 번째", "두 번째", "세 번째"]) {
    const id = await addDress(shopId);
    await patchDress(id, { label, isFavorite: label === "첫 번째" });
    ids.push(id);
  }
  render(
    <MemoryRouter initialEntries={[`/tour/${tourId}/review`]}>
      <Routes>
        <Route path="/tour/:tourId/review" element={<ReviewPage />} />
        <Route path="/tour/:tourId/dress/:dressId" element={<Destination />} />
      </Routes>
    </MemoryRouter>,
  );
  await screen.findByRole("button", { name: "첫 번째" });
  return { tourId, ids };
}

it("opens an individual saved record without a comparison mode", async () => {
  const { tourId, ids } = await seedReview();
  expect(
    screen.queryByRole("button", { name: /비교/ }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "PDF 만들기" })).toHaveAttribute(
    "href",
    `/tour/${tourId}/export`,
  );
  fireEvent.click(screen.getByRole("button", { name: "두 번째" }));
  expect(await screen.findByTestId("destination")).toHaveTextContent(
    `/tour/${tourId}/dress/${ids[1]}?view=record`,
  );
  expect(await db.dresses.count()).toBe(3);
});

it("keeps all and favorite filters available without comparison selection", async () => {
  await seedReview();
  fireEvent.click(screen.getByRole("button", { name: "후보 1" }));
  expect(screen.getByRole("button", { name: "첫 번째" })).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "두 번째" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "세 번째" }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("link", { name: "PDF 만들기" })).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /비교/ }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "전체 3" }));
  expect(screen.getByRole("button", { name: "두 번째" })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: "세 번째" })).toBeInTheDocument();
});
