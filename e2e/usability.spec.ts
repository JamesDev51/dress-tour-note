import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const tinyPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8Dwn4GBgYGJAQoAHQkCAWJ6+ygAAAAASUVORK5CYII=",
  "base64",
);
const evidenceRoot = ".omo/evidence/task-11-e2e-release-qa/manual";

async function captureSurface(page: Page, name: string) {
  await page.evaluate(async () => document.fonts.ready);
  await page.screenshot({
    path: `${evidenceRoot}/${name}.png`,
    fullPage: true,
  });
}

async function settleOptionArtwork(page: Page) {
  const images = page.locator("[data-option-artwork] img");
  for (let index = 0; index < (await images.count()); index += 1) {
    const image = images.nth(index);
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate(
          (element) => element instanceof HTMLImageElement && element.complete,
        ),
      )
      .toBe(true);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
}

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
    "mermaid",
    "empire",
    "fitAndFlare",
    "sheath",
    "teaLength",
  ].map((id) => `/assets/options/silhouette/${id}.webp`),
  ...[
    "mikadoSatin",
    "lace",
    "organzaChiffon",
    "subtleBeaded",
    "ornateBeaded",
    "tulle",
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

async function expectNoSeriousAccessibilityViolations(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa"])
    .analyze();
  const violations = result.violations
    .filter((item) => item.impact === "serious" || item.impact === "critical")
    .map(
      (item) =>
        `${item.id}: ${item.help}; targets=${item.nodes.map((node) => node.target.join(" ")).join(" | ")}`,
    );
  expect(violations).toEqual([]);
}

async function createBaseTour(
  page: Page,
  options: { two?: boolean; face?: boolean } = {},
) {
  await page.goto("/");
  await page.getByRole("link", { name: /새 투어 시작/ }).click();
  await page.getByPlaceholder("예: 히똥").fill("사용성 신부");
  await page
    .getByPlaceholder("비워두면 자동으로 만들어요")
    .fill("사용성 테스트 투어");
  await page.getByRole("button", { name: "투어 만들기", exact: true }).click();
  await expect(page).not.toHaveURL(/\/tour\/new$/);
  await expect(page).toHaveURL(/\/tour\/[^/]+$/);
  const match = page.url().match(/\/tour\/([^/?#]+)/);
  if (!match) throw new Error("tour id missing");
  const tourId = match[1];
  await page.getByRole("button", { name: /샵 추가/ }).click();
  await page.getByPlaceholder("드레스샵 이름").fill("사용성 브라이덜");
  await page.getByRole("button", { name: "추가하기", exact: true }).click();
  await page
    .getByRole("button", { name: "사용성 브라이덜 열기", exact: true })
    .click();
  await page.getByRole("button", { name: "드레스 추가", exact: true }).click();
  await completeCore(page, {
    top: /오프숄더/,
    neckline: /하트형/,
    silhouette: /A라인/,
    candidate: "후보로 남기기",
  });
  if (options.face) {
    await page.getByRole("button", { name: "상세 기록", exact: true }).click();
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
  if (options.two) {
    await page
      .getByRole("button", { name: "다음 드레스 기록", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: /어깨\/상의는 어땠나요/ }),
    ).toBeVisible();
    await expect(
      page.locator('[data-option-category="top"] [aria-pressed="true"]'),
    ).toHaveCount(0);
    await completeCore(page, {
      top: /스트랩리스|끈 없음/,
      neckline: /스트레이트 네크라인|일자 네크라인/,
      silhouette: /머메이드/,
      candidate: "후보 아님",
    });
  }
  return tourId;
}

async function chooseCoreOption(page: Page, name: RegExp | string) {
  const option = page.getByRole("button", { name }).first();
  await option.click();
  await expect(option).toHaveAttribute("aria-pressed", "true");
  await expect(option).toBeEnabled();
}

async function nextCoreStep(page: Page) {
  const next = page.getByRole("button", { name: /^다음$/ });
  await expect(next).toBeEnabled();
  await next.click();
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

async function completeCore(
  page: Page,
  choices: {
    top: RegExp | string;
    neckline: RegExp | string;
    silhouette: RegExp | string;
    candidate: "후보로 남기기" | "후보 아님";
  },
) {
  await chooseCoreOption(page, choices.top);
  await nextCoreStep(page);
  await chooseCoreOption(page, choices.neckline);
  await nextCoreStep(page);
  await chooseCoreOption(page, choices.silhouette);
  await nextCoreStep(page);
  await chooseCoreOption(page, choices.candidate);
}

test("first-time flow accepts optional tour fields", async ({ page }) => {
  await page.goto("/tour/new");
  await expect(
    page.getByRole("heading", { name: /오늘 기록을/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "투어 만들기", exact: true }).click();
  await expect(page).toHaveURL(/\/tour\/[^/]+$/);
  await expect(page.locator('input[value="드레스 투어"]')).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);
});

test("mobile pages do not overflow horizontally at supported boundary widths", async ({
  page,
}) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto("http://127.0.0.1:4173");
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await captureSurface(page, `home-${width}`);
  }
});

test("all individual WebP artwork is available and option cards use it", async ({
  page,
}) => {
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

  await createBaseTour(page);
  await page.getByRole("button", { name: "상세 기록", exact: true }).click();
  await expect(
    page.locator('[data-option-art-kind="generated-image"] img'),
  ).toHaveCount(61);
  await expect(
    page.locator('[data-option-art="top-offShoulder"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-option-art="silhouette-aLine"]'),
  ).toBeVisible();
  await expect(page.locator('[data-option-art="color-ivory"]')).toBeVisible();
});

test("missing-record routes fail safely instead of leaving a blank screen", async ({
  page,
}) => {
  await page.goto("/tour/not-found");
  await expect(page.getByText("기록을 불러오는 중...")).toBeVisible();
  await page.goto("/tour/not-found/export");
  await expect(page.getByRole("alert")).toContainText(
    "투어 기록을 찾을 수 없어요.",
  );
  await page.getByRole("button", { name: /다시 불러오기/ }).click();
  await expect(page.getByRole("alert")).toBeVisible();
});

test("privacy keeps local data controls without display settings", async ({
  page,
}) => {
  await page.goto("/privacy");
  await expect(page.getByText("화면 테마")).toHaveCount(0);
  await expect(page.getByText("글꼴")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "설정" })).toHaveCount(0);
  await expect(page.getByText("기록은 내 기기에만")).toBeVisible();
  const shellStyle = await page.locator(".app-shell").evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    font: getComputedStyle(element).fontFamily,
  }));
  expect(shellStyle.background).toBe("rgb(255, 255, 255)");
  expect(shellStyle.font).toContain("Pretendard");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /전체 데이터 삭제/ }).click();
  await expect(page).toHaveURL("/");
});

