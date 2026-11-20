import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { chooseUpper } from "./helpers/selectUpper";

const evidenceRoot =
  ".reviews/2026-11-01-remove-comparison/usability-browser/surfaces";

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

async function createBaseTour(page: Page, options: { two?: boolean } = {}) {
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
  await expect(page).toHaveURL(/\/shop\/[^/]+$/);
  await page.getByRole("button", { name: "드레스 추가", exact: true }).click();
  await completeCore(page, {
    upper: /어깨 감쌈 · 하트 가슴선/,
    fabric: /레이스/,
    silhouette: /A라인/,
    candidate: true,
  });
  if (options.two) {
    await page
      .getByRole("button", { name: "다음 드레스 기록", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: /전체 모양은 어땠나요/ }),
    ).toBeVisible();
    await expect(
      page.locator('[data-fast-record-options] [aria-pressed="true"]'),
    ).toHaveCount(0);
    await completeCore(page, {
      upper: /끈 없음 · 일자 가슴선/,
      fabric: /실크/,
      silhouette: /머메이드/,
      candidate: false,
    });
  }
  return tourId;
}

async function chooseCoreOption(page: Page, name: RegExp | string) {
  if ((typeof name === "string" ? name : name.source).includes(" · ")) {
    await chooseUpper(page, name);
    return;
  }
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
    upper: RegExp | string;
    fabric: RegExp | string;
    silhouette: RegExp | string;
    candidate: boolean;
  },
) {
  await chooseCoreOption(page, choices.silhouette);
  await nextCoreStep(page);
  await chooseCoreOption(page, choices.fabric);
  await nextCoreStep(page);
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
    await page.goto("/");
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
  expect(assets).toHaveLength(61);
  expect(
    assets.every(
      (asset) => asset.ok && asset.contentType?.includes("image/webp"),
    ),
  ).toBe(true);

  await createBaseTour(page);
  await page.getByRole("button", { name: "자세히 기록", exact: true }).click();
  await expect(
    page.locator(
      '[data-option-category] [data-option-art-kind="generated-image"] img',
    ),
  ).toHaveCount(44); // Only current structural/material/detail choices are presented.
  await expect(
    page.locator('[data-option-art="top-offShoulder"]'),
  ).toBeVisible();
  await expect(
    page.locator('[data-option-art="silhouette-aLine"]'),
  ).toBeVisible();
  for (const category of ["color", "backStyle", "train"])
    await expect(
      page.locator(`[data-option-category="${category}"]`),
    ).toHaveCount(0);
  await expect(
    page.locator('[data-option-art="details-detachableSleeve"]'),
  ).toHaveCount(0);
  await expect(page.locator('[data-option-art="fabric-tulle"]')).toHaveCount(0);
  await expect(
    page.locator('[data-option-art="fabric-organzaChiffon"]'),
  ).toBeVisible();
});

test("missing-record routes fail safely instead of leaving a blank screen", async ({
  page,
}) => {
  const missingRoutes = [
    {
      path: "/tour/not-found",
      heading: "투어 기록을 찾을 수 없어요.",
      role: "link" as const,
      action: "홈에서 기록 찾기",
      target: "/",
    },
    {
      path: "/tour/not-found/shop/not-found",
      heading: "드레스샵 기록을 찾을 수 없어요.",
      role: "button" as const,
      action: "홈에서 기록 찾기",
      target: "/",
    },
    {
      path: "/tour/not-found/dress/not-found",
      heading: "기록을 찾을 수 없어요",
      role: "link" as const,
      action: "투어로 돌아가기",
      target: "/tour/not-found",
    },
    {
      path: "/tour/not-found/review",
      heading: "기록을 찾을 수 없어요",
      role: "link" as const,
      action: "홈으로 돌아가기",
      target: "/",
    },
  ];
  for (const route of missingRoutes) {
    await page.goto(route.path);
    await expect(
      page.getByRole("heading", { name: route.heading, exact: true }),
    ).toBeVisible();
    await expect(page.getByText(/불러오는 중/)).toHaveCount(0);
    await page
      .getByRole(route.role, { name: route.action, exact: true })
      .click();
    await expect(page).toHaveURL(route.target);
  }
  await page.goto("/tour/not-found/export");
  await expect(page.getByRole("alert")).toContainText(
    "이 브라우저에서 투어 기록을 찾을 수 없어요.",
  );
  await page.getByRole("button", { name: /다시 불러오기/ }).click();
  await expect(page.getByRole("alert")).toBeVisible();
});

