import { readFile } from "node:fs/promises";
import { expect, test, type Locator, type Page } from "@playwright/test";

async function recordCore(page: Page, fabric: RegExp | string = /^레이스/) {
  await page.getByRole("button", { name: /^A라인/ }).click();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await page
    .getByRole("button", { name: fabric, exact: typeof fabric === "string" })
    .click();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await page.getByRole("button", { name: "일자 가슴선", exact: true }).click();
  await page.getByRole("button", { name: "끈 없음", exact: true }).click();
  await page
    .getByRole("button", { name: "기록 완료하고 보기", exact: true })
    .click();
  await expect(page).toHaveURL(/view=record/);
  await page.getByText("느낌·평가 남기기 · 선택", { exact: true }).click();
}

async function startRecord(page: Page) {
  await page.goto("/");
  await page.getByRole("link", { name: /새 투어 시작/ }).click();
  await page.getByPlaceholder("예: 히똥").fill("기억 검증 신부");
  await page.getByRole("button", { name: "투어 만들기", exact: true }).click();
  await page.getByRole("button", { name: /샵 추가/ }).click();
  await page.getByPlaceholder("드레스샵 이름").fill("기억 검증 샵");
  await page.getByRole("button", { name: "추가하기", exact: true }).click();
  await expect(page).toHaveURL(/\/shop\/[^/]+$/);
  await page.getByRole("button", { name: "드레스 추가", exact: true }).click();
  await recordCore(page);
  return page.url();
}