test("candidate filter never blocks choosing two dresses for comparison", async ({
  page,
}) => {
  const tourId = await createBaseTour(page, { two: true });
  await page.goto(`/tour/${tourId}/review`);
  await expect(
    page.getByText("사용성 테스트 투어", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /^후보 1$/ }).click();
  await page.getByRole("button", { name: "2벌 비교" }).click();
  await expect(page.getByText(/비교할 드레스 2벌/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Dress 01/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Dress 02/ })).toBeVisible();
});

test("editor choices remain independent across the 320 and 390px boundaries", async ({
  page,
}) => {
  await createBaseTour(page);
  const editorUrl = page.url();
  await page.reload();
  await page.getByRole("button", { name: "핵심 기록 수정" }).click();
  await page.getByRole("button", { name: /끈 있는 형태/ }).click();
  await expect(
    page.getByRole("button", { name: /끈 있는 형태/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await nextCoreStep(page);
  await page.getByRole("button", { name: /브이넥/ }).click();
  await expect(page.getByRole("button", { name: /브이넥/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(editorUrl);
    await page.getByRole("button", { name: "핵심 기록 수정" }).click();
    await expect(
      page.getByRole("button", { name: /끈 있는 형태/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await nextCoreStep(page);
    await expect(page.getByRole("button", { name: /브이넥/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
    await captureSurface(page, `editor-neckline-${width}`);
  }
});

test("invalid import file returns an actionable error", async ({ page }) => {
  await page.goto("/import");
  await page.locator('input[type="file"]').setInputFiles({
    name: "not-a-pdf.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("not a pdf"),
  });
  await expect(page.getByRole("status")).toContainText("PDF 파일이 아니에요.");
  await expect(page.getByText(/다시 선택/)).toBeVisible();
});

test("last face position survives immediate navigation away", async ({
  page,
}) => {
  const tourId = await createBaseTour(page, { face: true });
  const dressUrl = page.url();
  await page.getByLabel("좌우").fill("0.73");
  await page.getByLabel("뒤로").click();
  await expect(page).toHaveURL(new RegExp(`/tour/${tourId}/shop/`));
  await page.goto(dressUrl);
  await page.getByRole("button", { name: "상세 기록", exact: true }).click();
  await expect(page.getByLabel("좌우")).toHaveValue("0.73");
});

test("bad compare URL recovers safely and recent tour deletion works", async ({
  page,
}) => {
  const tourId = await createBaseTour(page);
  await page.goto(`/tour/${tourId}/compare?a=bad&b=bad2`);
  await expect(
    page.getByText("선택한 드레스 기록을 찾을 수 없어요."),
  ).toBeVisible();
  await page.goto("/");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /사용성 테스트 투어 삭제/ }).click();
  await expect(
    page.getByText("아직 저장된 드레스투어가 없어요."),
  ).toBeVisible();
});

test("three warmed core records stay functional while reporting timing", async ({
  page,
}) => {
  await createBaseTour(page);
  await page
    .getByRole("button", { name: "다음 드레스 기록", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: /어깨\/상의는 어땠나요/ }),
  ).toBeVisible();
  const samplesMs: number[] = [];
  for (let index = 0; index < 3; index += 1) {
    const startedAt = Date.now();
    await expect(
      page.locator('[data-option-category="top"] [aria-pressed="true"]'),
    ).toHaveCount(0);
    if (index === 0 && process.env.CORE_TIMING_DELAY === "1") {
      await page.waitForTimeout(40_000);
    }
    await completeCore(page, {
      top: /오프숄더/,
      neckline: /하트형/,
      silhouette: /A라인/,
      candidate: "후보 아님",
    });
    const completedDressUrl = page.url();
    const nextDress = page.getByRole("button", {
      name: "다음 드레스 기록",
      exact: true,
    });
    await expect(nextDress).toHaveCount(1);
    await expect(nextDress).toBeEnabled();
    await nextDress.click();
    await expect(
      page.getByRole("heading", { name: /어깨\/상의는 어땠나요/ }),
    ).toBeVisible();
    const elapsedMs = Date.now() - startedAt;
    samplesMs.push(elapsedMs);
    console.log(`[core-timing] run=${index + 1} elapsedMs=${elapsedMs}`);
    const readyDressUrl = page.url();
    await page.goto(completedDressUrl);
    await expect(
      page.getByRole("heading", { name: "핵심 기록" }),
    ).toBeVisible();
    const summary = page
      .getByRole("heading", { name: "핵심 기록" })
      .locator("..");
    await expect(summary.locator("dd")).toHaveText([
      "오프숄더",
      "스위트하트 네크라인",
      "A라인",
      "후보 아님",
    ]);
    await page.goto(readyDressUrl);
    await expect(
      page.getByRole("heading", { name: /어깨\/상의는 어땠나요/ }),
    ).toBeVisible();
  }
  const medianMs = [...samplesMs].sort((left, right) => left - right)[1];
  console.log(
    `[core-timing-summary] samplesMs=${samplesMs.join(",")} medianMs=${medianMs} targetMs=30000 observational=true`,
  );
});

test("all unknown core choices persist as deliberate decisions on re-entry", async ({
  page,
}) => {
  await createBaseTour(page);
  await page
    .getByRole("button", { name: "다음 드레스 기록", exact: true })
    .click();
  await completeCore(page, {
    top: "기억 안 남",
    neckline: "기억 안 남",
    silhouette: "기억 안 남",
    candidate: "후보 아님",
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "핵심 기록" })).toBeVisible();
  await expect(page.getByText("기억 안 남", { exact: true })).toHaveCount(3);
  await page.getByRole("button", { name: "핵심 기록 수정" }).click();
  await expect(
    page.getByRole("button", { name: "기억 안 남" }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("each core field survives immediate next, back, and reload", async ({
  page,
}) => {
  await createBaseTour(page);
  await page
    .getByRole("button", { name: "다음 드레스 기록", exact: true })
    .click();
  await chooseCoreOption(page, /스트랩리스/);
  await nextCoreStep(page);
  await page.getByRole("button", { name: "이전" }).click();
  await expect(
    page.getByRole("button", { name: /스트랩리스/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await nextCoreStep(page);
  await chooseCoreOption(page, /브이넥/);
  await nextCoreStep(page);
  await page.reload();
  await nextCoreStep(page);
  await expect(page.getByRole("button", { name: /브이넥/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await nextCoreStep(page);
  await chooseCoreOption(page, /머메이드/);
  await page.reload();
  await nextCoreStep(page);
  await nextCoreStep(page);
  await expect(page.getByRole("button", { name: /머메이드/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});

test("all nine detail categories and closest-choice notes persist", async ({
  page,
}) => {
  await createBaseTour(page);
  await page.getByRole("button", { name: "상세 기록", exact: true }).click();
  for (const heading of [
    "어깨/상의",
    "네크라인",
    "실루엣",
    "소재",
    "색상",
    "허리선",
    "등 디자인",
    "트레인",
    "디테일",
  ]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
  await page
    .getByRole("button", { name: /비슷하지만 달라요 · 상의 디자인/ })
    .click();
  await page
    .getByLabel("상의 디자인에서 다른 점")
    .fill("소매가 팔꿈치까지 내려오는 가장 가까운 선택");
  await page.getByLabel("상의 디자인에서 다른 점").blur();
  await chooseCoreOption(page, /미카도 새틴/);
  await chooseCoreOption(page, /샴페인/);
  await chooseCoreOption(page, /내추럴 웨이스트/);
  await chooseCoreOption(page, /오픈 백/);
  await chooseCoreOption(page, /채플 트레인/);
  await chooseCoreOption(page, /^코르셋 몸통/);
  await page.getByRole("button", { name: "신부 픽" }).click();
  await expect(page.getByRole("button", { name: "신부 픽" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.reload();
  await page.getByRole("button", { name: "상세 기록", exact: true }).click();
  await settleOptionArtwork(page);
  await expect(page.getByLabel("상의 디자인에서 다른 점")).toHaveValue(
    "소매가 팔꿈치까지 내려오는 가장 가까운 선택",
  );
  await expect(
    page.getByRole("button", { name: /^코르셋 몸통/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await captureSurface(page, "details-nine-categories-390");
});

test.describe("option artwork failure", () => {
  test.use({ serviceWorkers: "block" });

  test("exposes a readable fallback after a real 404", async ({ page }) => {
    await page.route("**/assets/options/top/offShoulder.webp", (route) =>
      route.fulfill({ status: 404, body: "missing" }),
    );
    await createBaseTour(page);
    await page.reload();
    await page.getByRole("button", { name: "핵심 기록 수정" }).click();
    const artwork = page.locator('[data-option-art="top-offShoulder"]');
    await expect(artwork).toHaveAttribute(
      "data-option-art-kind",
      "image-error",
    );
    await expect(artwork).toContainText("이미지를 불러오지 못했어요.");
  });
});

test("offline app opens, edits, reloads, and compares saved dresses", async ({
  page,
}) => {
  const tourId = await createBaseTour(page, { two: true });
  await page.evaluate(async () => navigator.serviceWorker.ready);
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))))
    await page.reload();
  await page.context().setOffline(true);
  await page.getByRole("button", { name: "5점" }).click();
  await expect(page.getByRole("button", { name: "5점" })).toHaveClass(
    /text-amber-400/,
  );
  await page.reload();
  await page.getByRole("button", { name: "상세 기록", exact: true }).click();
  await expect(page.getByRole("button", { name: "5점" })).toHaveClass(
    /text-amber-400/,
  );
  await page.goto(`/tour/${tourId}/review`);
  await page.getByRole("button", { name: "2벌 비교" }).click();
  await page.getByRole("button", { name: /Dress 01/ }).click();
  await page.getByRole("button", { name: /Dress 02/ }).click();
  await page.getByRole("button", { name: /선택한 2벌 비교하기/ }).click();
  await expect(page.getByRole("heading", { name: /두 벌을/ })).toBeVisible();
  await captureSurface(page, "offline-compare-390");
  await page.context().setOffline(false);
});

test("editor, details, review, compare, import, and export have no serious axe violations", async ({
  page,
}) => {
  const tourId = await createBaseTour(page, { two: true });
  const editorUrl = page.url();
  await expectNoSeriousAccessibilityViolations(page);
  await captureSurface(page, "axe-editor-390");
  await page.getByRole("button", { name: "상세 기록", exact: true }).click();
  await settleOptionArtwork(page);
  await expectNoSeriousAccessibilityViolations(page);
  await captureSurface(page, "axe-details-390");
  await page.goto(`/tour/${tourId}/review`);
  await expectNoSeriousAccessibilityViolations(page);
  await captureSurface(page, "axe-review-390");
  await page.getByRole("button", { name: "2벌 비교" }).click();
  await page.getByRole("button", { name: /Dress 01/ }).click();
  await page.getByRole("button", { name: /Dress 02/ }).click();
  await page.getByRole("button", { name: /선택한 2벌 비교하기/ }).click();
  const compareUrl = page.url();
  await expectNoSeriousAccessibilityViolations(page);
  await captureSurface(page, "axe-compare-390");
  await page.goto("/import");
  await expect(
    page.getByRole("heading", { name: /다른 폰의 기록을/ }),
  ).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);
  await captureSurface(page, "axe-import-390");
  await page.goto(`/tour/${tourId}/export`);
  await expect(page.getByText("저장할 PDF를", { exact: false })).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);
  await captureSurface(page, "axe-export-390");
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(editorUrl);
    await expectNoHorizontalOverflow(page);
    await page.getByRole("button", { name: "상세 기록", exact: true }).click();
    await settleOptionArtwork(page);
    await expectNoHorizontalOverflow(page);
    await page.goto(`/tour/${tourId}/review`);
    await expectNoHorizontalOverflow(page);
    await page.goto(compareUrl);
    await expectNoHorizontalOverflow(page);
    await page.goto("/import");
    await expect(
      page.getByRole("heading", { name: /다른 폰의 기록을/ }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.goto(`/tour/${tourId}/export`);
    await expect(
      page.getByText("저장할 PDF를", { exact: false }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});
