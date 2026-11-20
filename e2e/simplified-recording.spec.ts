import {
  expect,
  test as base,
  type Locator,
  type Page,
} from "@playwright/test";
import {
  createIsolatedPreview,
  type IsolatedPreview,
} from "./helpers/isolatedPreview";
import type { Dress } from "../src/types/domain";
import { selectUpperChoices } from "./helpers/selectUpper";

const test = base.extend<{ isolated: IsolatedPreview }>({
  isolated: async ({}, use) => {
    const server = await createIsolatedPreview();
    try {
      await use(server);
    } finally {
      await server.close();
    }
  },
  baseURL: async ({ isolated }, use) => use(isolated.origin),
});
async function start(page: Page) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("link", { name: /새 투어 시작/ }).click();
  await page.getByPlaceholder("예: 히똥").fill("상하 소재 기록");
  await page.getByRole("button", { name: "투어 만들기", exact: true }).click();
  await page.getByRole("button", { name: /샵 추가/ }).click();
  await page.getByPlaceholder("드레스샵 이름").fill("새 기록 샵");
  await page.getByRole("button", { name: "추가하기", exact: true }).click();
  await page.getByRole("button", { name: "드레스 추가", exact: true }).click();
}
async function saved(page: Page) {
  return page.evaluate(
    () =>
      new Promise<Dress[]>((resolve, reject) => {
        const open = indexedDB.open("gudress");
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const db = open.result;
          const req = db.transaction("dresses").objectStore("dresses").getAll();
          req.onsuccess = () => {
            db.close();
            resolve(req.result);
          };
          req.onerror = () => reject(req.error);
        };
      }),
  );
}
for (const width of [320, 390]) {
  test(`independent upper, split material, explicit preview and removed features at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await start(page);
    await expect(
      page.getByRole("button", { name: /짧은 길이|발목 위/ }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: width === 390 ? /^머메이드/ : /^A라인/ })
      .click();
    await page.getByRole("button", { name: "다음", exact: true }).click();
    await page.getByRole("button", { name: /^레이스/ }).click();
    await page
      .getByRole("checkbox", { name: "상체와 치마 소재가 달라요" })
      .click();
    const upper = page.getByRole("group", { name: "상체 소재", exact: true });
    const lower = page.getByRole("group", { name: "치마 소재", exact: true });
    await expect(
      upper.getByRole("button", { name: /^레이스/ }),
    ).toHaveAttribute("aria-pressed", "true");
    const chiffon = lower.getByRole("button", { name: /^망사·쉬폰/ });
    await chiffon.scrollIntoViewIfNeeded();
    const scroll = await page.evaluate(() => window.scrollY);
    await chiffon.click();
    await expect(chiffon).toHaveAttribute("aria-pressed", "true");
    expect(
      Math.abs((await page.evaluate(() => window.scrollY)) - scroll),
    ).toBeLessThan(16); // Native focus/pressed borders may shift a few pixels; no preview jump.
    await expect(
      upper.getByRole("button", { name: /^레이스/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("button", { name: "허리부터", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    if (width === 390) {
      const start = page.getByRole("button", {
        name: "허벅지부터",
        exact: true,
      });
      await start.click();
      await expect(start).toHaveAttribute("aria-pressed", "true");
    }
    await page.getByRole("button", { name: "다음", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "목·가슴선", exact: true }),
    ).toBeInViewport();
    await expect(
      page.getByRole("heading", { name: "끈·소매", exact: true }),
    ).toBeAttached();
    await expect(
      page.getByRole("button", { name: /끈 없음 · 하트/ }),
    ).toHaveCount(0);
    await selectUpperChoices(
      page,
      width === 390 ? "일자 가슴선" : "하트 가슴선",
      width === 390 ? "어깨 감쌈" : "끈 없음",
    );
    await expect(
      page.getByRole("button", { name: "맨 위로", exact: true }),
    ).toHaveCount(0);
    const preview = page.getByRole("button", { name: "미리보기", exact: true });
    await preview.click();
    const dialog = page.getByRole("dialog", { name: "드레스 미리보기" });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.locator(".dress-preview[data-garment-state]"),
    ).toHaveAttribute("data-garment-state", /^(ready|partial)$/);
    await expect(
      dialog.locator(
        '[data-material="organzaChiffon"][data-region="lower-body"]',
      ),
    ).not.toHaveCount(0);
    if (width === 390) {
      await expect(
        dialog.locator(
          '[data-material-section="upper-extension"][data-lower-fabric-start="thigh"][data-material="lace"]',
        ),
      ).not.toHaveCount(0);
    }
    await expect(dialog.locator('[data-layer="face"]')).toHaveCount(0);
    await page.screenshot({ path: `/tmp/dress-simplify-preview-${width}.png` });
    await dialog.getByRole("button", { name: "선택으로 돌아가기" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(preview).toBeFocused();
    await page
      .getByRole("button", { name: "기록 완료하고 보기", exact: true })
      .click();
    await expect(page).toHaveURL(/view=record/);
    await expect(
      page.getByRole("definition").filter({
        hasText:
          width === 390
            ? "위쪽 레이스 · 허벅지부터 망사·쉬폰"
            : "상체 레이스 · 치마 망사·쉬폰",
      }),
    ).toBeVisible();
    await page.reload();
    await expect
      .poll(async () => {
        const [d] = await saved(page);
        return [
          d.upperFabric,
          d.lowerFabric,
          d.topStyle,
          d.neckline,
          d.lowerFabricStart ?? "waist",
        ];
      })
      .toEqual([
        "lace",
        "organzaChiffon",
        width === 390 ? "offShoulder" : "strapless",
        width === 390 ? "straight" : "sweetheart",
        width === 390 ? "thigh" : "waist",
      ]);
    for (const name of ["뒷모습", "얼굴 미리보기 켜기", "맨 위로"])
      await expect(page.getByRole("button", { name, exact: true })).toHaveCount(
        0,
      );
    await page
      .getByRole("button", { name: "자세히 기록", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "허리선", exact: true }),
    ).toBeVisible();
    for (const name of [
      "색상",
      "뒤로 끌리는 길이",
      "등 파임",
      "등 뒤 여밈",
      "얼굴 미리보기",
    ])
      await expect(
        page.getByRole("heading", { name, exact: true }),
      ).toHaveCount(0);
    for (const tag of [
      "가벼움",
      "편함",
      "조임",
      "흘러내림",
      "무거움",
      "불편함",
      "까슬거림",
      "탈부착 소매",
      "뒤 리본",
    ])
      await expect(
        page.getByRole("button", { name: tag, exact: true }),
      ).toHaveCount(0);
    await expect(page.getByRole("button", { name: /^스팽글/ })).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBeLessThanOrEqual(1);
  });
}

async function withDressWritesDelayed(
  page: Page,
  interact: () => Promise<void>,
) {
  // Hold the actual store lock until the test releases it. Queued app
  // transactions cannot commit while these interactions are in progress.
  const release = await page.evaluateHandle(
    () =>
      new Promise<() => void>((ready, reject) => {
        const opening = indexedDB.open("gudress");
        opening.onerror = () => reject(opening.error);
        opening.onsuccess = () => {
          const db = opening.result;
          const tx = db.transaction("dresses", "readwrite");
          tx.oncomplete = () => db.close();
          tx.onabort = () => {
            db.close();
            reject(tx.error);
          };
          const store = tx.objectStore("dresses");
          let holding = true;
          const hold = () => {
            if (holding) store.count().onsuccess = hold;
          };
          store.count().onsuccess = () => {
            hold();
            ready(() => {
              holding = false;
            });
          };
        };
      }),
  );
  try {
    await interact();
  } finally {
    await release.evaluate((unlock) => unlock());
    await release.dispose();
  }
}

test("keeps split material choices editable during a delayed local write", async ({
  page,
}) => {
  await start(page);
  await page.getByRole("button", { name: /^머메이드/ }).click();
  const next = page.getByRole("button", { name: "다음", exact: true });
  await next.click();
  await page.getByRole("button", { name: /^레이스/ }).click();
  await page
    .getByRole("checkbox", { name: "상체와 치마 소재가 달라요" })
    .click();
  const upper = page.getByRole("group", { name: "상체 소재", exact: true });
  const lower = page.getByRole("group", { name: "치마 소재", exact: true });
  const chiffon = lower.getByRole("button", { name: /^망사·쉬폰/ });
  await expect(chiffon).toBeEnabled();

  const beaded = upper.getByRole("button", { name: /^은은한 비즈/ });
  const thigh = page.getByRole("button", { name: "허벅지부터", exact: true });
  await withDressWritesDelayed(page, async () => {
    await chiffon.click();
    await expect(beaded).toBeEnabled({ timeout: 3000 });
    await beaded.click();
    await thigh.click();
    await expect(thigh).toHaveAttribute("aria-pressed", "true");
    await next.click();
    await expect(
      page.getByRole("heading", { name: "목·가슴선", exact: true }),
    ).toBeVisible();
    await page.getByRole("button", { name: "이전", exact: true }).click();
    await expect(beaded).toHaveAttribute("aria-pressed", "true");
    await expect(chiffon).toHaveAttribute("aria-pressed", "true");
    await expect(thigh).toHaveAttribute("aria-pressed", "true");
  });

  await expect
    .poll(async () => {
      const [dress] = await saved(page);
      return [dress.upperFabric, dress.lowerFabric, dress.lowerFabricStart];
    })
    .toEqual(["subtleBeaded", "organzaChiffon", "thigh"]);
  await page.reload();
  await next.click();
  await expect(beaded).toHaveAttribute("aria-pressed", "true");
  await expect(chiffon).toHaveAttribute("aria-pressed", "true");
  await expect(thigh).toHaveAttribute("aria-pressed", "true");
});

test("basic shape, neckline and sleeve keep the last selection during delayed writes", async ({
  page,
}) => {
  await start(page);
  const button = (name: string | RegExp) =>
    page.getByRole("button", { name, exact: typeof name === "string" });
  await expect(button(/^A라인/)).toBeVisible();
  await withDressWritesDelayed(page, async () => {
    await button(/^A라인/).click();
    await expect(button(/^머메이드/)).toBeEnabled({ timeout: 3000 });
    await button(/^머메이드/).click();
    await expect(button(/^머메이드/)).toHaveAttribute("aria-pressed", "true");
    await button("다음").click();
    await button(/^레이스/).click();
    await button("다음").click();
    await selectUpperChoices(page, /^브이넥/, /^가는 끈/);
    await selectUpperChoices(page, /^사각 목선/, /^끈 없음/);
    await button("이전").click();
    await button("다음").click();
    await expect(button(/^사각 목선/)).toHaveAttribute("aria-pressed", "true");
    await expect(button(/^끈 없음/)).toHaveAttribute("aria-pressed", "true");
    await button("자세히 기록").click();
    await button(/^브이넥/).click();
    await button("기록으로 돌아가기").click();
    await expect(button(/^브이넥/)).toHaveAttribute("aria-pressed", "true");
  });
  await button("기록 완료하고 보기").click();
  await expect(page).toHaveURL(/view=record/);
  await page.reload();
  await expect
    .poll(async () => (await saved(page))[0])
    .toMatchObject({
      silhouette: "mermaid",
      fabric: "lace",
      neckline: "v",
      topStyle: "strapless",
    });
});

test("details, feedback and neckline adjustment keep rapid choices during delayed writes", async ({
  page,
}) => {
  await start(page);
  const button = (name: string | RegExp) =>
    page.getByRole("button", { name, exact: typeof name === "string" });
  await button(/^A라인/).click();
  await button("다음").click();
  await button(/^레이스/).click();
  await button("다음").click();
  await selectUpperChoices(page, /^일자 가슴선/, /^끈 없음/);
  await button("기록 완료하고 보기").click();
  await expect(page).toHaveURL(/view=record/);
  await button("자세히 기록").click();
  await expect(
    page.getByRole("heading", { name: "장식과 세부 특징" }),
  ).toBeVisible();
  await withDressWritesDelayed(page, async () => {
    await button(/^진주 장식/).click();
    await expect(button(/^스팽글/)).toBeEnabled({ timeout: 3000 });
    await button(/^스팽글/).click();
    await button(/^꽃 장식/).click();
    await button(/^진주 장식/).click();
    await expect(button(/^스팽글/)).toHaveAttribute("aria-pressed", "true");
    await expect(button(/^꽃 장식/)).toHaveAttribute("aria-pressed", "true");
    const favorite = button("후보");
    await favorite.click();
    await expect(favorite).toHaveAttribute("aria-pressed", "true");
    await favorite.click();
    await expect(favorite).toHaveAttribute("aria-pressed", "false");
    await button("신부 픽").click();
    await button("상체 예쁨").click();
    await button("허리 예쁨").click();
    await button("신부 픽").click();
    await expect(button("상체 예쁨")).toHaveAttribute("aria-pressed", "true");
    await expect(button("허리 예쁨")).toHaveAttribute("aria-pressed", "true");
    await expect(button("신부 픽")).toHaveAttribute("aria-pressed", "false");
    await button("2점").click();
    await button("5점").click();
    await expect(button("5점")).toHaveAttribute("aria-pressed", "true");
    await button(/^가슴 아래 허리선/).click();
    await button(/^골반 쪽 허리선/).click();
    await expect(button(/^골반 쪽 허리선/)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await button("기록으로 돌아가기").click();
    await expect(button("목·가슴선 수정")).toBeVisible();
    await button("목·가슴선 수정").click();
    await expect(
      page.getByRole("heading", { name: "목·가슴선 수정" }),
    ).toBeVisible();
    await button(/^브이넥/).click();
    await expect(button(/^둥근 목선/)).toBeEnabled({ timeout: 3000 });
    await button(/^둥근 목선/).click();
    await expect(button(/^둥근 목선/)).toHaveAttribute("aria-pressed", "true");
    await button("기록으로 돌아가기").click();
    await expect(
      page.getByRole("definition").filter({ hasText: /^둥근 목선$/ }),
    ).toBeVisible();
  });
  await expect.poll(async () => (await saved(page))[0]?.neckline).toBe("scoop");
  await page.reload();
  await expect
    .poll(async () => (await saved(page))[0])
    .toMatchObject({
      neckline: "scoop",
      waistline: "drop",
      details: ["sequin", "floral"],
      isFavorite: false,
      quickTags: ["상체 예쁨", "허리 예쁨"],
      rating: 5,
    });
});

async function drawOnSketch(
  page: Page,
  surface: Locator,
  points: number[][],
  touch: boolean,
) {
  await surface.scrollIntoViewIfNeeded();
  const screenPoints = await surface.evaluate((node, coordinates) => {
    const svg = node as SVGSVGElement;
    const box = svg.viewBox.baseVal;
    const transform = svg.getScreenCTM()!;
    return coordinates.map(([x, y]) => {
      const point = new DOMPoint(
        box.x + x * box.width,
        box.y + y * box.height,
      ).matrixTransform(transform);
      return { x: point.x, y: point.y };
    });
  }, points);
  if (touch) {
    const session = await page.context().newCDPSession(page);
    try {
      for (const [i, point] of screenPoints.entries()) {
        await session.send("Input.dispatchTouchEvent", {
          type: i === 0 ? "touchStart" : "touchMove",
          touchPoints: [point],
        });
      }
      await session.send("Input.dispatchTouchEvent", {
        type: "touchEnd",
        touchPoints: [],
      });
    } finally {
      await session.detach();
    }
    return;
  }
  await page.mouse.move(screenPoints[0].x, screenPoints[0].y);
  await page.mouse.down();
  for (const point of screenPoints.slice(1))
    await page.mouse.move(point.x, point.y);
  await page.mouse.up();
}

for (const width of [320, 390]) {
  test(`pen width, undo and portable drawing on the finished dress at ${width}px`, async ({
    page,
    browserName,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await start(page);
    await page.getByRole("button", { name: /^머메이드/ }).click();
    await page.getByRole("button", { name: "다음", exact: true }).click();
    await page.getByRole("button", { name: /^레이스/ }).click();
    await page.getByRole("button", { name: "다음", exact: true }).click();
    await selectUpperChoices(page, "일자 가슴선", "어깨 감쌈");
    const previewButton = page.getByRole("button", {
      name: "미리보기",
      exact: true,
    });
    await previewButton.click();
    await expect(
      page.getByRole("button", { name: "그림에 표시하기" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "미리보기 닫기" }).click();
    await page.getByRole("button", { name: "기록 완료하고 보기" }).click();
    await expect(page).toHaveURL(/view=record/);
    await previewButton.click();
    const preview = page.getByRole("dialog", { name: "드레스 미리보기" });
    const openEditor = preview.getByRole("button", { name: "그림에 표시하기" });
    await openEditor.click();
    const editor = page.getByRole("dialog", { name: "그림에 표시하기" });
    const surface = editor.getByLabel("그림에 표시할 영역", { exact: true });
    const draw = (points: number[][]) =>
      drawOnSketch(page, surface, points, browserName === "chromium");
    const undo = editor.getByRole("button", { name: "되돌리기" });
    await expect(undo).toBeDisabled();
    await editor.getByRole("button", { name: "가늘게" }).click();
    await draw([
      [0.43, 0.48],
      [0.44, 0.54],
      [0.43, 0.57],
      [0.42, 0.62],
    ]);
    await expect(undo).toBeEnabled();
    await editor.getByRole("button", { name: "굵게" }).click();
    await draw([
      [0.54, 0.43],
      [0.55, 0.47],
      [0.54, 0.5],
    ]);
    await expect(undo).toBeEnabled();
    await undo.click();
    await expect(undo).toBeEnabled();
    await draw([
      [0.47, 0.49],
      [0.48, 0.53],
      [0.47, 0.55],
    ]);
    const screenshot = testInfo.outputPath("pen-width-preview.png");
    await editor.screenshot({ path: screenshot });
    await testInfo.attach("pen-width-preview", {
      path: screenshot,
      contentType: "image/png",
    });
    await editor.getByRole("button", { name: "표시 저장" }).click();
    await expect(preview).toBeVisible();
    const renderedInk = preview.locator('[data-layer="sketch-ink"] path');
    await expect(renderedInk).toHaveCount(2);
    await expect(renderedInk.nth(0)).toHaveAttribute("stroke-width", "1");
    await expect(renderedInk.nth(1)).toHaveAttribute("stroke-width", "4");
    const savedPath = await renderedInk.nth(1).getAttribute("d");
    const [original] = await saved(page);
    expect(original.sketchStrokes?.map((stroke) => stroke.width)).toEqual([
      1, 4,
    ]);
    const marks = original.sketchStrokes!;
    expect(marks[0].points[0][0]).toBeCloseTo(0.43, 2);
    expect(marks[0].points[0][1]).toBeCloseTo(0.48, 2);
    expect(marks[1].points[0][0]).toBeCloseTo(0.47, 2);
    await openEditor.click();
    await expect(undo).toBeEnabled();
    await undo.click();
    await editor.getByRole("button", { name: "취소", exact: true }).click();
    await page.reload();
    await expect(previewButton).toBeVisible();
    expect((await saved(page))[0].sketchStrokes).toEqual(marks);
    if (width === 320) return;
    await page.goto(`/tour/${original.tourId}/export`);
    await page.getByRole("button", { name: "백업용 PDF 만들기" }).click();
    await expect(page.getByText("PDF가 준비됐어요.")).toBeVisible({
      timeout: 40000,
    });
    const downloading = page.waitForEvent("download");
    await page.getByRole("button", { name: "저장", exact: true }).click();
    const path = testInfo.outputPath("pen-drawing.pdf");
    await (await downloading).saveAs(path);
    await page.goto("/import");
    await page.locator('input[type="file"]').setInputFiles(path);
    await page.getByRole("button", { name: "새 투어로 추가" }).click();
    await expect(page).toHaveURL(/\/tour\/[^/]+$/);
    const copy = (await saved(page)).find((d) => d.id !== original.id)!;
    expect(copy.sketchStrokes).toEqual(marks);
    await page.goto(`/tour/${copy.tourId}/dress/${copy.id}?view=record`);
    await previewButton.click();
    await expect(renderedInk).toHaveCount(2);
    await expect(renderedInk.nth(1)).toHaveAttribute("d", savedPath!);
    await openEditor.click();
    await expect(undo).toBeEnabled();
  });
}
