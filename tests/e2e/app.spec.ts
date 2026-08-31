import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

async function createTour(page: Page, title = '히똥 드레스투어') {
  await page.goto('/')
  await page.getByRole('link', { name: '새 드레스투어 기록' }).click()
  await page.getByLabel('투어명').fill(title)
  await page.getByLabel('신부명').fill('히똥')
  await page.getByLabel('전체 메모').fill('베일과 구두를 챙기기')
  await page.getByRole('button', { name: '기록 시작하기' }).click()
  await expect(page.getByRole('heading', { name: title })).toBeVisible()
}

async function addShop(page: Page, name = '아뜰리에 로리에') {
  await page.getByRole('button', { name: '드레스샵 추가' }).click()
  await page.getByLabel('드레스샵 이름').fill(name)
  await page.getByLabel('방문 시간').fill('11:30')
  await page.getByLabel('샵 메모').fill('피팅비 결제 완료')
  await page.getByRole('button', { name: '샵 추가' }).click()
  await expect(page.getByRole('heading', { name })).toBeVisible()
}

async function addAndEditDress(page: Page) {
  await page.getByRole('button', { name: '입어본 드레스 추가' }).click()
  await expect(page.getByRole('heading', { name: '어깨와 소매는 어떻게 생겼나요?' })).toBeVisible()
  await page.getByRole('radio', { name: /어깨 아래로 내려옴/ }).click()
  await page.getByRole('button', { name: /가슴선/ }).click()
  await page.getByRole('radio', { name: /하트 모양/ }).click()
  await page.getByRole('button', { name: /허리선/ }).click()
  await page.getByRole('radio', { name: /허리 위치/ }).click()
  await page.getByRole('button', { name: /치마/ }).click()
  await page.getByRole('radio', { name: /아래로 자연스럽게 퍼짐/ }).click()
  await page.getByRole('button', { name: /소재/ }).click()
  await page.getByRole('radio', { name: /매끈하고 힘 있는 실크/ }).click()
  await page.getByRole('button', { name: /장식/ }).click()
  await page.getByRole('checkbox', { name: /비즈·반짝이/ }).click()
  await page.getByRole('button', { name: /트레인/ }).click()
  await page.getByRole('radio', { name: /보통 길이/ }).click()
  await page.getByRole('button', { name: /등·색/ }).click()
  await page.getByRole('radio', { name: /등 중앙 단추/ }).click()
  await page.getByRole('radio', { name: /아이보리/ }).click()
  await page.getByRole('button', { name: /메모/ }).click()
  await page.getByRole('button', { name: /둘 다 픽/ }).click()
  await page.getByLabel('특이사항').fill('허리가 제일 얇아 보였고 움직일 때도 편했음')
  await page.getByRole('button', { name: '후보로 저장' }).click()
  await page.getByRole('button', { name: '기록 완료' }).click()
  await expect(page.getByText('허리가 제일 얇아 보였고')).toBeVisible()
}

test('complete mobile flow persists through reload and editable PDF round-trip', async ({ page, browser }) => {
  const externalRequests: string[] = []
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) externalRequests.push(request.url())
  })

  await createTour(page)
  await addShop(page)
  await addAndEditDress(page)

  await page.reload()
  await expect(page.getByText('허리가 제일 얇아 보였고')).toBeVisible()
  await expect(page.getByRole('button', { name: '후보에서 해제' })).toBeVisible()

  await page.getByLabel('뒤로가기').click()
  await expect(page.getByText('최종 후보')).toBeVisible()
  await expect(page.getByText('1벌 저장됨')).toBeVisible()

  await page.getByRole('link', { name: /PDF로 정리하기/ }).click()
  const downloadPromise = page.waitForEvent('download')
  await page.getByRole('button', { name: 'PDF 만들고 저장하기' }).click()
  const download = await downloadPromise
  const pdfPath = await download.path()
  expect(pdfPath).toBeTruthy()
  expect(download.suggestedFilename()).toContain('히똥_드레스투어_')
  await expect(page.getByRole('heading', { name: 'PDF를 저장했어요' })).toBeVisible()

  const cleanContext = await browser.newContext({
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 390, height: 844 },
  })
  const cleanPage = await cleanContext.newPage()
  await cleanPage.goto('/import')
  await cleanPage.locator('input[type="file"]').setInputFiles(pdfPath!)
  await expect(cleanPage.getByText('확인 완료')).toBeVisible({ timeout: 30_000 })
  await expect(cleanPage.getByRole('heading', { name: '히똥 드레스투어' })).toBeVisible()
  await expect(cleanPage.getByText('1벌')).toBeVisible()
  await cleanPage.getByRole('button', { name: '이 기록 불러오기' }).click()
  await expect(cleanPage.getByRole('heading', { name: '히똥 드레스투어' })).toBeVisible()
  await expect(cleanPage.getByText('드레스 1')).toBeVisible()
  await cleanContext.close()

  expect(externalRequests).toEqual([])
})

test('face image and transform stay in local IndexedDB after reload', async ({ page }) => {
  await createTour(page, '얼굴 테스트 투어')
  await page.getByRole('link', { name: /내 얼굴로 느낌 보기/ }).click()

  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAIAAAD8GO2jAAAATElEQVR4nO3NMQEAAAgDINc/9K3hHFQgE7N2d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3cD7gABo1In1AAAAABJRU5ErkJggg==',
    'base64',
  )
  await page.locator('input[type="file"]').setInputFiles({ name: 'face.png', mimeType: 'image/png', buffer: png })
  await expect(page.getByRole('button', { name: '다른 사진 선택' })).toBeVisible({ timeout: 20_000 })

  const ranges = page.locator('input[type="range"]')
  await ranges.nth(0).fill('1.7')
  await ranges.nth(1).fill('0.4')
  await ranges.nth(3).fill('8')
  await page.getByText('설정 완료').click()

  await page.getByRole('link', { name: /내 얼굴로 느낌 보기/ }).click()
  await expect(ranges.nth(0)).toHaveValue('1.7')
  await expect(ranges.nth(1)).toHaveValue('0.4')
  await expect(ranges.nth(3)).toHaveValue('8')
})

test('rejects a non-editable PDF without creating a tour', async ({ page }) => {
  await page.goto('/import')
  await page.locator('input[type="file"]').setInputFiles({
    name: 'ordinary.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF'),
  })
  await expect(page.getByRole('heading', { name: '이 PDF는 불러올 수 없어요' })).toBeVisible({ timeout: 20_000 })
  await page.getByLabel('뒤로가기').click()
  await expect(page.getByRole('heading', { name: '아직 기록이 없어요' })).toBeVisible()
})

test('has no horizontal overflow at 320px and passes critical accessibility checks', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 })
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /그림 대신 고르면/ })).toBeVisible()
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }))
  expect(dimensions.content).toBeLessThanOrEqual(dimensions.viewport)

  const results = await new AxeBuilder({ page }).disableRules(['color-contrast']).analyze()
  expect(results.violations).toEqual([])
})

test('direct route refresh remains available through SPA fallback', async ({ page }) => {
  await createTour(page, '직접 진입 테스트')
  const route = page.url()
  await page.goto(route)
  await expect(page.getByRole('heading', { name: '직접 진입 테스트' })).toBeVisible()
})
