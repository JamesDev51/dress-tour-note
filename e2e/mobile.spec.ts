import { expect, test, type Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { LEGACY_PORTABLE_FILE_NAME } from "../src/lib/pdf/portable";
import { inspectPortableTrailer } from "../src/lib/pdf/portableTrailer";
import { chooseUpper } from "./helpers/selectUpper";

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

async function seedLegacyFace(page: Page, tourId: string) {
  await page.evaluate(
    async ({ tourId, data }) => {
      const bytes = new Uint8Array(data);
      const sha = [
        ...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
      ]
        .map((n) => n.toString(16).padStart(2, "0"))
        .join("");
      await new Promise<void>((resolve, reject) => {
        const open = indexedDB.open("gudress");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const tx = db.transaction(
            ["tours", "assets", "dresses"],
            "readwrite",
          );
          const id = "legacy-face-" + tourId;
          tx.objectStore("assets").put({
            id,
            tourId,
            kind: "face",
            mimeType: "image/webp",
            blob: new Blob([bytes], { type: "image/webp" }),
            width: 2,
            height: 2,
            byteLength: bytes.length,
            sha256: sha,
            createdAt: new Date().toISOString(),
          });
          const tour = tx.objectStore("tours").get(tourId);
          tour.onsuccess = () =>
            tx.objectStore("tours").put({ ...tour.result, faceAssetId: id });
          const records = tx.objectStore("dresses").getAll();
          records.onsuccess = () => {
            for (const record of records.result) {
              if (record.tourId !== tourId) continue;
              tx.objectStore("dresses").put({
                ...record,
                faceTransform: { x: 0, y: 0, scale: 1, rotation: 0 },
              });
            }
          };
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(tx.error);
        };
      });
    },
    { tourId, data: [...tinyPng] },
  );
}

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
  await expect(page).not.toHaveURL(/\/tour\/new(?:[?#]|$)/);
  await expect(page).toHaveURL(/\/tour\/[^/]+$/);
  const tourMatch = page.url().match(/\/tour\/([^/?#]+)/);
  if (!tourMatch) throw new Error("tour id missing");
  const tourId = tourMatch[1];
  await page.getByRole("button", { name: /샵 추가/ }).click();
  await page.getByPlaceholder("드레스샵 이름").fill("E2E 브라이덜");
  await page.getByRole("button", { name: "추가하기", exact: true }).click();
  await expect(page).toHaveURL(/\/shop\/[^/]+$/);
  await page.getByRole("button", { name: "드레스 추가", exact: true }).click();
  await recordCore(page, {
    upper: /어깨 감쌈 · 하트 가슴선/,
    fabric: /레이스/,
    silhouette: /A라인/,
    candidate: true,
  });
  await page.getByRole("button", { name: "자세히 기록", exact: true }).click();
  await page.getByRole("button", { name: /레이스/ }).click();
  await page
    .getByRole("textbox", { name: "추가 메모", exact: true })
    .fill("E2E 메모: 허리 라인이 가장 좋았음");
  await page.getByRole("textbox", { name: "추가 메모", exact: true }).blur();
  await page.getByRole("button", { name: "5점" }).click();
  await expect(page.getByRole("button", { name: "5점" })).toHaveClass(
    /text-amber-400/,
  );
  if (face) await seedLegacyFace(page, tourId);
  if (twoDresses) {
    await page.getByRole("button", { name: "기록으로", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "다음 드레스 기록", exact: true }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "다음 드레스 기록", exact: true })
      .click();
    await recordCore(page, {
      upper: /끈 없음 · 일자 가슴선/,
      fabric: /실크/,
      silhouette: /머메이드|무릎 부근부터/,
      candidate: false,
    });
    await page
      .getByRole("button", { name: "자세히 기록", exact: true })
      .click();
    await page.getByRole("button", { name: /^실크/ }).click();
    await page
      .getByRole("textbox", { name: "추가 메모", exact: true })
      .fill("E2E 두 번째 드레스");
    await page.getByRole("textbox", { name: "추가 메모", exact: true }).blur();
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
    upper: RegExp | string;
    fabric: RegExp | string;
    silhouette: RegExp | string;
    candidate: boolean;
  },
) {
  await selectPersistedOption(page, choices.silhouette);
  await advanceCore(page);
  await selectPersistedOption(page, choices.fabric);
  await advanceCore(page);
  await chooseUpper(page, choices.upper);
  await page
    .getByRole("button", { name: "기록 완료하고 보기", exact: true })
    .click();
  await expect(page).toHaveURL(/view=record/);
  const feedback = page.getByText("느낌·평가 남기기 · 선택", { exact: true });
  await feedback.click();
  if (choices.candidate)
    await page.getByRole("button", { name: "후보", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "후보", exact: true }),
  ).toHaveAttribute("aria-pressed", String(choices.candidate));
  await feedback.click();
}

async function editorToReview(page: Page) {
  await page.getByLabel("뒤로").click();
  await page.getByLabel("투어로 돌아가기").click();
  await page.getByLabel("결과 보기").click();
  await expect(page.getByText("E2E 드레스투어", { exact: true })).toBeVisible();
}

async function reviewToExport(page: Page) {
  await page.getByRole("link", { name: "PDF 만들기", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "PDF로 저장하기", exact: true }),
  ).toBeVisible({
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
        label: "드레스 01",
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

test("mobile core flow autosaves, reloads and opens each record without comparison", async ({
  page,
}) => {
  await createTour(page, { twoDresses: true });
  await page.reload();
  await page.getByRole("button", { name: "자세히 기록", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "추가 메모", exact: true }),
  ).toHaveValue("E2E 두 번째 드레스");
  await page.getByLabel("뒤로").click();
  await expect(page.getByRole("button", { name: /비교/ })).toHaveCount(0);
  await page.getByLabel("투어로 돌아가기").click();
  await page.getByLabel("결과 보기").click();
  const reviewUrl = page.url();
  await expect(page.getByRole("button", { name: /비교/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "PDF 만들기" })).toBeVisible();
  await page
    .getByRole("button", { name: /드레스 01/ })
    .first()
    .click();
  await expect(page).toHaveURL(/view=record/);
  await expect(
    page.getByRole("heading", { level: 1, name: "드레스 01", exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("definition")
      .filter({ hasText: "E2E 메모: 허리 라인이 가장 좋았음" }),
  ).toBeVisible();
  await expect(
    page.getByText("E2E 두 번째 드레스", { exact: true }),
  ).toHaveCount(0);
  await page.goto(reviewUrl);
  await page.getByRole("button", { name: /드레스 02/ }).click();
  await expect(page).toHaveURL(/view=record/);
  await expect(
    page.getByRole("heading", { level: 1, name: "드레스 02", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("definition").filter({ hasText: "E2E 두 번째 드레스" }),
  ).toBeVisible();
  await expect(
    page.locator('svg[data-renderer="memory-sketch"][data-view="full"]'),
  ).toHaveCount(1);
});

test("first-use offline PDF restores mixed materials as v4 while excluding legacy face data", async ({
  page,
  context,
}, testInfo) => {
  const pdfFontRequests: string[] = [];
  page.on("request", (request) => {
    if (/pretendard-pdf-static[^/]*\.ttf(?:[?#]|$)/.test(request.url()))
      pdfFontRequests.push(request.url());
  });
  const tourId = await createTour(page, { face: true });
  await page
    .getByRole("checkbox", { name: "상체와 치마 소재가 달라요" })
    .click();
  await expect(
    page.getByRole("checkbox", { name: "상체와 치마 소재가 달라요" }),
  ).toBeChecked();
  await page
    .getByRole("group", { name: "상체 소재", exact: true })
    .getByRole("button", { name: /^레이스/ })
    .click();
  await page
    .getByRole("group", { name: "치마 소재", exact: true })
    .getByRole("button", { name: /^망사·쉬폰/ })
    .click();
  await editorToReview(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() =>
      page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
    )
    .toBe(true);
  expect(pdfFontRequests).toEqual([]);
  await context.setOffline(true);
  await reviewToExport(page);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await page
    .getByRole("button", { name: "백업용 PDF 만들기", exact: true })
    .click();
  await expect(page.getByText("PDF가 준비됐어요.")).toBeVisible({
    timeout: 40000,
  });
  await page.screenshot({
    path: testInfo.outputPath("offline-first-pdf-ready.png"),
  });
  const pdfBytes = await capturePdf(page);
  await context.setOffline(false);
  const portable = await inspectPortableTrailer(new Uint8Array(pdfBytes));
  expect(portable?.payload.schemaVersion).toBe(4);
  expect(portable?.payload.includeFace).toBe(false);
  expect(portable?.assetBytes.size).toBe(0);
  expect(portable?.payload.tour.faceAssetId).toBeUndefined();
  expect(portable?.payload.dresses[0]).toMatchObject({
    upperFabric: "lace",
    lowerFabric: "organzaChiffon",
  });
  await page.goto("/import");
  await page.locator('input[type="file"]').setInputFiles({
    name: "mixed-copy.pdf",
    mimeType: "application/pdf",
    buffer: pdfBytes,
  });
  await expectImportPreview(page, "E2E 드레스투어");
  await expect(
    page.getByText("이 브라우저에 같은 투어가 있어요"),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "새 투어로 추가", exact: true })
    .click();
  await expect(page).toHaveURL(/\/tour\/[^/]+$/);
  expect(page.url()).not.toContain(tourId);
  await page
    .getByRole("button", { name: "E2E 브라이덜 열기", exact: true })
    .click();
  await page
    .getByRole("button", { name: /드레스 01/ })
    .first()
    .click();
  await page.getByRole("button", { name: "자세히 기록", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "상체와 치마 소재가 달라요" }),
  ).toBeChecked();
  await expect(
    page
      .getByRole("group", { name: "상체 소재", exact: true })
      .getByRole("button", { name: /^레이스/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page
      .getByRole("group", { name: "치마 소재", exact: true })
      .getByRole("button", { name: /^망사·쉬폰/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator('input[type="file"][accept*="image"]')).toHaveCount(
    0,
  );
  await expect(page.locator('[data-option-category="backStyle"]')).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("textbox", { name: "추가 메모", exact: true }),
  ).toHaveValue("E2E 메모: 허리 라인이 가장 좋았음");
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
    "기록을 가져올 수 있는 드레스노트 백업용 PDF가 아니에요.",
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
    .getByRole("button", { name: "이 기록 가져오기", exact: true })
    .click();
  await expect(page.getByText("예전 브라이덜", { exact: true })).toBeVisible();
});

test("legacy v1 records open through read mode with saved details intact", async ({
  page,
}) => {
  await page.goto("/import");
  await page.locator('input[type="file"]').setInputFiles({
    name: "legacy-v1-read-mode.pdf",
    mimeType: "application/pdf",
    buffer: await legacyV1Pdf(),
  });
  await expectImportPreview(page, "예전 v1 투어");
  await page
    .getByRole("button", { name: "이 기록 가져오기", exact: true })
    .click();
  await expect(page.getByText("예전 브라이덜", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "예전 브라이덜 열기", exact: true })
    .click();

  const read = page.getByRole("button", {
    name: "드레스 01 기록 보기",
    exact: true,
  });
  await expect(read).toBeVisible();
  await read.click();
  await expect(page).toHaveURL(/view=record/);
  await expect(
    page.getByRole("definition").filter({ hasText: "예전 메모" }),
  ).toBeVisible();
  await page.getByText("고른 특징의 예시 보기", { exact: true }).click();
  await expect(page.getByText("레이스 예시", { exact: true })).toBeVisible();
  await expect(
    page.locator("dd").filter({ hasText: "후보" }).first(),
  ).toBeVisible();

  await page
    .getByRole("button", { name: "기본 기록 수정", exact: true })
    .click();
  await expect(page).toHaveURL(/view=edit/);
  await expect(
    page.getByRole("heading", { name: /전체 모양은 어땠나요\?/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "뒤로", exact: true }).click();
  await expect(page).toHaveURL(/\/shop\//);
  await page
    .getByRole("button", { name: "드레스 01 기록 보기", exact: true })
    .click();
  await expect(
    page.getByRole("definition").filter({ hasText: "예전 메모" }),
  ).toBeVisible();
  await page.getByText("고른 특징의 예시 보기", { exact: true }).click();
  await expect(page.getByText("레이스 예시", { exact: true })).toBeVisible();
});

test("retired face, rear, color and length controls stay absent and legacy faces never export", async ({
  page,
}) => {
  await createTour(page, { face: true });
  for (const category of ["color", "train", "backStyle"])
    await expect(
      page.locator(`[data-option-category="${category}"]`),
    ).toHaveCount(0);
  await expect(page.locator('input[type="file"][accept*="image"]')).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("button", { name: /^얼굴 (사진|미리보기)|^뒷모습|^등 뒤/ }),
  ).toHaveCount(0);
  await editorToReview(page);
  await reviewToExport(page);
  await expect(page.getByRole("checkbox")).toHaveCount(0);
  await expect(page.getByText(/얼굴|뒷모습/)).toHaveCount(0);
  await page
    .getByRole("button", { name: "백업용 PDF 만들기", exact: true })
    .click();
  await expect(page.getByText("PDF가 준비됐어요.")).toBeVisible({
    timeout: 40000,
  });
  const bytes = await capturePdf(page);
  const portable = await inspectPortableTrailer(new Uint8Array(bytes));
  expect(portable?.payload.includeFace).toBe(false);
  expect(portable?.payload.tour.faceAssetId).toBeUndefined();
  expect(
    portable?.payload.dresses.every(
      (dress) => dress.faceTransform === undefined,
    ),
  ).toBe(true);
  expect(portable?.assetBytes.size).toBe(0);
  await page.goto("/import");
  await page.locator('input[type="file"]').setInputFiles({
    name: "legacy-face-excluded.pdf",
    mimeType: "application/pdf",
    buffer: bytes,
  });
  await expectImportPreview(page, "E2E 드레스투어");
  await expect(page.getByText(/얼굴/)).toHaveCount(0);
});

test("direct editor URL survives a full reload", async ({ page }) => {
  await createTour(page);
  const url = page.url();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "자세히 기록", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "추가 메모", exact: true }),
  ).toHaveValue("E2E 메모: 허리 라인이 가장 좋았음");
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: "자세히 기록", exact: true }).click();
  await expect(page.getByRole("button", { name: /어깨 감쌈/ })).toHaveAttribute(
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
  await expect(
    page.getByRole("heading", { name: /입어본 드레스/ }),
  ).toBeVisible();
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
