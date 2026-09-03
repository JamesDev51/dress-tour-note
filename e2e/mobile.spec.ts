import { expect, test, type Page } from "@playwright/test";

const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8Dwn4GBgYGJAQoAHQkCAWJ6+ygAAAAASUVORK5CYII=",
  "base64",
);

const optionAssetPaths = [
  ...[
    "strapless",
    "offShoulder",
    "strap",
    "halter",
    "shortSleeve",
    "longSleeve",
  ].map((id) => `/assets/options/top/${id}.webp`),
  ...["straight", "sweetheart", "v", "square", "scoop", "asymmetric"].map(
    (id) => `/assets/options/neckline/${id}.webp`,
  ),
  ...["aLine", "ballGown", "mermaid", "empire"].map(
    (id) => `/assets/options/silhouette/${id}.webp`,
  ),
  ...[
    "mikadoSatin",
    "lace",
    "organzaChiffon",
    "subtleBeaded",
    "ornateBeaded",
    "floral3D",
  ].map((id) => `/assets/options/fabric/${id}.webp`),
  ...["pureWhite", "ivory", "champagne"].map(
    (id) => `/assets/options/color/${id}.webp`,
  ),
];

const dressLayerAssetPaths = [
  "/assets/dress-structures/manifest.json",
  "/assets/dress-structures/strapless__sweetheart__mermaid.webp",
  "/assets/dress-structures/longSleeve__asymmetric__empire.webp",
  "/assets/dress-structures/unknown__unknown__unknown.webp",
  ...["straight", "sweetheart", "v", "square", "scoop", "asymmetric"].map(
    (id) => `/assets/dress-layers/bodice/${id}.webp`,
  ),
  ...["offShoulder", "strap", "halter", "shortSleeve", "longSleeve"].map(
    (id) => `/assets/dress-layers/top/${id}.webp`,
  ),
  ...["unknown", "aLine", "ballGown", "empire", "mermaid"].map(
    (id) => `/assets/dress-layers/skirt/${id}.webp`,
  ),
  ...["shadow", "highlight", "mermaid", "empire"].map(
    (id) => `/assets/dress-layers/volume/${id}.webp`,
  ),
];

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
  await expect(page.getByText(title, { exact: true })).toBeVisible({
    timeout: 60_000,
  });
}

async function capturePdf(page: Page) {
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await page.waitForFunction(() => Boolean(window.__dressNoteDownloadBlob));
  const dataUrl = await page.evaluate(async () => {
    const blob = window.__dressNoteDownloadBlob;
    if (!blob) return null;
    return new Promise<string | null>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () =>
        resolve(typeof reader.result === "string" ? reader.result : null);
      reader.onerror = () => reject(reader.error ?? new Error("PDF 읽기 실패"));
      reader.readAsDataURL(blob);
    });
  });
  if (!dataUrl) throw new Error("PDF 다운로드 Blob이 없어요.");
  await page.evaluate(() => {
    window.__dressNoteDownloadBlob = undefined;
  });
  return Buffer.from(dataUrl.slice(dataUrl.indexOf(",") + 1), "base64");
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const originalCreateObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (object) => {
      if (object instanceof Blob && object.type === "application/pdf")
        window.__dressNoteDownloadBlob = object;
      return originalCreateObjectURL(object);
    };
  });
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
  const pdfBytes = await capturePdf(page);
  await page.goto("/");
  await page.getByRole("link", { name: /PDF.*가져오기/ }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "gudress-copy.pdf",
    mimeType: "application/pdf",
    buffer: pdfBytes,
  });
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
  await expect(
    page.locator(
      '.dress-preview image[data-layer="raster-mannequin"], .dress-preview image[data-layer="face"]',
    ),
  ).toHaveCount(2);
  await expect(
    page.locator('.dress-preview image[data-layer="face"]'),
  ).toHaveAttribute("href", /^data:image\/webp;base64,/);
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
  const pdfBytes = await capturePdf(page);
  await page.goto("/");
  await page.getByRole("link", { name: /PDF.*가져오기/ }).click();
  await page.locator('input[type="file"]').setInputFiles({
    name: "gudress-view-only.pdf",
    mimeType: "application/pdf",
    buffer: pdfBytes,
  });
  await expect(page.getByRole("alert")).toContainText(
    "복원 가능한 드레스노트 PDF가 아니에요.",
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

test("app shell, individual artwork, and service worker load without external requests", async ({
  page,
}, testInfo) => {
  const external: string[] = [];
  const appOrigin = new URL(
    testInfo.project.use.baseURL ?? "http://127.0.0.1:4173",
  ).origin;
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (
      (url.protocol === "http:" || url.protocol === "https:") &&
      url.origin !== appOrigin
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
  const assets = await Promise.all(
    [...optionAssetPaths, ...dressLayerAssetPaths].map(async (path) => {
      const response = await page.request.get(path);
      return {
        path,
        ok: response.ok(),
        contentType: response.headers()["content-type"],
        bytes: (await response.body()).byteLength,
      };
    }),
  );
  expect(
    assets.every(
      (asset) => asset.ok && asset.contentType?.includes("image/webp"),
    ),
  ).toBe(true);
  await page.context().setOffline(true);
  const offlineAssets = await page.evaluate(
    async (paths) => {
      const responses = await Promise.all(paths.map((path) => fetch(path)));
      return responses.map((response) => response.ok);
    },
    [...optionAssetPaths, ...dressLayerAssetPaths],
  );
  await page.context().setOffline(false);
  expect(offlineAssets.every(Boolean)).toBe(true);
  expect(external).toEqual([]);
});
