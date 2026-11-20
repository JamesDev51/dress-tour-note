import { expect, it } from "vitest";
import type { Dress } from "../../types/domain";
import {
  dressTermBlocks,
  exceptionBlocks,
  recallBlocks,
} from "./dressTextBlocks";

const baseDress: Dress = {
  id: "dress-left",
  tourId: "tour",
  shopId: "shop",
  order: 0,
  label: "Dress 01",
  topStyle: "strapless",
  neckline: "unknown",
  silhouette: "aLine",
  waistline: "natural",
  fabric: "lace",
  color: "ivory",
  train: "chapel",
  details: ["pearl"],
  quickTags: ["신부 픽", "편함"],
  rating: 4,
  memo: "허리가 편하고 움직이기 좋았어요.",
  isFavorite: true,
  customOptions: { neckline: "꽃잎 모양 가장자리" },
  createdAt: "2026-09-04T00:00:00.000Z",
  updatedAt: "2026-09-04T00:00:00.000Z",
};

it("prints current categories and active exceptions while preserving recall text and legacy values", () => {
  const dress: Dress = {
    ...baseDress,
    memoryCue: "긴 트레인이 기억나요",
    customOptions: {
      waistline: "곡선 절개",
      train: "조금 더 길어요",
      backStyle: "작은 단추",
      details: "큰 진주",
    },
  };
  const before = structuredClone(dress);

  const terms = dressTermBlocks(dress);
  const exceptions = exceptionBlocks(dress);
  const recall = recallBlocks(dress);

  expect(terms.map(({ label }) => label)).toEqual([
    "상의 디자인",
    "네크라인",
    "실루엣",
    "소재",
    "색상",
    "등 디자인",
    "디테일",
  ]);
  expect(exceptions.map(({ text }) => text)).toEqual(["작은 단추", "큰 진주"]);
  expect(recall[0]?.text).toBe(dress.memoryCue);
  expect(dress).toEqual(before);
});
