import { expect, test } from '@playwright/test'

test('10 shops x 10 dresses can be stored and exported', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Maximum-size export runs once in Chromium.')
  test.setTimeout(240_000)
  await page.goto('/')

  const result = await page.evaluate(async () => {
    const repositoriesPath = '/src/lib/db/repositories.ts'
    const exporterPath = '/src/lib/pdf/exporter.ts'
    const repositories = await import(repositoriesPath)
    const exporter = await import(exporterPath)
    const tour = await repositories.createTour({
      title: '최대 데이터 테스트',
      brideName: '히똥',
      tourDate: '2026-12-13',
      memo: '최대 데이터 검증',
    })
    for (let shopIndex = 0; shopIndex < 10; shopIndex += 1) {
      const shop = await repositories.createShop({
        tourId: tour.id,
        name: `드레스샵 ${shopIndex + 1}`,
        appointmentTime: null,
        memo: '샵 메모 '.repeat(10),
      })
      for (let dressIndex = 0; dressIndex < 10; dressIndex += 1) {
        const dress = await repositories.createDress(tour.id, shop.id)
        await repositories.patchDress(dress.id, {
          memo: `드레스 ${dressIndex + 1} 메모 `.repeat(12),
          isFavorite: dressIndex === 0,
          style: {
            ...dress.style,
            upperStyle: dressIndex % 2 === 0 ? 'offShoulder' : 'spaghetti',
            neckline: dressIndex % 3 === 0 ? 'sweetheart' : 'vNeck',
            silhouette: dressIndex % 2 === 0 ? 'aLine' : 'mermaid',
            primaryFabric: dressIndex % 2 === 0 ? 'mikadoSilk' : 'lace',
            details: dressIndex % 2 === 0 ? ['beading'] : ['laceApplique'],
            trainLength: 'medium',
          },
        })
      }
    }
    const aggregate = await repositories.getTourAggregate(tour.id)
    const exported = await exporter.exportTourToPdf(tour.id, {
      includeFace: false,
      includeShopMemo: true,
      includeDressMemo: true,
      includeFavoritesSummary: true,
    })
    return {
      shopCount: aggregate?.shops.length ?? 0,
      dressCount: aggregate?.dresses.length ?? 0,
      bytes: exported.blob.size,
      signature: await exported.blob.slice(0, 5).text(),
    }
  })

  expect(result.shopCount).toBe(10)
  expect(result.dressCount).toBe(100)
  expect(result.signature).toBe('%PDF-')
  expect(result.bytes).toBeGreaterThan(10_000)
  expect(result.bytes).toBeLessThan(20 * 1024 * 1024)
})
