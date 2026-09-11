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