test("older tours stay reachable after the first five recent records", async ({
  page,
}) => {
  const tourUrls: string[] = [];
  for (let index = 1; index <= 6; index += 1) {
    await page.goto("/tour/new");
    await page
      .getByPlaceholder("비워두면 자동으로 만들어요")
      .fill(`기록 접근 ${index}`);
    await page
      .getByRole("button", { name: "투어 만들기", exact: true })
      .click();
    await expect(page).toHaveURL(/\/tour\/[a-f0-9-]{36}$/);
    await expect(page.getByRole("textbox", { name: "투어 제목" })).toHaveValue(
      `기록 접근 ${index}`,
    );
    tourUrls.push(page.url());
  }
  await page.goto("/");
  await expect(page.getByText("기록 접근 6", { exact: true })).toBeVisible();
  await expect(page.getByText("기록 접근 1", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: /이전 기록 더 보기/ }).click();
  await page.getByText("기록 접근 1", { exact: true }).click();
  await expect(page).toHaveURL(tourUrls[0]!);
  await expect(page.getByRole("textbox", { name: "투어 제목" })).toHaveValue(
    "기록 접근 1",
  );
});

test("shop action targets keep their mobile size without horizontal overflow", async ({
  page,
}) => {
  await createBaseTour(page, { two: true });
  await page.getByRole("button", { name: "뒤로", exact: true }).click();
  await expect(page).toHaveURL(/\/shop\//);
  await expect(page.locator("article").first()).toBeVisible();
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    const dimensions = await page
      .locator("article")
      .first()
      .getByRole("button")
      .evaluateAll((buttons) =>
        buttons.map((button) => {
          const rect = button.getBoundingClientRect();
          return {
            label: button.getAttribute("aria-label"),
            width: rect.width,
            height: rect.height,
          };
        }),
      );
    expect(dimensions.length).toBeGreaterThanOrEqual(7);
    for (const target of dimensions) {
      expect(
        target.width,
        `${target.label} width at ${width}px`,
      ).toBeGreaterThanOrEqual(44);
      expect(
        target.height,
        `${target.label} height at ${width}px`,
      ).toBeGreaterThanOrEqual(44);
    }
    const nameHeight = await page
      .getByRole("textbox", { name: "드레스샵 이름" })
      .evaluate((input) => input.getBoundingClientRect().height);
    expect(nameHeight).toBeGreaterThanOrEqual(44);
    await expectNoHorizontalOverflow(page);
    await captureSurface(page, `shop-touch-targets-${width}`);
  }
});

test("privacy keeps local data controls without display settings", async ({
  page,
}) => {
  await page.goto("/privacy");
  await expect(page.getByText("화면 테마")).toHaveCount(0);
  await expect(page.getByText("글꼴")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "설정" })).toHaveCount(0);
  await expect(page.getByText("기록은 내 브라우저에")).toBeVisible();
  const shellStyle = await page.locator(".app-shell").evaluate((element) => ({
    background: getComputedStyle(element).backgroundColor,
    font: getComputedStyle(element).fontFamily,
  }));
  expect(shellStyle.background).toBe("rgb(250, 248, 244)");
  expect(shellStyle.font).toContain("Pretendard");
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: /기록 전체 삭제/ }).click();
  await expect(page).toHaveURL("/");
});

