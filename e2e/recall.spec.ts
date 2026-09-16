import { readFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";

async function recordCore(page: Page) {
  for (const name of [/스트랩리스/, /스트레이트 네크라인/, /^A라인/]) {
    await page.getByRole("button", { name }).click();
    await page.getByRole("button", { name: "다음", exact: true }).click();
  }
  await page
    .getByRole("button", { name: "후보로 남기기", exact: true })
    .click();
}

async function startRecord(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: /새 투어 시작/ }).click();
  await page.getByPlaceholder("예: 히똥").fill("기억 검증 신부");
  await page.getByRole("button", { name: "투어 만들기", exact: true }).click();
  await page.getByRole("button", { name: /샵 추가/ }).click();
  await page.getByPlaceholder("드레스샵 이름").fill("기억 검증 샵");
  await page.getByRole("button", { name: "추가하기", exact: true }).click();
  await page
    .getByRole("button", { name: "기억 검증 샵 열기", exact: true })
    .click();
  await page.getByRole("button", { name: "드레스 추가", exact: true }).click();
  await recordCore(page);
  return page.url();
}

for (const width of [320, 390]) {
  test(`recall survives immediate back and reopen at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    const url = await startRecord(page);
    await page
      .getByRole("textbox", { name: "기억할 특징", exact: true })
      .fill("등 뒤 큰 리본");
    await page
      .getByRole("textbox", { name: "좋았던 점", exact: true })
      .fill("허리가 편함");
    await page
      .getByRole("textbox", { name: "아쉬운 점", exact: true })
      .fill("팔 올리기 불편함");
    await page.getByRole("button", { name: "뒤로", exact: true }).click();
    await expect(page).toHaveURL(/\/shop\//);
    await page
      .getByRole("heading", { name: "등 뒤 큰 리본", exact: true })
      .click();
    await expect(page).toHaveURL(url);
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "등 뒤 큰 리본",
    );
    await expect(page.getByText("허리가 편함", { exact: true })).toBeVisible();
    await expect(
      page.getByText("팔 올리기 불편함", { exact: true }),
    ).toBeVisible();
    await expect(
      page.locator('svg[data-renderer="memory-sketch"][data-view="full"]'),
    ).toHaveCount(1);
    await expect(page.locator("[data-reference-gown]")).toHaveCount(0);
    await page.getByRole("button", { name: "뒤태", exact: true }).click();
    await expect(page.locator('svg[data-view="back"]')).toHaveCount(1);
    await expect(page.locator("svg text, svg image")).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBe(0);
  });
}

test("explicit completion shows the current dress without creating the next blank", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startRecord(page);
  await page
    .getByRole("textbox", { name: "기억할 특징", exact: true })
    .fill("등 뒤 큰 리본");
  await page
    .getByRole("textbox", { name: "좋았던 점", exact: true })
    .fill("허리가 편함");
  await page
    .getByRole("textbox", { name: "아쉬운 점", exact: true })
    .fill("팔 올리기 불편함");

  await page
    .getByRole("button", { name: "기록 완료하고 보기", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "등 뒤 큰 리본", exact: true }),
  ).toBeVisible();

  await page.getByRole("button", { name: "뒤로", exact: true }).click();
  await expect(page).toHaveURL(/\/shop\//);
  await expect(
    page.getByRole("button", { name: /Dress 01 상세 편집/ }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: /Dress 02 상세 편집/ }),
  ).toHaveCount(0);
});

test("details returns to the current core step and stays discoverable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startRecord(page);

  const details = page.getByRole("button", {
    name: "상세 기록",
    exact: true,
  });
  await expect(details).toBeVisible();
  const detailsPosition = await details.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, viewport: innerHeight };
  });
  expect(detailsPosition.top).toBeGreaterThanOrEqual(0);
  expect(detailsPosition.bottom).toBeLessThanOrEqual(detailsPosition.viewport);
  const scrollBeforeDetails = await page.evaluate(() => window.scrollY);

  const detailsBox = await details.boundingBox();
  if (!detailsBox) throw new Error("상세 기록 버튼 위치를 찾지 못했어요.");
  await page.mouse.click(
    detailsBox.x + detailsBox.width / 2,
    detailsBox.y + detailsBox.height / 2,
  );
  const returnToCore = page
    .getByRole("button", { name: "핵심 기록으로 돌아가기", exact: true })
    .first();
  await expect(returnToCore).toBeVisible();
  await page
    .locator('[data-option-category="fabric"]')
    .getByRole("button", { name: /레이스/ })
    .click();
  await page
    .locator('[data-option-category="top"]')
    .getByRole("button", { name: /스트랩리스/ })
    .click();
  await returnToCore.click();

  await expect(page.getByText("4/4", { exact: true })).toBeVisible();
  const scrollAfterDetails = await page.evaluate(() => window.scrollY);
  expect(
    Math.abs(scrollAfterDetails - scrollBeforeDetails),
  ).toBeLessThanOrEqual(1);
  for (let step = 0; step < 3; step += 1) {
    await page.getByRole("button", { name: "이전", exact: true }).click();
  }
  await expect(
    page.getByRole("button", { name: /스트랩리스/ }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("record summary keeps its selected preview after details return", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startRecord(page);
  await page.getByRole("button", { name: "기록 완료하고 보기" }).click();
  await expect(page).toHaveURL(/view=record/);
  await page.getByRole("button", { name: "상체", exact: true }).click();
  await expect(page.locator('svg[data-view="upper"]')).toHaveCount(1);

  await page
    .getByRole("button", { name: "상세 기록", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "핵심 기록으로 돌아가기", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("button", { name: "상체", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('svg[data-view="upper"]')).toHaveCount(1);
});

test("a failed detail write keeps the panel open until the field is retried", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startRecord(page);
  await page.getByRole("button", { name: "상세 기록", exact: true }).click();
  await page.getByRole("heading", { name: "소재", exact: true }).waitFor();

  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      IDBObjectStore.prototype.put = original;
      throw new DOMException("QA injected rejection", "AbortError");
    };
  });
  await page
    .getByRole("button", { name: /아이보리/ })
    .first()
    .click();
  await expect(page.getByText("저장 실패", { exact: true })).toBeVisible();

  const returnToCore = page
    .locator(".core-details-nav")
    .getByRole("button", { name: "핵심 기록으로 돌아가기", exact: true });
  await returnToCore.click();
  await expect(
    page.getByRole("heading", { name: "소재", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /퓨어 화이트/ })
    .first()
    .click();
  await expect(page.getByText("자동 저장됨", { exact: true })).toBeVisible();
  await returnToCore.click();
  await expect(page.getByText("4/4", { exact: true })).toBeVisible();
});

test("review cards open the explicit record view", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startRecord(page);
  await page
    .getByRole("textbox", { name: "기억할 특징", exact: true })
    .fill("리뷰에서 다시 보는 드레스");
  await page.getByRole("button", { name: "뒤로", exact: true }).click();
  await page
    .getByRole("button", { name: "투어로 돌아가기", exact: true })
    .click();
  await page.getByRole("link", { name: "결과 보기", exact: true }).click();
  await page
    .getByRole("button")
    .filter({ hasText: "리뷰에서 다시 보는 드레스" })
    .click();

  await expect(page).toHaveURL(/view=record/);
  await expect(
    page.getByRole("heading", {
      name: "리뷰에서 다시 보는 드레스",
      exact: true,
    }),
  ).toBeVisible();
});

test("final recall input survives a direct reload without blur", async ({
  page,
}) => {
  await startRecord(page);
  await page
    .getByRole("textbox", { name: "아쉬운 점", exact: true })
    .fill("팔을 올리기 불편함");
  await page.reload();
  await expect(
    page.getByText("팔을 올리기 불편함", { exact: true }),
  ).toBeVisible();
});

test("comparison separates observed differences from missing evidence", async ({
  page,
}) => {
  const firstUrl = await startRecord(page);
  await page
    .getByRole("textbox", { name: "기억할 특징", exact: true })
    .fill("리본이 큰 드레스");
  await page
    .getByRole("textbox", { name: "좋았던 점", exact: true })
    .fill("허리가 편함");
  await page.getByRole("button", { name: "상세 기록", exact: true }).click();
  await page
    .locator('[data-option-category="fabric"]')
    .getByRole("button", { name: /레이스/ })
    .click();
  await expect(
    page
      .locator('[data-option-category="fabric"]')
      .getByRole("button", { name: /레이스/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .locator('[data-option-category="color"]')
    .getByRole("button", { name: /아이보리/ })
    .click();
  await page.getByRole("button", { name: "뒤로", exact: true }).click();
  await expect(page).toHaveURL(/\/shop\//);
  await page.getByRole("button", { name: "드레스 추가", exact: true }).click();
  await recordCore(page);
  const secondUrl = page.url();
  await page
    .getByRole("textbox", { name: "기억할 특징", exact: true })
    .fill("단추가 있던 드레스");
  await page
    .getByRole("textbox", { name: "아쉬운 점", exact: true })
    .fill("걷기 무거움");
  await page.getByRole("button", { name: "상세 기록", exact: true }).click();
  await page
    .locator('[data-option-category="color"]')
    .getByRole("button", { name: /샴페인/ })
    .click();
  await page.getByRole("button", { name: "뒤로", exact: true }).click();
  await expect(page).toHaveURL(/\/shop\//);
  const first = new URL(firstUrl).pathname.split("/");
  const second = new URL(secondUrl).pathname.split("/");
  await page.goto(`/tour/${first[2]}/compare?a=${first[4]}&b=${second[4]}`);
  const reasons = page.getByRole("region", { name: "선택할 때 중요했던 점" });
  await expect(reasons.getByText("허리가 편함", { exact: true })).toBeVisible();
  await expect(reasons.getByText("걷기 무거움", { exact: true })).toBeVisible();
  await expect(
    page
      .getByRole("region", { name: "기록된 차이" })
      .getByText("색상", { exact: true }),
  ).toBeVisible();
  const missing = page.getByRole("region", { name: "더 확인하면 좋은 부분" });
  await expect(missing.getByText("소재", { exact: true })).toBeVisible();
  await expect(missing.getByText("레이스", { exact: true })).toBeVisible();
  await expect(
    page.locator('svg[data-renderer="memory-sketch"][data-view="full"]'),
  ).toHaveCount(2);
  await page.getByRole("button", { name: "뒤태", exact: true }).click();
  await expect(page.locator('svg[data-view="back"]')).toHaveCount(2);
  await expect(page.locator("svg image")).toHaveCount(0);
});

test("delete all also removes interrupted recall drafts", async ({ page }) => {
  await page.goto("/privacy");
  await page.evaluate(() =>
    sessionStorage.setItem(
      "dress-note:recall-draft:orphan",
      JSON.stringify({
        revision: "pending",
        values: { memoryCue: "복구 대기", likedReason: "", concern: "" },
      }),
    ),
  );
  page.once("dialog", (dialog) => dialog.accept());
  await page
    .getByRole("button", { name: "전체 데이터 삭제", exact: true })
    .click();
  await expect(page).toHaveURL(/\/$/);
  expect(
    await page.evaluate(() =>
      sessionStorage.getItem("dress-note:recall-draft:orphan"),
    ),
  ).toBeNull();
});

test("recall reasons survive real PDF download and copy import", async ({
  page,
}, testInfo) => {
  const originalUrl = await startRecord(page);
  await page
    .getByRole("textbox", { name: "기억할 특징", exact: true })
    .fill("리본과 레이스가 있던 드레스");
  await page
    .getByRole("textbox", { name: "좋았던 점", exact: true })
    .fill("허리가 편하고 목선이 시원함");
  await page
    .getByRole("textbox", { name: "아쉬운 점", exact: true })
    .fill("팔을 올릴 때 불편함");
  await page.getByRole("button", { name: "뒤로", exact: true }).click();
  await expect(page).toHaveURL(/\/shop\//);
  const tourId = new URL(originalUrl).pathname.split("/")[2];
  await page.goto(`/tour/${tourId}/export`);
  await page
    .getByRole("button", { name: "복원 가능한 PDF 만들기", exact: true })
    .click();
  await expect(page.getByText("PDF가 준비됐어요.")).toBeVisible({
    timeout: 40000,
  });
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  const download = await downloading;
  const pdfPath = testInfo.outputPath("recall-roundtrip.pdf");
  await download.saveAs(pdfPath);
  await testInfo.attach("recall PDF", {
    path: pdfPath,
    contentType: "application/pdf",
  });
  await page.goto("/import");
  await page.locator('input[type="file"]').setInputFiles({
    name: "recall-roundtrip.pdf",
    mimeType: "application/pdf",
    buffer: await readFile(pdfPath),
  });
  await page
    .getByRole("button", { name: "이 기록 불러오기", exact: true })
    .click();
  await expect(page).toHaveURL(/\/tour\/[^/]+$/);
  expect(page.url()).not.toContain(tourId);
  await page
    .getByRole("button", { name: "기억 검증 샵 열기", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "리본과 레이스가 있던 드레스", exact: true })
    .click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "리본과 레이스가 있던 드레스",
  );
  await expect(
    page.getByText("허리가 편하고 목선이 시원함", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("팔을 올릴 때 불편함", { exact: true }),
  ).toBeVisible();
});
