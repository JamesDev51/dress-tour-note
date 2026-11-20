import { readFile } from "node:fs/promises";
import { expect, test as base, type Page } from "@playwright/test";
import { snapshotDressLook } from "../src/lib/dress/styling";
import type { Dress } from "../src/types/domain";
import { chooseUpper } from "./helpers/selectUpper";
import {
  createIsolatedPreview,
  type IsolatedPreview,
} from "./helpers/isolatedPreview";

const test = base.extend<{ isolatedPreview: IsolatedPreview | null }>({
  isolatedPreview: async ({ browserName }, use) => {
    if (browserName !== "webkit") {
      await use(null);
      return;
    }
    const server = await createIsolatedPreview();
    try {
      await use(server);
    } finally {
      await server.close();
    }
  },
  baseURL: async ({ isolatedPreview }, use, testInfo) => {
    await use(isolatedPreview?.origin ?? testInfo.project.use.baseURL);
  },
});

async function records(page: Page): Promise<Dress[]> {
  return page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const opening = indexedDB.open("gudress");
        opening.onerror = () => reject(opening.error);
        opening.onsuccess = () => {
          const database = opening.result;
          const request = database
            .transaction("dresses")
            .objectStore("dresses")
            .getAll();
          request.onsuccess = () => {
            database.close();
            resolve(request.result);
          };
          request.onerror = () => {
            database.close();
            reject(request.error);
          };
        };
      }),
  );
}
async function start(page: Page) {
  // Functional storage checks use stable frames; motion has dedicated recall coverage.
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("link", { name: /새 투어 시작/ }).click();
  await page.getByPlaceholder("예: 히똥").fill("연출 기록");
  await page.getByRole("button", { name: "투어 만들기", exact: true }).click();
  await page.getByRole("button", { name: /샵 추가/ }).click();
  await page.getByPlaceholder("드레스샵 이름").fill("연출 샵");
  await page.getByRole("button", { name: "추가하기", exact: true }).click();
  await expect(page).toHaveURL(/\/shop\/[^/]+$/);
  await page.getByRole("button", { name: "드레스 추가", exact: true }).click();
  await page.getByRole("button", { name: /^A라인/ }).click();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await page.getByRole("button", { name: /^레이스/ }).click();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await chooseUpper(page, /^끈 없음 · 하트 가슴선/);
  await page
    .getByRole("button", { name: "기록 완료하고 보기", exact: true })
    .click();
  await expect(page).toHaveURL(/view=record/);
}
async function openPreviouslySavedLook(page: Page) {
  await expect(page.getByRole("button", { name: "연출 추가" })).toHaveCount(0);
  await expect(page.getByText("기본 연출", { exact: true })).toHaveCount(0);
  const recordUrl = new URL(page.url());
  await page.getByRole("button", { name: "뒤로", exact: true }).click();
  await expect(page).toHaveURL(/\/shop\/[^/]+$/);
  const [dress] = await records(page);
  const id = crypto.randomUUID();
  const snapshot = snapshotDressLook(dress);
  dress.stylingVariants = [
    {
      id,
      label: "연출 1",
      createdAt: dress.createdAt,
      updatedAt: dress.updatedAt,
      snapshot: {
        ...snapshot,
        topStyle: "offShoulder",
        memoryCue: undefined,
        memo: "",
      },
    },
  ];
  await page.evaluate(
    (legacyDress) =>
      new Promise<void>((resolve, reject) => {
        const opening = indexedDB.open("gudress");
        opening.onerror = () => reject(opening.error);
        opening.onsuccess = () => {
          const db = opening.result;
          const tx = db.transaction("dresses", "readwrite");
          tx.objectStore("dresses").put(legacyDress);
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
          tx.onabort = () => {
            db.close();
            reject(tx.error);
          };
        };
      }),
    dress,
  );
  recordUrl.searchParams.set("look", id);
  await page.goto(recordUrl.href);
  await expect(
    page.getByRole("button", { name: "연출 1", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "연출 추가" })).toHaveCount(0);
}

