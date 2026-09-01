import { defineConfig } from '@playwright/test';

const baseURL = process.env.PRODUCTION_URL;
if (!baseURL) throw new Error('PRODUCTION_URL is required');

export default defineConfig({
  testDir: './e2e-production',
  timeout: 120_000,
  expect: { timeout: 20_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['line'], ['html', { open: 'never', outputFolder: 'playwright-production-report' }]],
  use: {
    baseURL,
    browserName: 'chromium',
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
});
