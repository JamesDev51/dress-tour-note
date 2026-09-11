import { expect, test, type Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { LEGACY_PORTABLE_FILE_NAME } from "../src/lib/pdf/portable";

const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8Dwn4GBgYGJAQoAHQkCAWJ6+ygAAAAASUVORK5CYII=",
  "base64",
);

const optionAssetPaths = [
  ...[
    "strapless",
    "offShoulder",
    "strap",
    "spaghetti",
    "wideStrap",
    "halter",
    "oneShoulder",
    "shortSleeve",
    "longSleeve",
  ].map((id) => `/assets/options/top/${id}.webp`),
  ...[
    "straight",
    "sweetheart",
    "v",
    "square",
    "scoop",
    "high",
    "illusion",
    "asymmetric",
  ].map((id) => `/assets/options/neckline/${id}.webp`),
  ...[
    "aLine",
    "ballGown",
    "empire",
    "fitAndFlare",
    "mermaid",
    "sheath",
    "teaLength",
  ].map((id) => `/assets/options/silhouette/${id}.webp`),
  ...[
    "mikadoSatin",
    "lace",
    "subtleBeaded",
    "ornateBeaded",
    "tulle",
    "organzaChiffon",
    "glitterBeaded",
    "floral3D",
  ].map((id) => `/assets/options/fabric/${id}.webp`),
  ...["pureWhite", "ivory", "champagne"].map(
    (id) => `/assets/options/color/${id}.webp`,
  ),
  ...["natural", "basque", "drop", "empire"].map(
    (id) => `/assets/options/waistline/${id}.webp`,
  ),
  ...[
    "openBack",
    "vBack",
    "buttonBack",
    "corsetBack",
    "illusionBack",
    "bowBack",
  ].map((id) => `/assets/options/back/${id}.webp`),
  ...["none", "sweep", "chapel", "cathedral"].map(
    (id) => `/assets/options/train/${id}.webp`,
  ),
  ...[
    "corset",
    "draping",
    "waistBow",
    "backBow",
    "pearl",
    "sequin",
    "floral",
    "slit",
    "sheer",
    "detachableSleeve",
    "overskirt",
    "buttons",
  ].map((id) => `/assets/options/detail/${id}.webp`),
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
  const tourMatch = page.url().match(/\/tour\/([^/?#]+)/);
  if (!tourMatch) throw new Error("tour id missing");
  const tourId = tourMatch[1];
  await page.getByRole("button", { name: /샵 추가/ }).click();
  await page.getByPlaceholder("드레스샵 이름").fill("E2E 브라이덜");
  await page.getByRole("button", { name: "추가하기", exact: true }).click();
  await page
    .getByRole("button", { name: "E2E 브라이덜 열기", exact: true })
    .click();
  await page.getByRole("button", { name: "드레스 추가", exact: true }).click();
  await recordCore(page, {
    top: /오프숄더/,
    neckline: /하트형/,
    silhouette: /A라인/,
    candidate: "후보로 남기기",
  });
  await page.getByRole("button", { name: "상세 기록", exact: true }).click();
  await page.getByRole("button", { name: /레이스/ }).click();
  await page.getByRole("button", { name: /아이보리/ }).click();
  await page.getByLabel("특이사항").fill("E2E 메모: 허리 라인이 가장 좋았음");
  await page.getByLabel("특이사항").blur();
  await page.getByRole("button", { name: "5점" }).click();
  await expect(page.getByRole("button", { name: "5점" })).toHaveClass(
    /text-amber-400/,
  );
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
  if (twoDresses) {
    await page
      .getByRole("button", { name: "핵심 기록으로", exact: true })
      .click();
    await page
      .getByRole("button", { name: "핵심 기록 수정", exact: true })
      .click();
    await page.getByRole("button", { name: /^다음$/ }).click();
    await page.getByRole("button", { name: /^다음$/ }).click();
    await page.getByRole("button", { name: /^다음$/ }).click();
    await page
      .getByRole("button", { name: "다음 드레스 기록", exact: true })
      .click();
    await recordCore(page, {
      top: /스트랩리스|끈 없음/,
      neckline: /스트레이트 네크라인|일자 네크라인/,
      silhouette: /머메이드|무릎 부근부터/,
      candidate: "후보 아님",
    });
    await page.getByRole("button", { name: "상세 기록", exact: true }).click();
    await page.getByRole("button", { name: /미카도 새틴|새틴/ }).click();
    await page.getByRole("button", { name: /퓨어 화이트|새하얀/ }).click();
    await page.getByLabel("특이사항").fill("E2E 두 번째 드레스");
    await page.getByLabel("특이사항").blur();
    await page.getByRole("button", { name: "4점" }).click();
    await expect(page.getByRole("button", { name: "4점" })).toHaveClass(
      /text-amber-400/,
    );
  }
  return tourId;
}

async function selectPersistedOption(page: Page, name: RegExp | string) {
  const option = page.getByRole("button", { name }).first();
  await option.click();
  await expect(option).toHaveAttribute("aria-pressed", "true");
}

async function advanceCore(page: Page) {
  const next = page.getByRole("button", { name: /^다음$/ });
  await expect(next).toBeEnabled();
  await next.click();
}

async function recordCore(
  page: Page,
  choices: {
    top: RegExp | string;
    neckline: RegExp | string;
    silhouette: RegExp | string;
    candidate: "후보로 남기기" | "후보 아님";
  },
) {
  await selectPersistedOption(page, choices.top);
  await advanceCore(page);
  await selectPersistedOption(page, choices.neckline);
  await advanceCore(page);
  await selectPersistedOption(page, choices.silhouette);
  await advanceCore(page);
  await selectPersistedOption(page, choices.candidate);
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

async function legacyV1Pdf() {
  const now = "2025-01-02T03:04:05.000Z";
  const payload = {
    format: "gudress-portable-tour",
    schemaVersion: 1,
    appVersion: "1.0.0",
    exportId: "legacy-export",
    exportedAt: now,
    sourceTourId: "legacy-tour",
    includeFace: false,
    tour: {
      id: "legacy-tour",
      title: "예전 v1 투어",
      status: "draft",
      createdAt: now,
      updatedAt: now,
    },
    shops: [
      {
        id: "legacy-shop",
        tourId: "legacy-tour",
        name: "예전 브라이덜",
        order: 0,
        createdAt: now,
        updatedAt: now,
      },
    ],
    dresses: [
      {
        id: "legacy-dress",
        tourId: "legacy-tour",
        shopId: "legacy-shop",
        order: 0,
        label: "Dress 01",
        topStyle: "offShoulder",
        neckline: "sweetheart",
        silhouette: "aLine",
        waistline: "unknown",
        fabric: "lace",
        color: "ivory",
        train: "unknown",
        details: [],
        quickTags: [],
        memo: "예전 메모",
        isFavorite: true,
        createdAt: now,
        updatedAt: now,
      },
    ],
    assets: [],
  };
  const pdf = await PDFDocument.create();
  pdf.addPage([300, 300]);
  await pdf.attach(
    Buffer.from(JSON.stringify(payload)),
    LEGACY_PORTABLE_FILE_NAME,
    { mimeType: "application/json" },
  );
  return Buffer.from(await pdf.save());
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
      console.log(
        `[console.error] ${message.location().url}:${message.location().lineNumber} ${message.text()}`,
      );
  });
  page.on("requestfailed", (request) =>
    console.log(
      `[requestfailed] ${request.url()} ${request.failure()?.errorText ?? "unknown"}`,
    ),
  );
  page.on("response", (response) => {
    if (response.status() >= 400)
      console.log(`[response] ${response.status()} ${response.url()}`);
  });
});

test("mobile core flow autosaves, reloads and compares two dresses", async ({
  page,
}) => {
  await createTour(page, { twoDresses: true });
  await page.reload();
  await page.getByRole("button", { name: "상세 기록", exact: true }).click();
  await expect(page.getByLabel("특이사항")).toHaveValue("E2E 두 번째 드레스");
  await editorToReview(page);
  await page.getByRole("button", { name: "2벌 비교", exact: true }).click();
  await page
    .getByRole("button", { name: /Dress 01/ })
    .first()
    .click();
  await page.getByRole("button", { name: /Dress 02/ }).click();
  await page.getByRole("button", { name: /선택한 2벌 비교하기/ }).click();
  await expect(
    page.getByRole("heading", { name: "두 벌의 차이를 살펴봐요" }),
  ).toBeVisible();
  await expect(
    page.getByText("오프숄더", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    page.getByText("스트랩리스", { exact: true }).first(),
  ).toBeVisible();
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
  await page.getByRole("button", { name: "상세 기록", exact: true }).click();
  await page
    .getByRole("button", { name: "얼굴 미리보기 켜기", exact: true })
    .click();
  await expect(
    page.locator('.dress-preview g[data-layer="figure"]'),
  ).toHaveCount(1);
  await expect(
    page.locator('.dress-preview g[data-layer="face"] image'),
  ).toHaveAttribute("href", /^data:image\/webp;base64,/);
  await expect(page.getByLabel("특이사항")).toHaveValue(
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

test("old v1 recoverable PDF imports without newer optional fields", async ({
  page,
}) => {
  await page.goto("/import");
  await page.locator('input[type="file"]').setInputFiles({
    name: "legacy-v1.pdf",
    mimeType: "application/pdf",
    buffer: await legacyV1Pdf(),
  });
  await expectImportPreview(page, "예전 v1 투어");
  await page
    .getByRole("button", { name: "이 기록 불러오기", exact: true })
    .click();
  await expect(page.getByText("예전 브라이덜", { exact: true })).toBeVisible();
});

test("face export explains full, upper, and back privacy then excludes face", async ({
  page,
}) => {
  await createTour(page, { face: true });
  await editorToReview(page);
  await reviewToExport(page);
  await expect(page.getByText(/전체·상체 스케치/)).toBeVisible();
  await expect(page.getByText(/뒤태에는/)).toBeVisible();
  await page.getByRole("checkbox").uncheck();
  await page
    .getByRole("button", { name: "복원 가능한 PDF 만들기", exact: true })
    .click();
  await expect(page.getByText("PDF가 준비됐어요.")).toBeVisible({
    timeout: 40_000,
  });
  const pdfBytes = await capturePdf(page);
  await page.goto("/import");
  await page.locator('input[type="file"]').setInputFiles({
    name: "face-excluded.pdf",
    mimeType: "application/pdf",
    buffer: pdfBytes,
  });
  await expectImportPreview(page, "E2E 드레스투어");
  await expect(page.getByText(/얼굴 사진도 현재 브라우저에 복원/)).toHaveCount(
    0,
  );
});

test("direct editor URL survives a full reload", async ({ page }) => {
  await createTour(page);
  const url = page.url();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "상세 기록", exact: true }).click();
  await expect(page.getByLabel("특이사항")).toHaveValue(
    "E2E 메모: 허리 라인이 가장 좋았음",
  );
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "상세 기록", exact: true }).click();
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
    optionAssetPaths.map(async (path) => {
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
  const offlineAssets = await page.evaluate(async (paths) => {
    const responses = await Promise.all(paths.map((path) => fetch(path)));
    return responses.map((response) => response.ok);
  }, optionAssetPaths);
  await page.context().setOffline(false);
  expect(offlineAssets.every(Boolean)).toBe(true);
  expect(external).toEqual([]);
});