test("candidate filter opens individual records and keeps PDF access without comparison", async ({
  page,
}) => {
  const tourId = await createBaseTour(page, { two: true });
  await page.goto(`/tour/${tourId}/review`);
  await expect(
    page.getByText("사용성 테스트 투어", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /비교/ })).toHaveCount(0);
  await page.getByRole("button", { name: /^후보 1$/ }).click();
  await expect(page.getByRole("button", { name: /^후보 1$/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByRole("button", { name: /드레스 01/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /드레스 02/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "PDF 만들기" })).toBeVisible();
  await page.getByRole("button", { name: /드레스 01/ }).click();
  await expect(page).toHaveURL(/view=record/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("드레스 01");
  await page.goto(`/tour/${tourId}/review`);
  await page.getByRole("button", { name: /^전체 2$/ }).click();
  await expect(page.getByRole("button", { name: /드레스 02/ })).toBeVisible();
  await page.getByRole("button", { name: /드레스 02/ }).click();
  await expect(page).toHaveURL(/view=record/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("드레스 02");
});

test("editor choices remain independent across the 320 and 390px boundaries", async ({
  page,
}) => {
  await createBaseTour(page);
  const editorUrl = page.url();
  await page.getByRole("button", { name: "끈·소매 수정", exact: true }).click();
  await chooseCoreOption(page, /^일반 끈/);
  await page
    .getByRole("button", { name: "기록으로 돌아가기", exact: true })
    .click();
  await page
    .getByRole("button", { name: "목·가슴선 수정", exact: true })
    .click();
  await chooseCoreOption(page, /브이넥/);
  await page
    .getByRole("button", { name: "기록으로 돌아가기", exact: true })
    .click();
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(editorUrl);
    await page
      .getByRole("button", { name: "끈·소매 수정", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: /^일반 끈/ }),
    ).toHaveAttribute("aria-pressed", "true");
    await expectNoHorizontalOverflow(page);
    await page
      .getByRole("button", { name: "기록으로 돌아가기", exact: true })
      .click();
    await page
      .getByRole("button", { name: "목·가슴선 수정", exact: true })
      .click();
    await expect(page.getByRole("button", { name: /브이넥/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expectNoHorizontalOverflow(page);
    await captureSurface(page, `editor-neckline-${width}`);
    await page
      .getByRole("button", { name: "기록으로 돌아가기", exact: true })
      .click();
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

test("mixed upper and skirt materials survive immediate navigation away", async ({
  page,
}) => {
  const tourId = await createBaseTour(page);
  const dressUrl = page.url();
  await page.getByRole("button", { name: "자세히 기록", exact: true }).click();
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
  await page.getByLabel("뒤로").click();
  await expect(page).toHaveURL(new RegExp(`/tour/${tourId}/shop/`));
  await page.goto(dressUrl);
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
});

test("obsolete comparison URL returns home and recent tour deletion works", async ({
  page,
}) => {
  const tourId = await createBaseTour(page);
  await page.goto(`/tour/${tourId}/compare?a=bad&b=bad2`);
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("link", { name: /새 투어 시작/ })).toBeVisible();
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
    page.getByRole("heading", { name: /전체 모양은 어땠나요/ }),
  ).toBeVisible();
  const samplesMs: number[] = [];
  for (let index = 0; index < 3; index += 1) {
    const startedAt = Date.now();
    await expect(
      page.locator('[data-fast-record-options] [aria-pressed="true"]'),
    ).toHaveCount(0);
    if (index === 0 && process.env.CORE_TIMING_DELAY === "1") {
      await page.waitForTimeout(40_000);
    }
    await completeCore(page, {
      upper: /어깨 감쌈 · 하트 가슴선/,
      fabric: /레이스/,
      silhouette: /A라인/,
      candidate: false,
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
      page.getByRole("heading", { name: /전체 모양은 어땠나요/ }),
    ).toBeVisible();
    const elapsedMs = Date.now() - startedAt;
    samplesMs.push(elapsedMs);
    console.log(`[core-timing] run=${index + 1} elapsedMs=${elapsedMs}`);
    const readyDressUrl = page.url();
    await page.goto(completedDressUrl);
    const summary = page
      .getByRole("heading", { name: "전체 기록", exact: true })
      .locator("..");
    await expect(summary).toBeVisible();
    for (const [label, value] of [
      ["전체 모양", "A라인"],
      ["소재", "레이스"],
      ["끈·소매", "어깨 감쌈"],
      ["목·가슴선", "하트 가슴선"],
    ]) {
      await expect(
        summary.getByText(label, { exact: true }).locator("..").locator("dd"),
      ).toHaveText(value);
    }
    await expect(
      page
        .getByRole("heading", { name: "느낌과 평가" })
        .locator("..")
        .getByText("후보 표시 없음", { exact: true }),
    ).toBeVisible();
    await page.goto(readyDressUrl);
    await expect(
      page.getByRole("heading", { name: /전체 모양은 어땠나요/ }),
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
    upper: "기억 안 남",
    fabric: "기억 안 남",
    silhouette: "기억 안 남",
    candidate: false,
  });
  await page.reload();
  const summary = page
    .getByRole("heading", { name: "전체 기록", exact: true })
    .locator("..");
  await expect(summary).toBeVisible();
  for (const label of ["전체 모양", "소재", "끈·소매", "목·가슴선"]) {
    await expect(
      summary.getByText(label, { exact: true }).locator("..").locator("dd"),
    ).toHaveText("기억 안 남");
  }
  await page.getByRole("button", { name: "기본 기록 수정" }).click();
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
  await chooseCoreOption(page, /머메이드/);
  await nextCoreStep(page);
  await page.getByRole("button", { name: "이전" }).click();
  await expect(page.getByRole("button", { name: /머메이드/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await nextCoreStep(page);
  await chooseCoreOption(page, /레이스/);
  await nextCoreStep(page);
  await page.reload();
  await expect(page.getByRole("button", { name: /머메이드/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await nextCoreStep(page);
  await expect(page.getByRole("button", { name: /레이스/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await nextCoreStep(page);
  await chooseCoreOption(page, /가는 끈 · 일자 가슴선/);
  await page.reload();
  await nextCoreStep(page);
  await nextCoreStep(page);
  await expect(
    page
      .locator('[data-option-category="neckline"]')
      .getByRole("button", { name: /^일자 가슴선/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page
      .locator('[data-option-category="top"]')
      .getByRole("button", { name: /^가는 끈/ }),
  ).toHaveAttribute("aria-pressed", "true");
});

test("active detail categories and closest-choice notes persist without retired controls", async ({
  page,
}) => {
  await createBaseTour(page);
  await page.getByRole("button", { name: "자세히 기록", exact: true }).click();
  for (const heading of [
    "끈·소매",
    "목·가슴선",
    "전체 모양",
    "소재·표면",
    "허리선",
    "장식과 세부 특징",
  ]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
  await page
    .getByRole("button", { name: /비슷하지만 달라요 · 끈·소매/ })
    .click();
  await page
    .getByLabel("끈·소매에서 다른 점")
    .fill("소매가 팔꿈치까지 내려오는 가장 가까운 선택");
  await page.getByLabel("끈·소매에서 다른 점").blur();
  await chooseCoreOption(page, /실크/);
  await chooseCoreOption(page, /기본 허리선/);
  await chooseCoreOption(page, /^코르셋/);
  await page.getByRole("button", { name: "신부 픽" }).click();
  await expect(page.getByRole("button", { name: "신부 픽" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.reload();
  await page.getByRole("button", { name: "자세히 기록", exact: true }).click();
  await settleOptionArtwork(page);
  await expect(page.getByLabel("끈·소매에서 다른 점")).toHaveValue(
    "소매가 팔꿈치까지 내려오는 가장 가까운 선택",
  );
  await expect(page.getByRole("button", { name: /^코르셋/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  for (const category of ["color", "backStyle", "train"])
    await expect(
      page.locator(`[data-option-category="${category}"]`),
    ).toHaveCount(0);
  for (const tag of [
    "가벼움",
    "편함",
    "조임",
    "흘러내림",
    "무거움",
    "불편함",
    "까슬거림",
  ])
    await expect(
      page.getByRole("button", { name: tag, exact: true }),
    ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /탈부착 소매|뒤 리본/ }),
  ).toHaveCount(0);
  await captureSurface(page, "details-categories-390");
});

test.describe("option artwork failure", () => {
  test.use({ serviceWorkers: "block" });

  test("exposes a readable fallback after a real 404", async ({ page }) => {
    await page.route("**/assets/options/top/offShoulder.webp", (route) =>
      route.fulfill({ status: 404, body: "missing" }),
    );
    await createBaseTour(page);
    await page.reload();
    await page
      .getByRole("button", { name: "자세히 기록", exact: true })
      .click();
    const artwork = page.locator('[data-option-art="top-offShoulder"]');
    await expect(artwork).toHaveAttribute(
      "data-option-art-kind",
      "image-error",
    );
    await expect(artwork).toContainText("이미지를 불러오지 못했어요.");
  });
});

test("offline app opens, edits, reloads, and reopens each saved record", async ({
  page,
}) => {
  const tourId = await createBaseTour(page, { two: true });
  await page.evaluate(async () => navigator.serviceWorker.ready);
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller))))
    await page.reload();
  await page.context().setOffline(true);
  await page.getByText("느낌·평가 남기기 · 선택", { exact: true }).click();
  await page.getByRole("button", { name: "5점" }).click();
  await expect(page.getByRole("button", { name: "5점" })).toHaveClass(
    /text-amber-400/,
  );
  await page.reload();
  await page.getByRole("button", { name: "자세히 기록", exact: true }).click();
  await expect(page.getByRole("button", { name: "5점" })).toHaveClass(
    /text-amber-400/,
  );
  await page.goto(`/tour/${tourId}/review`);
  await expect(page.getByRole("button", { name: /비교/ })).toHaveCount(0);
  await page.getByRole("button", { name: /드레스 01/ }).click();
  await expect(page).toHaveURL(/view=record/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("드레스 01");
  await expect(
    page.getByRole("definition").filter({ hasText: /^레이스$/ }),
  ).toBeVisible();
  await page.goto(`/tour/${tourId}/review`);
  await page.getByRole("button", { name: /드레스 02/ }).click();
  await expect(page).toHaveURL(/view=record/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("드레스 02");
  await expect(
    page.locator('svg[data-renderer="memory-sketch"][data-view="full"]'),
  ).toHaveCount(1);
  await captureSurface(page, "offline-record-390");
  await page.context().setOffline(false);
});

test("editor, details, shop, review, individual record, import, and export have no serious axe violations", async ({
  page,
}) => {
  const tourId = await createBaseTour(page, { two: true });
  const editorUrl = page.url();
  await expectNoSeriousAccessibilityViolations(page);
  await captureSurface(page, "axe-editor-390");
  await page.getByRole("button", { name: "자세히 기록", exact: true }).click();
  await settleOptionArtwork(page);
  await expectNoSeriousAccessibilityViolations(page);
  await captureSurface(page, "axe-details-390");
  await page.getByLabel("뒤로").click();
  const shopUrl = page.url();
  await expect(page.getByRole("button", { name: /비교/ })).toHaveCount(0);
  await expectNoSeriousAccessibilityViolations(page);
  await captureSurface(page, "axe-shop-390");
  await page.goto(`/tour/${tourId}/review`);
  await expect(page.getByRole("button", { name: /비교/ })).toHaveCount(0);
  await expectNoSeriousAccessibilityViolations(page);
  await captureSurface(page, "axe-review-390");
  await page.getByRole("button", { name: /드레스 01/ }).click();
  await expect(page).toHaveURL(/view=record/);
  const individualRecordUrl = page.url();
  await expectNoSeriousAccessibilityViolations(page);
  await captureSurface(page, "axe-individual-record-390");
  await page.goto("/import");
  await expect(
    page.getByRole("heading", { name: /PDF에서 기록 가져오기/ }),
  ).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);
  await captureSurface(page, "axe-import-390");
  await page.goto(`/tour/${tourId}/export`);
  await expect(
    page.getByRole("heading", { name: "PDF로 저장하기" }),
  ).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);
  await captureSurface(page, "axe-export-390");
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(editorUrl);
    await expectNoHorizontalOverflow(page);
    await page
      .getByRole("button", { name: "자세히 기록", exact: true })
      .click();
    await settleOptionArtwork(page);
    await expectNoHorizontalOverflow(page);
    await page.goto(shopUrl);
    await expectNoHorizontalOverflow(page);
    await page.goto(`/tour/${tourId}/review`);
    await expectNoHorizontalOverflow(page);
    await page.goto(individualRecordUrl);
    await expectNoHorizontalOverflow(page);
    await page.goto("/import");
    await expect(
      page.getByRole("heading", { name: /PDF에서 기록 가져오기/ }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.goto(`/tour/${tourId}/export`);
    await expect(
      page.getByRole("heading", { name: "PDF로 저장하기" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});
