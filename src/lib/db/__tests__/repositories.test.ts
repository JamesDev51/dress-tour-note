import { beforeEach, afterAll, describe, expect, it } from 'vitest'
import { db } from '../database'
import {
  assertAggregateIntegrity,
  createDress,
  createShop,
  createTour,
  deleteShop,
  getTourAggregate,
  listTourSummaries,
  patchDress,
  restoreShop,
} from '../repositories'

beforeEach(async () => {
  db.close()
  await db.delete()
  await db.open()
})

afterAll(async () => {
  db.close()
  await db.delete()
})

describe('IndexedDB repositories', () => {
  it('persists a full tour hierarchy and summary', async () => {
    const tour = await createTour({
      title: '첫 투어',
      brideName: '히똥',
      tourDate: '2026-12-13',
      memo: '',
    })
    const shop = await createShop({
      tourId: tour.id,
      name: '샵 A',
      appointmentTime: '11:00',
      memo: '샵 메모',
    })
    const dress = await createDress(tour.id, shop.id)
    await patchDress(dress.id, {
      memo: '마지막 글자까지 저장',
      isFavorite: true,
      style: { ...dress.style, silhouette: 'mermaid' },
    })

    const aggregate = await getTourAggregate(tour.id)
    expect(aggregate?.shops).toHaveLength(1)
    expect(aggregate?.dresses[0]?.memo).toBe('마지막 글자까지 저장')
    expect(aggregate?.dresses[0]?.style.silhouette).toBe('mermaid')
    expect(aggregate?.dresses[0]?.isFavorite).toBe(true)
    await expect(assertAggregateIntegrity(aggregate!)).resolves.toBeUndefined()

    const summaries = await listTourSummaries()
    expect(summaries[0]).toMatchObject({ shopCount: 1, dressCount: 1, favoriteCount: 1 })
  })

  it('deletes and restores a shop and all child dresses atomically', async () => {
    const tour = await createTour({ title: '투어', brideName: '', tourDate: '2026-12-13', memo: '' })
    const shop = await createShop({ tourId: tour.id, name: '샵 A', appointmentTime: null, memo: '' })
    await createDress(tour.id, shop.id)
    await createDress(tour.id, shop.id)

    const snapshot = await deleteShop(shop.id)
    expect((await getTourAggregate(tour.id))?.shops).toHaveLength(0)
    expect((await getTourAggregate(tour.id))?.dresses).toHaveLength(0)

    await restoreShop(snapshot!)
    expect((await getTourAggregate(tour.id))?.shops).toHaveLength(1)
    expect((await getTourAggregate(tour.id))?.dresses).toHaveLength(2)
  })
})