for (const width of [320, 390]) {
  test(`option images share a square frame and top alignment at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await startRecord(page);
    await page
      .getByRole("button", { name: "기본 기록 수정", exact: true })
      .click();
    const checkImages = async (section: Locator) => {
      const boxes = await section
        .locator("[data-option-card]")
        .evaluateAll((cards) =>
          cards.map((card) => {
            const frame = card
              .querySelector("[data-option-artwork]")!
              .getBoundingClientRect();
            const artwork = card
              .querySelector("[data-option-art], [data-upper-preview]")!
              .getBoundingClientRect();
            const bounds = card.getBoundingClientRect();
            return {
              label: card.querySelector("[data-option-label]")!.textContent,
              width: frame.width,
              height: frame.height,
              topInset: frame.top - bounds.top,
              leftInset: frame.left - bounds.left,
              artWidth: artwork.width,
              artHeight: artwork.height,
            };
          }),
        );
      expect(boxes.length).toBeGreaterThan(1);
      for (const box of boxes) {
        expect(box.width, `${box.label}: equal width`).toBeCloseTo(
          boxes[0].width,
          0,
        );
        expect(box.height, `${box.label}: square frame`).toBeCloseTo(
          box.width,
          0,
        );
        expect(box.topInset, `${box.label}: top alignment`).toBeCloseTo(
          box.leftInset,
          0,
        );
        expect(box.artWidth, `${box.label}: artwork width`).toBeCloseTo(
          box.width,
          0,
        );
        expect(box.artHeight, `${box.label}: artwork height`).toBeCloseTo(
          box.height,
          0,
        );
      }
    };
    for (const step of [1, 2, 3]) {
      const section = page.locator(".record-step");
      await checkImages(section);
      await section.getByRole("heading").first().scrollIntoViewIfNeeded();
      await page.screenshot({
        path: testInfo.outputPath(`uniform-step-${step}.png`),
      });
      if (step < 3)
        await page.getByRole("button", { name: "다음", exact: true }).click();
    }
    await page
      .getByRole("button", { name: "하트 가슴선", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "하트 가슴선", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("button", { name: "끈 없음", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await checkImages(page.locator(".record-step"));
    await expect(
      page.getByText("반영한 특징·미기록 항목", { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "뒷모습", exact: true }),
    ).toHaveCount(0);
    await page
      .getByRole("button", { name: "자세히 기록", exact: true })
      .click();
    const grids = page.locator('[data-testid="option-grid"]:visible');
    expect(await grids.count()).toBeGreaterThanOrEqual(6);
    for (const grid of await grids.all()) await checkImages(grid);
    await expect(
      page.locator(
        '[data-option-category="backStyle"], [data-option-category="color"], [data-option-category="train"]',
      ),
    ).toHaveCount(0);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  });

  test(`buttons respond during press without activating disabled actions at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({
      reducedMotion: width === 320 ? "reduce" : "no-preference",
    });
    await startRecord(page);
    await page
      .getByRole("button", { name: "기본 기록 수정", exact: true })
      .click();
    const previous = page.getByRole("button", { name: "이전", exact: true }),
      next = page.getByRole("button", { name: "다음", exact: true });
    const press = async (button: Locator) => {
      await button.scrollIntoViewIfNeeded();
      const b = await button.boundingBox();
      if (!b) throw new Error("버튼이 없어요.");
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2);
      await page.mouse.down();
    };
    const expectPressed = async (button: Locator) => {
      await expect(button).toHaveCSS("filter", "brightness(0.92)");
      await expect(button).toHaveCSS("scale", width === 320 ? "none" : "0.97");
    };
    await expect(previous).toBeDisabled();
    await press(previous);
    await expect(previous).toHaveCSS("filter", "none");
    await expect(previous).toHaveCSS("scale", "none");
    await page.mouse.up();
    await expect(page.getByText("1/3", { exact: true })).toBeVisible();
    await press(next);
    await expectPressed(next);
    await page.screenshot({ path: testInfo.outputPath("pressed-next.png") });
    await page.mouse.up();
    await expect(next).toHaveCSS("filter", "none");
    await expect(next).toHaveCSS("scale", "none");
    await expect(page.getByText("2/3", { exact: true })).toBeVisible();
    await previous.focus();
    await page.keyboard.down("Space");
    await expectPressed(previous);
    await page.keyboard.up("Space");
    await expect(page.getByText("1/3", { exact: true })).toBeVisible();
    const choice = page.getByRole("button", { name: /^벨라인/ });
    await press(choice);
    await expectPressed(choice);
    await page.mouse.up();
    await expect(choice).toHaveAttribute("aria-pressed", "true");
    await expect(choice).toHaveCSS("filter", "none");
    await expect(choice).toHaveCSS("scale", "none");
  });

  test(`choices stay in place and an explicit preview restores focus at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await page.emulateMedia({
      reducedMotion: width === 320 ? "reduce" : "no-preference",
    });
    await startRecord(page);
    await page
      .getByRole("button", { name: "기본 기록 수정", exact: true })
      .click();
    await page.getByRole("button", { name: "다음", exact: true }).click();
    const choice = page.getByRole("button", { name: /^실크/ });
    await choice.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => window.scrollY);
    await choice.click();
    await expect(choice).toHaveAttribute("aria-pressed", "true");
    expect(
      Math.abs((await page.evaluate(() => window.scrollY)) - before),
    ).toBeLessThanOrEqual(2);
    await expect(
      page.getByRole("dialog", { name: "드레스 미리보기" }),
    ).toHaveCount(0);
    const preview = page.getByRole("button", { name: "미리보기", exact: true });
    await preview.click();
    const dialog = page.getByRole("dialog", { name: "드레스 미리보기" });
    await expect(dialog).toBeVisible();
    await expect(
      dialog.locator(
        '.dress-preview[data-garment-state="ready"], .dress-preview[data-garment-state="partial"]',
      ),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("explicit-preview.png"),
    });
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(preview).toBeFocused();
    expect(
      Math.abs((await page.evaluate(() => window.scrollY)) - before),
    ).toBeLessThanOrEqual(2);
    await page.getByRole("button", { name: "다음", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "목·가슴선", exact: true }),
    ).toBeInViewport();
    await expect(
      page.getByRole("heading", { name: "끈·소매", exact: true }),
    ).toBeVisible();
    for (const label of ["하트 가슴선", "일자 가슴선", "끈 없음", "가는 끈"]) {
      await expect(
        page.getByRole("button", { name: label, exact: true }),
      ).toHaveText(label, { useInnerText: true });
    }
    const chest = page.getByRole("button", {
      name: "하트 가슴선",
      exact: true,
    });
    await chest.scrollIntoViewIfNeeded();
    const upperBefore = await page.evaluate(() => window.scrollY);
    await chest.click();
    await expect(chest).toHaveAttribute("aria-pressed", "true");
    expect(
      Math.abs((await page.evaluate(() => window.scrollY)) - upperBefore),
    ).toBeLessThanOrEqual(2);
    await expect(
      page.getByRole("navigation", { name: "기록 단계 이동" }),
    ).toBeInViewport({ ratio: 1 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
    await page.screenshot({
      path: testInfo.outputPath("independent-upper-choices.png"),
    });
  });

  test(`editor has no retired sides and opens a wide preview at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 844 });
    await startRecord(page);
    await page
      .getByRole("button", { name: "기본 기록 수정", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "뒷모습", exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "맨 위로", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "미리보기", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "드레스 미리보기" });
    const picture = dialog.locator(
      '.dress-preview[data-garment-state="ready"], .dress-preview[data-garment-state="partial"]',
    );
    await expect(picture).toBeVisible();
    const bounds = await picture.boundingBox();
    expect(bounds!.width).toBeGreaterThanOrEqual(width - 72);
    expect(bounds!.width).toBeLessThanOrEqual(width - 48);
    const close = dialog.getByRole("button", {
      name: "미리보기 닫기",
      exact: true,
    });
    expect((await close.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    await page.screenshot({
      path: testInfo.outputPath("wide-modal-preview.png"),
    });
    await close.click();
    await page.getByRole("button", { name: "다음", exact: true }).click();
    await page.getByRole("button", { name: "다음", exact: true }).click();
    await expect(page.getByRole("button", { name: / · .*가슴선/ })).toHaveCount(
      0,
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(width);
  });

  test(`preview replaces back-to-top and clears fixed actions in details at ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 640 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await startRecord(page);
    await page
      .getByRole("button", { name: "기본 기록 수정", exact: true })
      .click();
    await page.getByRole("button", { name: "다음", exact: true }).click();
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    const preview = page.getByRole("button", { name: "미리보기", exact: true });
    const navigation = page.getByRole("navigation", { name: "기록 단계 이동" });
    await expect(preview).toBeInViewport({ ratio: 1 });
    await expect(
      page.getByRole("button", { name: "맨 위로", exact: true }),
    ).toHaveCount(0);
    const box = await preview.boundingBox(),
      bar = await navigation.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(44);
    expect(box!.y + box!.height).toBeLessThan(bar!.y);
    const lastChoice = await page
      .getByRole("button", { name: "기억 안 남", exact: true })
      .boundingBox();
    expect(lastChoice!.y + lastChoice!.height).toBeLessThanOrEqual(box!.y);
    const before = await page.evaluate(() => window.scrollY);
    await preview.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog", { name: "드레스 미리보기" });
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole("button", { name: "선택으로 돌아가기", exact: true })
      .click();
    await expect(preview).toBeFocused();
    expect(
      Math.abs((await page.evaluate(() => window.scrollY)) - before),
    ).toBeLessThanOrEqual(2);
    await page
      .getByRole("button", { name: "자세히 기록", exact: true })
      .click();
    await page.evaluate(() =>
      window.scrollTo(0, document.documentElement.scrollHeight),
    );
    await expect(navigation).toHaveCount(0);
    await expect(preview).toBeInViewport({ ratio: 1 });
    const detail = await preview.boundingBox(),
      back = await page
        .getByRole("button", { name: "기록으로 돌아가기", exact: true })
        .boundingBox();
    expect(detail!.y + detail!.height).toBeLessThan(back!.y);
    await preview.click();
    await expect(
      page.getByRole("dialog", { name: "드레스 미리보기" }),
    ).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath("details-modal-preview.png"),
    });
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", {
        name: /얼굴 사진|얼굴 미리보기|뒷모습|뒤로 끌리는/,
      }),
    ).toHaveCount(0);
  });

  test(`step navigation stays at the viewport bottom at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 640 });
    await startRecord(page);
    await page
      .getByRole("button", { name: "기본 기록 수정", exact: true })
      .click();
    const navigation = page.getByRole("navigation", { name: "기록 단계 이동" });
    const previous = navigation.getByRole("button", {
      name: "이전",
      exact: true,
    });
    for (const step of [1, 2, 3]) {
      for (const position of [0, 0.5, 1]) {
        await page.evaluate(
          (f) => window.scrollTo(0, document.documentElement.scrollHeight * f),
          position,
        );
        await expect(navigation).toBeInViewport({ ratio: 1 });
        const b = await navigation.boundingBox();
        expect(b!.y + b!.height).toBeCloseTo(640, 0);
        expect(b!.x).toBeGreaterThanOrEqual(0);
        expect(b!.x + b!.width).toBeLessThanOrEqual(width);
        await expect(previous).toBeInViewport({ ratio: 1 });
      }
      const unknown = page.getByRole("button", {
        name: step === 3 ? "끈·소매 기억 안 남" : "기억 안 남",
        exact: true,
      });
      const choice = await unknown.boundingBox(),
        bar = await navigation.boundingBox();
      expect(choice!.y + choice!.height).toBeLessThanOrEqual(bar!.y);
      await unknown.click();
      const next = navigation.getByRole("button", {
        name: step === 3 ? "기록 완료하고 보기" : "다음",
        exact: true,
      });
      await expect(next).toBeEnabled();
      if (step === 1) await expect(previous).toBeDisabled();
      else await expect(previous).toBeEnabled();
      await next.click();
    }
    await expect(page).toHaveURL(/view=record/);
    await expect(navigation).toHaveCount(0);
  });

  test(`recall survives immediate back and reopen at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    const url = await startRecord(page);
    await page
      .getByRole("textbox", { name: "기억할 특징", exact: true })
      .fill("큰 꽃과 레이스");
    await page
      .getByRole("textbox", { name: "좋았던 점", exact: true })
      .fill("허리 모양이 예쁨");
    await page
      .getByRole("textbox", { name: "아쉬운 점", exact: true })
      .fill("장식이 조금 많음");
    await page.getByRole("button", { name: "뒤로", exact: true }).click();
    await expect(page).toHaveURL(/\/shop\//);
    await page
      .getByRole("heading", { name: "큰 꽃과 레이스", exact: true })
      .click();
    await expect(page).toHaveURL(new RegExp(new URL(url).pathname));
    await page.reload();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "큰 꽃과 레이스",
    );
    await expect(
      page.getByRole("definition").filter({ hasText: /^허리 모양이 예쁨$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("definition").filter({ hasText: /^장식이 조금 많음$/ }),
    ).toBeVisible();
    await expect(
      page.locator('svg[data-renderer="memory-sketch"][data-view="full"]'),
    ).toHaveCount(1);
    await expect(page.locator("[data-reference-gown]")).toHaveCount(0);
    await page
      .getByRole("region", { name: "드레스 보기", exact: true })
      .getByRole("button", { name: "상체", exact: true })
      .click();
    await expect(
      page.locator('svg[data-renderer="memory-sketch"][data-view="upper"]'),
    ).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "뒷모습", exact: true }),
    ).toHaveCount(0);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth - innerWidth,
      ),
    ).toBe(0);
  });
}

test("explicit completion without feedback does not create the next blank", async ({
  page,
}) => {
  await startRecord(page);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("드레스 01");
  await expect(
    page.getByRole("button", { name: "후보", exact: true }),
  ).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "뒤로", exact: true }).click();
  await expect(page).toHaveURL(/\/shop\//);
  await expect(
    page.getByRole("button", { name: /드레스 01 상세 편집/ }),
  ).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: /드레스 02 상세 편집/ }),
  ).toHaveCount(0);
});

test("details panel restores the current core step, focus and scroll", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await startRecord(page);
  await page
    .getByRole("button", { name: "기본 기록 수정", exact: true })
    .click();
  await page.getByRole("button", { name: "다음", exact: true }).click();
  await expect(page.getByText("2/3", { exact: true })).toBeVisible();
  const details = page
    .getByRole("navigation", { name: "기록 보기와 추가 입력" })
    .getByRole("button", { name: "자세히 기록", exact: true });
  await details.focus();
  const before = await page.evaluate(() => window.scrollY);
  await details.click();
  await page
    .locator('[data-option-category="waistline"]')
    .getByRole("button", { name: /골반 쪽 허리선/ })
    .click();
  await expect(
    page
      .locator('[data-option-category="waistline"]')
      .getByRole("button", { name: /골반 쪽 허리선/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .getByRole("button", { name: "기록으로 돌아가기", exact: true })
    .click();
  await expect(page.getByText("2/3", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /^레이스/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(details).toBeFocused();
  expect(
    Math.abs((await page.evaluate(() => window.scrollY)) - before),
  ).toBeLessThanOrEqual(1);
  await details.click();
  await expect(
    page
      .locator('[data-option-category="waistline"]')
      .getByRole("button", { name: /골반 쪽 허리선/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "뒷모습", exact: true }),
  ).toHaveCount(0);
});

test("record summary keeps its selected preview after details return", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startRecord(page);
  await expect(page).toHaveURL(/view=record/);
  await page.getByRole("button", { name: "상체", exact: true }).click();
  await expect(page.locator('svg[data-view="upper"]')).toHaveCount(1);

  await page
    .getByRole("button", { name: "자세히 기록", exact: true })
    .first()
    .click();
  await page
    .getByRole("button", { name: "기록으로 돌아가기", exact: true })
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
  await page.getByRole("button", { name: "자세히 기록", exact: true }).click();
  await page.getByRole("heading", { name: "소재·표면", exact: true }).waitFor();

  await page.evaluate(() => {
    const original = IDBObjectStore.prototype.put;
    IDBObjectStore.prototype.put = function (...args) {
      if (this.name === "dresses" && args[0].waistline === "drop") {
        IDBObjectStore.prototype.put = original;
        throw new DOMException("QA injected rejection", "AbortError");
      }
      return original.apply(this, args);
    };
  });
  await page
    .getByRole("button", { name: /골반 쪽 허리선/ })
    .first()
    .click();
  await expect(page.getByText("저장 실패", { exact: true })).toBeVisible();
  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  const retry = page.getByRole("button", {
    name: "저장 다시 시도",
    exact: true,
  });
  await expect(retry).toBeInViewport({ ratio: 1 });
  const retryBox = await retry.boundingBox();
  const footerBox = await page
    .getByRole("button", { name: "기록으로 돌아가기", exact: true })
    .boundingBox();
  expect(retryBox!.y + retryBox!.height).toBeLessThan(footerBox!.y);

  const returnToCore = page
    .locator(".core-details-nav")
    .getByRole("button", { name: "기록으로", exact: true });
  await returnToCore.click();
  await expect(
    page.getByRole("alert").filter({ hasText: "이전 선택" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "소재·표면", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: /V자·곡선 허리선/ })
    .first()
    .click();
  await expect(page.getByText("자동 저장됨", { exact: true })).toBeVisible();
  await returnToCore.click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("드레스 01");
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
    page.getByRole("definition").filter({ hasText: /^팔을 올리기 불편함$/ }),
  ).toBeVisible();
});

test.describe(() => {
  test.use({ serviceWorkers: "block" });
  test("individual records keep observed details and missing evidence separate without comparison", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    let releaseWaistImage: () => void = () => undefined;
    const waistImageRelease = new Promise<void>((resolve) => {
      releaseWaistImage = resolve;
    });
    await page.route("**/assets/options/waistline/drop.webp", async (route) => {
      await waistImageRelease;
      await route.continue();
    });
    const firstUrl = await startRecord(page);
    await page
      .getByRole("textbox", { name: "기억할 특징", exact: true })
      .fill("리본이 큰 드레스");
    await page
      .getByRole("textbox", { name: "좋았던 점", exact: true })
      .fill("허리가 편함");
    await page
      .getByRole("button", { name: "자세히 기록", exact: true })
      .click();
    await expect(
      page
        .locator('[data-option-category="fabric"]')
        .getByRole("button", { name: /레이스/ }),
    ).toHaveAttribute("aria-pressed", "true");
    const firstWaist = page
      .locator('[data-option-category="waistline"]')
      .getByRole("button", { name: /골반 쪽 허리선/ });
    await firstWaist.scrollIntoViewIfNeeded();
    const loadingIndicator = firstWaist.locator(
      "[data-option-art-loading-indicator]",
    );
    await expect(loadingIndicator).toBeVisible();
    const box = await firstWaist.boundingBox();
    if (!box) throw new Error("허리선 버튼을 찾을 수 없어요.");
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    // Finish the real image load during contact: the button must still receive click.
    releaseWaistImage();
    try {
      await expect(loadingIndicator).toHaveCount(0);
    } finally {
      await page.mouse.up();
    }
    await expect(firstWaist).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "뒤로", exact: true }).click();
    await expect(page).toHaveURL(/\/shop\//);
    await page
      .getByRole("button", { name: "드레스 추가", exact: true })
      .click();
    await recordCore(page, "기억 안 남");
    const secondUrl = page.url();
    await page
      .getByRole("textbox", { name: "기억할 특징", exact: true })
      .fill("단추가 있던 드레스");
    await page
      .getByRole("textbox", { name: "아쉬운 점", exact: true })
      .fill("걷기 무거움");
    await page
      .getByRole("button", { name: "자세히 기록", exact: true })
      .click();
    const secondWaist = page
      .locator('[data-option-category="waistline"]')
      .getByRole("button", { name: /V자·곡선 허리선/ });
    await secondWaist.click();
    await expect(secondWaist).toHaveAttribute("aria-pressed", "true");
    await page.getByRole("button", { name: "뒤로", exact: true }).click();
    await expect(page).toHaveURL(/\/shop\//);
    const shopUrl = page.url();
    await expect(page.getByRole("button", { name: /비교/ })).toHaveCount(0);
    await page
      .getByRole("button", { name: "드레스 01 기록 보기", exact: true })
      .click();
    await expect(page).toHaveURL(
      new RegExp(`${new URL(firstUrl).pathname}.*view=record`),
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "리본이 큰 드레스",
    );
    await expect(
      page.getByRole("definition").filter({ hasText: /^허리가 편함$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("definition").filter({ hasText: /^레이스$/ }),
    ).toBeVisible();
    await expect(
      page.getByRole("definition").filter({ hasText: /^골반 쪽 허리선$/ }),
    ).toBeVisible();
    await expect(page.getByText("걷기 무거움", { exact: true })).toHaveCount(0);
    await page.goto(shopUrl);
    await page
      .getByRole("button", { name: "드레스 02 기록 보기", exact: true })
      .click();
    await expect(page).toHaveURL(
      new RegExp(`${new URL(secondUrl).pathname}.*view=record`),
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(
      "단추가 있던 드레스",
    );
    await expect(
      page.getByRole("definition").filter({ hasText: /^걷기 무거움$/ }),
    ).toBeVisible();
    const materialRow = page
      .locator("dl > div")
      .filter({ has: page.locator("dt").filter({ hasText: /^소재$/ }) });
    await expect(materialRow.getByRole("definition")).toHaveText("기억 안 남");
    await expect(
      page.getByRole("definition").filter({ hasText: /^V자·곡선 허리선$/ }),
    ).toBeVisible();
    await expect(page.getByText("허리가 편함", { exact: true })).toHaveCount(0);
    await expect(
      page.locator('svg[data-renderer="memory-sketch"][data-view="full"]'),
    ).toHaveCount(1);
    await expect(
      page.getByRole("button", { name: "뒷모습", exact: true }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "상체", exact: true }).click();
    await expect(
      page.locator('svg[data-renderer="memory-sketch"][data-view="upper"]'),
    ).toHaveCount(1);
  });
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
    .getByRole("button", { name: "기록 전체 삭제", exact: true })
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
    .getByRole("button", { name: "백업용 PDF 만들기", exact: true })
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
    .getByRole("button", { name: "새 투어로 추가", exact: true })
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
    page
      .getByRole("definition")
      .filter({ hasText: /^허리가 편하고 목선이 시원함$/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("definition").filter({ hasText: /^팔을 올릴 때 불편함$/ }),
  ).toBeVisible();
});
