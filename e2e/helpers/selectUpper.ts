import type { Page } from "@playwright/test";

/** Existing fixture names describe a look; the UI now records its two fields independently. */
export async function chooseUpper(page: Page, preset: RegExp | string) {
  const pattern = typeof preset === "string" ? preset : preset.source;
  if (pattern.replace(/^\^/, "").replace(/\$$/, "") === "기억 안 남") {
    await page
      .getByRole("button", { name: "가슴선 기억 안 남", exact: true })
      .click();
    await page
      .getByRole("button", { name: "끈·소매 기억 안 남", exact: true })
      .click();
    return;
  }
  const [top, neckline] = pattern
    .replace(/^\^/, "")
    .replace(/\$$/, "")
    .split(" · ");
  if (!top || !neckline)
    throw new Error(
      `상체 테스트 값에는 끈·소매와 가슴선이 필요해요: ${pattern}`,
    );
  await selectUpperChoices(
    page,
    new RegExp(`^${neckline}`),
    new RegExp(`^${top}`),
  );
}

export async function selectUpperChoices(
  page: Page,
  neckline: RegExp | string,
  topStyle: RegExp | string,
) {
  await page
    .locator('[data-option-category="neckline"]')
    .getByRole("button", { name: neckline })
    .click();
  await page
    .locator('[data-option-category="top"]')
    .getByRole("button", { name: topStyle })
    .click();
}
