import { expect, test, type Page } from '@playwright/test';

const tinyPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFElEQVR42mP8z8Dwn4GBgYGJAQoAHQkCAWJ6+ygAAAAASUVORK5CYII=',
  'base64',
);

function monitorErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

async function createProductionTour(page: Page) {
  const stamp = Date.now();
  const title = `운영 검증 투어 ${stamp}`;
  const shop = `운영 검증 브라이덜 ${stamp}`;

  await page.goto('/tour/new');
  await expect(page.getByRole('heading', { name: /오늘 기록을/ })).toBeVisible();
  await page.getByPlaceholder('예: 히똥').fill('운영 검증 신부');
  await page.getByPlaceholder('비워두면 자동으로 만들어요').fill(title);
  await page.getByRole('button', { name: '투어 만들기', exact: true }).click();
  await expect(page).toHaveURL(/\/tour\/[^/]+$/);
  const match = page.url().match(/\/tour\/([^/?#]+)/);
  if (!match) throw new Error('운영 투어 ID를 찾을 수 없습니다.');
  const tourId = match[1];

  await page.getByRole('button', { name: /샵 추가/ }).click();
  await page.getByPlaceholder('드레스샵 이름').fill(shop);
  await page.getByRole('button', { name: '추가하기', exact: true }).click();
  await page.getByRole('button', { name: new RegExp(shop) }).click();
  await page.getByRole('button', { name: '드레스 추가', exact: true }).click();

  await expect(page.locator('[data-option-art="top-offShoulder"]')).toBeVisible();
  await expect(page.locator('[data-option-art="neckline-sweetheart"]')).toBeVisible();
  await expect(page.locator('[data-option-art="silhouette-aLine"]')).toBeVisible();
  await page.getByRole('button', { name: /오프숄더/ }).click();
  await page.getByRole('button', { name: /하트형/ }).click();
  await page.getByRole('button', { name: /A라인/ }).click();
  await page.getByRole('button', { name: /레이스/ }).click();
  await page.getByRole('button', { name: /아이보리/ }).click();
  await page.getByRole('button', { name: /보통 길이/ }).click();
  await page.getByRole('button', { name: '코르셋', exact: true }).click();
  await page.getByRole('button', { name: '신부 픽', exact: true }).click();
  await page.getByPlaceholder(/허리가 제일 얇아/).fill('운영 환경 PDF 왕복 보존 메모');
  await page.getByLabel('후보').click();

  await page
    .locator('input[type="file"][accept*="image/heic"]')
    .setInputFiles({ name: 'face.png', mimeType: 'image/png', buffer: tinyPng });
  await expect(page.getByRole('status')).toContainText('얼굴 사진을 저장했어요.');
  await page.getByLabel('좌우').fill('0.32');
  await page.getByLabel('크기').fill('1.42');

  await page.getByRole('button', { name: '다음 드레스 추가', exact: true }).click();
  await page.getByRole('button', { name: /끈 없음/ }).click();
  await page.getByRole('button', { name: /일자형/ }).click();
  await page.getByRole('button', { name: /무릎부터 크게 퍼짐/ }).click();
  await page.getByRole('button', { name: /매끈한 실크/ }).click();
  await page.getByRole('button', { name: /새하얀 화이트/ }).click();
  await page.getByPlaceholder(/허리가 제일 얇아/).fill('운영 환경 두 번째 드레스');
  await page.waitForTimeout(700);

  return { tourId, title, shop };
}

test('production serves the mobile shell, security headers, and generated atlas', async ({ page }) => {
  const pageErrors = monitorErrors(page);
  const home = await page.request.get('/');
  expect(home.ok()).toBe(true);
  expect(home.headers()['content-type']).toContain('text/html');
  expect(home.headers()['x-content-type-options']).toBe('nosniff');
  expect(home.headers()['content-security-policy']).toContain("default-src 'self'");

  const atlas = await page.request.get('/assets/option-atlas.webp');
  expect(atlas.ok()).toBe(true);
  expect(atlas.headers()['content-type']).toContain('image/webp');
  expect((await atlas.body()).byteLength).toBeGreaterThan(8_000);

  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /그림 대신/ })).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  }
  expect(pageErrors).toEqual([]);
});

test('production completes record, comparison, PDF export, and cross-device restore', async ({ page }) => {
  const pageErrors = monitorErrors(page);
  const { tourId, title, shop } = await createProductionTour(page);

  await page.reload();
  await expect(page.getByPlaceholder(/허리가 제일 얇아/)).toHaveValue(
    '운영 환경 두 번째 드레스',
  );

  await page.goto(`/tour/${tourId}/review`);
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
  await page.getByRole('button', { name: '2벌 비교', exact: true }).click();
  await page.getByRole('button', { name: /Dress 01/ }).click();
  await page.getByRole('button', { name: /Dress 02/ }).click();
  await page.getByRole('button', { name: /선택한 2벌 비교하기/ }).click();
  await expect(page.getByRole('heading', { name: /두 벌을/ })).toBeVisible();
  await expect(page.getByText('오프숄더', { exact: true })).toBeVisible();
  await expect(page.getByText('끈 없음', { exact: true })).toBeVisible();
  await expect(page.getByText('아이보리', { exact: true })).toBeVisible();

  await page.goto(`/tour/${tourId}/export`);
  await expect(page.getByRole('heading', { name: /저장할 PDF를/ })).toBeVisible();
  await page.getByRole('button', { name: '복원 가능한 PDF 만들기', exact: true }).click();
  await expect(page.getByText('PDF가 준비됐어요.')).toBeVisible({ timeout: 70_000 });
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  const download = await downloadPromise;
  const path = await download.path();
  expect(path).toBeTruthy();

  await page.goto('/import');
  await page.locator('input[type="file"]').setInputFiles(path!);
  await expect(page.getByRole('heading', { name: title })).toBeVisible({ timeout: 40_000 });
  await expect(page.getByText('이 기기에 같은 투어가 있어요')).toBeVisible();
  await page.getByRole('button', { name: '이 기록 불러오기', exact: true }).click();
  await expect(page).toHaveURL(/\/tour\/[^/]+$/);
  expect(page.url()).not.toContain(tourId);
  await page.getByRole('button', { name: new RegExp(shop) }).click();
  await page.getByRole('button', { name: /Dress 01/ }).click();
  await expect(page.getByPlaceholder(/허리가 제일 얇아/)).toHaveValue(
    '운영 환경 PDF 왕복 보존 메모',
  );
  await expect(page.locator('.dress-preview image')).toHaveCount(1);
  await expect(page.getByLabel('좌우')).toHaveValue('0.32');
  await expect(page.getByLabel('크기')).toHaveValue('1.42');
  expect(pageErrors).toEqual([]);
});

test('production rejects invalid imports and works after going offline', async ({ page, context }) => {
  const pageErrors = monitorErrors(page);
  await page.goto('/import');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'not-a-pdf.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('not a PDF'),
  });
  await expect(page.getByRole('alert')).toContainText('PDF 파일을 읽을 수 없어요.');

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /그림 대신/ })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  if (!(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))) {
    await page.reload();
  }
  await expect
    .poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), {
      timeout: 20_000,
    })
    .toBe(true);
  await context.setOffline(true);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: /그림 대신/ })).toBeVisible();
  await context.setOffline(false);
  expect(pageErrors).toEqual([]);
});