async function setMixedMaterials(
  page: Page,
  lower: RegExp = /^망사·쉬폰/,
  startLabel?: string,
) {
  await page
    .getByRole("navigation", { name: "기록 보기와 추가 입력" })
    .getByRole("button", { name: "자세히 기록", exact: true })
    .click();
  const mixed = page.getByRole("checkbox", {
    name: "상체와 치마 소재가 달라요",
  });
  if (!(await mixed.isChecked())) await mixed.click();
  await expect(mixed).toBeChecked();
  await page
    .getByRole("group", { name: "상체 소재", exact: true })
    .getByRole("button", { name: /^레이스/ })
    .click();
  await page
    .getByRole("group", { name: "치마 소재", exact: true })
    .getByRole("button", { name: lower })
    .click();
  if (startLabel) {
    const startChoice = page.getByRole("button", {
      name: startLabel,
      exact: true,
    });
    await startChoice.click();
    await expect(startChoice).toHaveAttribute("aria-pressed", "true");
  }
  await page
    .getByRole("button", { name: "기록으로 돌아가기", exact: true })
    .click();
}

for (const width of [320, 390]) {
  test(`styling memory, representative and offline individual viewing at ${width}px`, async ({
    page,
    context,
    isolatedPreview,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await start(page);
    await page.getByText("느낌·평가 남기기 · 선택", { exact: true }).click();
    await page
      .getByRole("textbox", { name: "기억할 특징", exact: true })
      .fill("기본 하트 레이스");
    await page
      .getByRole("textbox", { name: "추가 메모", exact: true })
      .fill("기본 메모 마지막");
    await page.getByRole("button", { name: "5점", exact: true }).click();
    await page.getByRole("button", { name: "후보", exact: true }).click();
    await openPreviouslySavedLook(page);
    let [dress] = await records(page);
    expect(dress.stylingVariants).toHaveLength(1);
    const lookId = dress.stylingVariants![0].id;
    expect(dress.stylingVariants![0].snapshot).toMatchObject({
      topStyle: "offShoulder",
      neckline: "sweetheart",
      fabric: "lace",
      memo: "",
    });
    expect(dress.stylingVariants![0].snapshot.memoryCue).toBeUndefined();
    expect(dress.memo).toBe("기본 메모 마지막");
    expect(dress.preferredStylingId).toBeUndefined();
    await page.getByText("느낌·평가 남기기 · 선택", { exact: true }).click();
    await expect(
      page.getByRole("button", { name: "5점", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("textbox", { name: "기억할 특징", exact: true }),
    ).toHaveValue("");
    await page
      .getByRole("textbox", { name: "기억할 특징", exact: true })
      .fill("어깨 감싼 레이스");
    await page
      .getByRole("textbox", { name: "추가 메모", exact: true })
      .fill("연출의 마지막 메모");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBe(0);
    await page
      .getByRole("button", { name: "대표 연출로 선택", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "연출 1 · 대표", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    const recordUrl = page.url();
    await expect(
      page.getByRole("combobox", { name: "비교할 연출" }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: /비교/ })).toHaveCount(0);
    await page.getByRole("button", { name: "기본 연출", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "기본 하트 레이스", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("definition").filter({ hasText: /^기본 메모 마지막$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "어깨 감싼 레이스", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "연출 1 · 대표", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "어깨 감싼 레이스", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("definition").filter({ hasText: /^연출의 마지막 메모$/ }),
    ).toBeVisible();
    await expect(
      page.locator('svg[data-renderer="memory-sketch"][data-view="full"]'),
    ).toHaveCount(1);
    await page.screenshot({
      path: testInfo.outputPath("styling-record.png"),
      fullPage: true,
    });
    await page.goto(recordUrl);
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await expect
      .poll(() =>
        page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
      )
      .toBe(true);
    const cachedResources = await page.evaluate(async () => {
      const names = await caches.keys();
      const cachesWithResources = await Promise.all(
        names.map(async (name) => {
          const cache = await caches.open(name);
          return (await cache.keys()).map(
            (request) => new URL(request.url).pathname,
          );
        }),
      );
      return cachesWithResources.flat();
    });
    expect(cachedResources).toContain("/index.html");
    expect(
      cachedResources.some(
        (path) => path.startsWith("/assets/") && path.endsWith(".js"),
      ),
    ).toBe(true);
    expect(cachedResources).toContain("/assets/options/fabric/lace.webp");
    // WebKit's offline emulation rejects even service-worker-local responses.
    // Use a real origin outage instead: https://github.com/microsoft/playwright/issues/42775
    if (isolatedPreview) await isolatedPreview.stop();
    else await context.setOffline(true);
    await testInfo.attach("offline-transport.json", {
      contentType: "application/json",
      body: Buffer.from(
        JSON.stringify({
          mode: isolatedPreview
            ? "isolated-origin-stopped-and-connection-refused"
            : "browser-offline-emulation",
          origin: new URL(recordUrl).origin,
          cachedResourceCount: cachedResources.length,
        }),
      ),
    });
    await page.reload();
    await expect(
      page.getByRole("heading", { name: "어깨 감싼 레이스", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "기본 연출", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "기본 하트 레이스", exact: true }),
    ).toBeVisible();
    [dress] = await records(page);
    expect(dress.preferredStylingId).toBe(lookId);
    expect(dress.stylingVariants![0].snapshot.memo).toBe("연출의 마지막 메모");
    expect(await records(page)).toHaveLength(1);
    await expect(
      page.getByRole("combobox", { name: "비교할 연출" }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "연출 1 · 대표", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "어깨 감싼 레이스", exact: true }),
    ).toBeVisible();
    if (isolatedPreview) await isolatedPreview.restart();
    else await context.setOffline(false);
    await page.goto(recordUrl);
    await page.getByText("이름 변경·삭제", { exact: true }).click();
    await page
      .getByRole("button", { name: "이 연출 삭제", exact: true })
      .click();
    await page.getByRole("button", { name: "삭제하기", exact: true }).click();
    await expect(page).toHaveURL(/look=base/);
    await expect(page.getByRole("button", { name: /기본 연출/ })).toHaveCount(
      0,
    );
    [dress] = await records(page);
    expect(dress.stylingVariants ?? []).toHaveLength(0);
    expect(dress.preferredStylingId).toBeUndefined();
    expect(dress.isFavorite).toBe(true);
    expect(dress.rating).toBe(5);
  });
}

test("v4 PDF copy keeps mixed fabrics, independent styling memories and representative", async ({
  page,
}, testInfo) => {
  await start(page);
  await setMixedMaterials(page);
  await openPreviouslySavedLook(page);
  await page.getByText("느낌·평가 남기기 · 선택", { exact: true }).click();
  await page
    .getByRole("textbox", { name: "기억할 특징", exact: true })
    .fill("추가 연출 특징");
  await page
    .getByRole("textbox", { name: "아쉬운 점", exact: true })
    .fill("팔이 답답함");
  await page
    .getByRole("button", { name: "대표 연출로 선택", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "연출 1 · 대표", exact: true }),
  ).toBeVisible();
  const [original] = await records(page);
  await page.goto("/tour/" + original.tourId + "/export");
  await page
    .getByRole("button", { name: "백업용 PDF 만들기", exact: true })
    .click();
  await expect(page.getByText("PDF가 준비됐어요.")).toBeVisible({
    timeout: 40000,
  });
  const downloading = page.waitForEvent("download");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  const path = testInfo.outputPath("styling-v4.pdf");
  await (await downloading).saveAs(path);
  await page.goto("/import");
  await page.locator('input[type="file"]').setInputFiles({
    name: "styling-v4.pdf",
    mimeType: "application/pdf",
    buffer: await readFile(path),
  });
  await page
    .getByRole("button", { name: "새 투어로 추가", exact: true })
    .click();
  await expect(page).toHaveURL(/\/tour\/[^/]+$/);
  const copy = (await records(page)).find((item) => item.id !== original.id)!;
  expect(copy.tourId).not.toBe(original.tourId);
  expect(copy.stylingVariants).toHaveLength(1);
  expect(copy.preferredStylingId).toBe(copy.stylingVariants![0].id);
  expect(copy.preferredStylingId).not.toBe(original.preferredStylingId);
  expect(copy.stylingVariants![0].snapshot).toMatchObject({
    memoryCue: "추가 연출 특징",
    concern: "팔이 답답함",
    topStyle: "offShoulder",
    neckline: "sweetheart",
    upperFabric: "lace",
    lowerFabric: "organzaChiffon",
  });
  expect(copy.upperFabric).toBe("lace");
  expect(copy.lowerFabric).toBe("organzaChiffon");
  expect(copy.memoryCue).toBeUndefined();
});

for (const width of [320, 390]) {
  test(`batch flow keeps mixed fabrics and autosaved name when switching individual looks at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await start(page);
    await expect(
      page.getByRole("button", { name: "다음 드레스 기록", exact: true }),
    ).toBeInViewport({ ratio: 1 });
    await expect(
      page.getByRole("textbox", { name: "기억할 특징", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: "좋았던 점", exact: true }),
    ).not.toBeVisible();
    await setMixedMaterials(
      page,
      /^망사·쉬폰/,
      width === 390 ? "허벅지부터" : undefined,
    );
    await openPreviouslySavedLook(page);
    await setMixedMaterials(
      page,
      /^실크/,
      width === 390 ? "무릎부터" : undefined,
    );
    await page.getByText("이름 변경·삭제", { exact: true }).click();
    await page
      .getByRole("textbox", { name: "연출 이름", exact: true })
      .fill("어깨 감싼 최종 모습");
    await page.reload();
    await expect(
      page.getByRole("button", { name: "어깨 감싼 최종 모습", exact: true }),
    ).toBeVisible();
    const [dress] = await records(page);
    expect(dress.upperFabric).toBe("lace");
    expect(dress.lowerFabric).toBe("organzaChiffon");
    expect(dress.stylingVariants![0].label).toBe("어깨 감싼 최종 모습");
    expect(dress.stylingVariants![0].snapshot.upperFabric).toBe("lace");
    expect(dress.stylingVariants![0].snapshot.lowerFabric).toBe("mikadoSatin");
    const origin = page.url();
    await expect(
      page.getByRole("combobox", { name: "비교할 연출" }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "기본 연출 · 대표", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "기본 연출 · 대표", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page
      .getByRole("button", { name: "어깨 감싼 최종 모습", exact: true })
      .click();
    await expect(page).toHaveURL(origin);
    await expect(
      page.getByRole("button", { name: "어깨 감싼 최종 모습", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({
      path: testInfo.outputPath("batch-completed-first-screen.png"),
    });
    await page.goto(`/tour/${dress.tourId}/export`);
    await page
      .getByRole("button", { name: "백업용 PDF 만들기", exact: true })
      .click();
    await expect(page.getByText("PDF가 준비됐어요.")).toBeVisible({
      timeout: 40000,
    });
    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name: "저장", exact: true }).click();
    const filename =
      width === 390 ? "regional-start-v5.pdf" : "mixed-materials-v4.pdf";
    const path = testInfo.outputPath(filename);
    await (await downloading).saveAs(path);
    await page.goto("/import");
    await page.locator('input[type="file"]').setInputFiles({
      name: filename,
      mimeType: "application/pdf",
      buffer: await readFile(path),
    });
    await page
      .getByRole("button", { name: "새 투어로 추가", exact: true })
      .click();
    await expect(page).toHaveURL(/\/tour\/[^/]+$/);
    const copy = (await records(page)).find((item) => item.id !== dress.id)!;
    expect(copy.upperFabric).toBe("lace");
    expect(copy.lowerFabric).toBe("organzaChiffon");
    expect(copy.stylingVariants![0].snapshot.upperFabric).toBe("lace");
    expect(copy.stylingVariants![0].snapshot.lowerFabric).toBe("mikadoSatin");
    expect(copy.lowerFabricStart ?? "waist").toBe(
      width === 390 ? "thigh" : "waist",
    );
    expect(copy.stylingVariants![0].snapshot.lowerFabricStart ?? "waist").toBe(
      width === 390 ? "knee" : "waist",
    );
    expect(copy.stylingVariants![0].label).toBe("어깨 감싼 최종 모습");
  });
}
