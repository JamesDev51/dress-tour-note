import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8Dwn4GBgYGJAQoAHQkCAWJ6+ygAAAAASUVORK5CYII=',
  'base64',
);

async function expectNoSeriousAccessibilityViolations(page: Page) {
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa'])
    .analyze();
  const violations = result.violations
    .filter((item) => item.impact === 'serious' || item.impact === 'critical')
    .map((item) => `${item.id}: ${item.help}`);
  expect(violations).toEqual([]);
}

async function createBaseTour(page: Page, options: { two?: boolean; face?: boolean } = {}) {
  await page.goto('/');
  await page.getByRole('link', { name: /새 투어 시작/ }).click();
  await page.getByPlaceholder('예: 히똥').fill('사용성 신부');
  await page.getByPlaceholder('비워두면 자동으로 만들어요').fill('사용성 테스트 투어');
  await page.getByRole('button', { name: '투어 만들기', exact: true }).click();
  await expect(page).toHaveURL(/\/tour\/[^/]+$/);
  const match = page.url().match(/\/tour\/([^/?#]+)/);
  if (!match) throw new Error('tour id missing');
  const tourId = match[1];
  await page.getByRole('button', { name: /샵 추가/ }).click();
  await page.getByPlaceholder('드레스샵 이름').fill('사용성 브라이덜');
  await page.getByRole('button', { name: '추가하기', exact: true }).click();
  await page.getByRole('button', { name: '사용성 브라이덜 열기', exact: true }).click();
  await page.getByRole('button', { name: '드레스 추가', exact: true }).click();
  await page.getByRole('button', { name: /오프숄더/ }).click();
  await page.getByRole('button', { name: /하트형/ }).click();
  await page.getByRole('button', { name: /A라인/ }).click();
  await page.getByRole('button', { name: /아이보리/ }).click();
  await page.getByLabel('후보').click();
  if (options.face) {
    await page
      .locator('input[type="file"][accept*="image/heic"]')
      .setInputFiles({ name: 'face.png', mimeType: 'image/png', buffer: tinyPng });
    await expect(page.getByRole('status')).toContainText('얼굴 사진을 저장했어요.');
  }
  if (options.two) {
    await page.getByRole('button', { name: '다음 드레스 추가', exact: true }).click();
    await page.getByRole('button', { name: /끈 없음/ }).click();
    await page.getByRole('button', { name: /일자형/ }).click();
  }
  return tourId;
}

test('first-time flow accepts optional tour fields', async ({ page }) => {
  await page.goto('/tour/new');
  await expect(page.getByRole('heading', { name: /오늘 기록을/ })).toBeVisible();
  await page.getByRole('button', { name: '투어 만들기', exact: true }).click();
  await expect(page).toHaveURL(/\/tour\/[^/]+$/);
  await expect(page.locator('input[value="드레스 투어"]')).toBeVisible();
  await expectNoSeriousAccessibilityViolations(page);
});

test('mobile pages do not overflow horizontally at supported boundary widths', async ({ page }) => {
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});

test('generated WebP artwork atlas is available and option cards use it', async ({ page }) => {
  const response = await page.request.get('/assets/option-atlas.webp');
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('image/webp');
  expect((await response.body()).byteLength).toBeGreaterThan(8_000);

  await createBaseTour(page);
  await expect(page.locator('[data-option-art="top-offShoulder"]')).toBeVisible();
  await expect(page.locator('[data-option-art="silhouette-aLine"]')).toBeVisible();
  await expect(page.locator('[data-option-art="color-ivory"]')).toBeVisible();
});

test('missing-record routes fail safely instead of leaving a blank screen', async ({ page }) => {
  await page.goto('/tour/not-found');
  await expect(page.getByText('기록을 불러오는 중...')).toBeVisible();
  await page.goto('/tour/not-found/export');
  await expect(page.getByRole('alert')).toContainText('투어 기록을 찾을 수 없어요.');
  await page.getByRole('button', { name: /다시 불러오기/ }).click();
  await expect(page.getByRole('alert')).toBeVisible();
});

test('theme and font preferences persist, then reset with local data', async ({ page }) => {
  await page.goto('/privacy');
  await page.getByRole('button', { name: /클린/ }).click();
  await page.getByRole('button', { name: /명조/ }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: /클린/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /명조/ })).toHaveAttribute('aria-pressed', 'true');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: /전체 데이터 삭제/ }).click();
  await expect(page).toHaveURL('/');
  await page.goto('/privacy');
  await expect(page.getByRole('button', { name: /크림/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /고딕/ })).toHaveAttribute('aria-pressed', 'true');
});

test('candidate filter never blocks choosing two dresses for comparison', async ({ page }) => {
  const tourId = await createBaseTour(page, { two: true });
  await page.goto(`/tour/${tourId}/review`);
  await expect(page.getByRole('heading', { name: '사용성 테스트 투어' })).toBeVisible();
  await page.getByRole('button', { name: /^후보 1$/ }).click();
  await page.getByRole('button', { name: '2벌 비교' }).click();
  await expect(page.getByText(/비교할 드레스 2벌/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Dress 01/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Dress 02/ })).toBeVisible();
});

test('detail selection stops at four and survives reload', async ({ page }) => {
  await createBaseTour(page);
  for (const name of ['코르셋', '드레이핑', '허리 리본', '등 리본']) {
    await page.getByRole('button', { name }).click();
  }
  await expect(page.getByRole('button', { name: '진주' })).toBeDisabled();
  await page.reload();
  for (const name of ['코르셋', '드레이핑', '허리 리본', '등 리본']) {
    await expect(page.getByRole('button', { name })).toHaveAttribute('aria-pressed', 'true');
  }
});

test('invalid import file returns an actionable error', async ({ page }) => {
  await page.goto('/import');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'not-a-pdf.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('not a pdf'),
  });
  await expect(page.getByRole('status')).toContainText('PDF 파일이 아니에요.');
  await expect(page.getByText(/다시 선택/)).toBeVisible();
});

test('last face position survives immediate navigation away', async ({ page }) => {
  const tourId = await createBaseTour(page, { face: true });
  const dressUrl = page.url();
  await page.getByLabel('좌우').fill('0.73');
  await page.getByLabel('크기').fill('1.88');
  await page.getByLabel('뒤로').click();
  await expect(page).toHaveURL(new RegExp(`/tour/${tourId}/shop/`));
  await page.goto(dressUrl);
  await expect(page.getByLabel('좌우')).toHaveValue('0.73');
  await expect(page.getByLabel('크기')).toHaveValue('1.88');
});

test('bad compare URL recovers safely and recent tour deletion works', async ({ page }) => {
  const tourId = await createBaseTour(page);
  await page.goto(`/tour/${tourId}/compare?a=bad&b=bad2`);
  await expect(page.getByText('비교할 드레스 2벌을 다시 선택해 주세요.')).toBeVisible();
  await page.goto('/');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: /사용성 테스트 투어 삭제/ }).click();
  await expect(page.getByText('아직 저장된 드레스투어가 없어요.')).toBeVisible();
});
