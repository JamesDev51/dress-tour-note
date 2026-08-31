import { expect, test, type Page } from "@playwright/test";

const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8Dwn4GBgYGJAQoAHQkCAWJ6+ygAAAAASUVORK5CYII=",
  "base64",
);

async function createTour(
  page: Page,
  {
    twoDresses = false,
    face = false,
  }: { twoDresses?: boolean; face?: boolean } = {},
) {
  await page.goto("/");
  await page.getByRole("link", { name: /새 투어 시작/ }).click();
  await page.getByPlaceholder("예: 히똥").fill("E2E 신부");
  await page
    .getByPlaceholder("비워두면 자동으로 만들어요")
    .fill("E2E 드레스투어");
  await page.getByRole("button", { name: "투어 만들기", exact: true }).click();
  await expect(page).toHaveURL(/\/tour\/[^/]+$/);
  const tourId = page.url().match(/\/tour\/([^/?#]+)/)![1];
  await page.getByRole("button", { name: /샵 추가/ }).click();
  await page.getByPlaceholder("드레스샵 이름").fill("E2E 브라이덜");
  await page.getByRole("button", { name: "추가하기", exact: true }).click();
  await page
    .getByRole("button", { name: "E2E 브라이덜 열기", exact: true })
    .click();
  await page.getByRole("button", { name: "드레스 추가", exact: true }).click();
  await page.getByRole("button", { name: /오프숄더/ }).click();
  await page.getByRole("button", { name: /하트형/ }).click();
  await page.getByRole("button", { name: /A라인/ }).click();
  await page.getByRole("button", { name: /레이스/ }).click();
  await page.getByRole("button", { name: /아이보리/ }).click();
  await page.getByRole("button", { name: /보통 길이/ }).click();
  await page
    .getByRole("button", { name: "더 자세히 기록", exact: true })
    .click();
  await page.getByRole("button", { name: /등 중앙 버튼/ }).click();
  await page
    .getByPlaceholder(/허리가 제일 얇아/)
    .fill("E2E 메모: 허리 라인이 가장 좋았음");
  await page.getByLabel("후보").click();
  if (face) {
    await page
      .locator('input[type="file"][accept*="image/heic"]')
      .setInputFiles({
        name: "face.png",
        mimeType: "image/png",
        buffer: tinyPng,
      });
    await expect(page.getByRole("status")).toContainText(
      "얼굴 사진을 저장했어요.",
    );
  }
  await page.waitForTimeout(650);
  if (twoDresses) {
    await page
      .getByRole("button", { name: "다음 드레스 추가", exact: true })
      .click();
    await page.getByRole("button", { name: /끈 없음/ }).click();
    await page.getByRole("button", { name: /일자형/ }).click();
    await page.getByRole("button", { name: /무릎부터 크게 퍼짐/ }).click();
    await page.getByRole("button", { name: /매끈한 실크/ }).click();
    await page.getByRole("button", { name: /새하얀 화이트/ }).click();
    await page.getByPlaceholder(/허리가 제일 얇아/).fill("E2E 두 번째 드레스");
    await page.waitForTimeout(650);
  }
  return tourId;
}

async function editorToReview(page: Page) {
  await page.getByLabel("뒤로").click();
  await page.getByLabel("투어로 돌아가기").click();
  await page.getByLabel("결과 보기").click();
  await expect(page.getByText("E2E 드레스투어", { exact: true })).toBeVisible();
}

async function reviewToExport(page: Page) {
  await page.getByRole("link", { name: "PDF 만들기", exact: true }).click();
  await expect(page.getByText("저장할 PDF를", { exact: false })).toBeVisible({
    timeout: 15_000,
  });
}

async function expectImportPreview(page: Page, title: string) {
  await expect
    .poll(
      async () => {
        if (await page.getByText(title, { exact: true }).count())
          return "preview";
        const alert = await page
          .getByRole("alert")
          .textContent()
          .catch(() => null);
        if (alert) return `alert: ${alert}`;
        const status = await page
          .getByRole("status")
          .textContent()
          .catch(() => null);
        if (status) return `status: ${status}`;
        if (
          await page
            .getByText("복원 데이터를 확인하는 중...", { exact: true })
            .count()
        )
          return "loading";
        return "waiting";
      },
      {
        timeout: 25_000,
        message:
          "PDF import should render a preview instead of hanging or surfacing an error",
      },
    )
    .toBe("preview");
}

test.beforeEach(async ({ page }) => {
  page.on("pageerror", (error) => console.log(`[pageerror] ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error")
      console.log(`[console.error] ${message.text()}`);
  });
});

test("mobile core flow autosaves, reloads and compares two dresses", async ({
  page,
}) => {
  await createTour(page, { twoDresses: true });
  await page.reload();
  await expect(page.getByPlaceholder(/허리가 제일 얇아/)).toHaveValue(
    "E2E 두 번째 드레스",
  );
  await editorToReview(page);
  await page.getByRole("button", { name: "2벌 비교", exact: true }).click();
  await page
    .getByRole("button", { name: /Dress 01/ })
    .first()
    .click();
  await page.getByRole("button", { name: /Dress 02/ }).click();
  await page.getByRole("button", { name: /선택한 2벌 비교하기/ }).click();
  await expect(page.getByText("두 벌을")).toBeVisible();
  await expect(page.getByText("오프숄더")).toBeVisible();
  await expect(page.getByText("끈 없음")).toBeVisible();
  await expect(page.getByText("등 중앙 버튼")).toBeVisible();
});

test("portable PDF downloads, imports as a copy, and restores face data", async ({
  page,
}) => {
  const tourId = await createTour(page, { face: true });
  await editorToReview(page);
  await reviewToExport(page);
  await page
    .getByRole("button", { name: "복원 가능한 PDF 만들기", exact: true })
    .click();
  await expect(page.getByText("PDF가 준비됐어요.")).toBeVisible({
    timeout: 40_000,
  });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();
  await page.goto("/");
  await page.getByRole("link", { name: "PDF 불러오기", exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles(path!);
  await expectImportPreview(page, "E2E 드레스투어");
  await expect(page.getByText("이 기기에 같은 투어가 있어요")).toBeVisible();
  await page
    .getByRole("button", { name: "이 기록 불러오기", exact: true })
    .click();
  await expect(page).toHaveURL(/\/tour\/[^/]+$/);
  expect(page.url()).not.toContain(tourId);
  await page
    .getByRole("button", { name: "E2E 브라이덜 열기", exact: true })
    .click();
  await page
    .getByRole("button", { name: /Dress 01/ })
    .first()
    .click();
  await expect(page.locator(".dress-preview image")).toHaveCount(1);
  await expect(page.getByPlaceholder(/허리가 제일 얇아/)).toHaveValue(
    "E2E 메모: 허리 라인이 가장 좋았음",
  );
});

test("view-only PDF cannot be restored", async ({ page }) => {
  await createTour(page);
  await editorToReview(page);
  await reviewToExport(page);
  await page
    .getByRole("button", { name: /보기 전용 PDF/ })
    .first()
    .click();
  await page
    .getByRole("button", { name: "보기 전용 PDF 만들기", exact: true })
    .click();
  await expect(page.getByText("PDF가 준비됐어요.")).toBeVisible({
    timeout: 40_000,
  });
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path();
  await page.goto("/");
  await page.getByRole("link", { name: "PDF 불러오기", exact: true }).click();
  await page.locator('input[type="file"]').setInputFiles(path!);
  await expect(page.getByRole("alert")).toContainText(
    "복원 가능한 그드레스 PDF가 아니에요.",
  );
});

test("direct editor URL survives a full reload", async ({ page }) => {
  await createTour(page);
  const url = page.url();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await expect(page.getByPlaceholder(/허리가 제일 얇아/)).toHaveValue(
    "E2E 메모: 허리 라인이 가장 좋았음",
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.getByRole("button", { name: /오프숄더/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("first loaded app works offline and makes no external network requests", async ({
  page,
  context,
}) => {
  const external: string[] = [];
  page.on("request", (request) => {
    const u = new URL(request.url());
    if (
      (u.protocol === "http:" || u.protocol === "https:") &&
      u.origin !== "http://127.0.0.1:4173"
    )
      external.push(request.url());
  });
  await page.goto("/");
  await expect(page.getByText("그림 대신")).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))))
    await page.reload();
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  await page.evaluate(async () => {
    await Promise.all([fetch("/"), fetch("/assets/options.svg")]);
  });
  await context.setOffline(true);
  await page.goto("/?offline-test=1", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("그림 대신")).toBeVisible();
  expect(external).toEqual([]);
});
