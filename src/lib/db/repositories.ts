import { copyDefaultStyle, defaultFaceTransform } from '../../domain/options'
import {
  SCHEMA_VERSION,
  type AppSetting,
  type Dress,
  type FaceTransform,
  type ImportMode,
  type LocalAsset,
  type Shop,
  type Tour,
  type TourAggregate,
  type TourSummary,
} from '../../domain/types'
import { makeId, nowIso } from '../../shared/utils'
import { notifyDataChanged } from './changeBus'
import { db } from './database'

export interface CreateTourInput {
  title: string
  brideName: string
  tourDate: string
  memo: string
}

export interface CreateShopInput {
  tourId: string
  name: string
  appointmentTime: string | null
  memo: string
}

export interface DeletedTourSnapshot {
  aggregate: TourAggregate
}

export interface DeletedShopSnapshot {
  shop: Shop
  dresses: Dress[]
}

export interface DeletedDressSnapshot {
  dress: Dress
}

export async function openDatabase(): Promise<void> {
  if (!db.isOpen()) await db.open()
}

export async function getTour(id: string): Promise<Tour | undefined> {
  return db.tours.get(id)
}

export async function listTourSummaries(): Promise<TourSummary[]> {
  const tours = await db.tours.orderBy('updatedAt').reverse().toArray()
  return Promise.all(
    tours.map(async (tour) => {
      const [shopCount, dressCount, favoriteCount] = await Promise.all([
        db.shops.where('tourId').equals(tour.id).count(),
        db.dresses.where('tourId').equals(tour.id).count(),
        db.dresses
          .where('tourId')
          .equals(tour.id)
          .filter((dress) => dress.isFavorite)
          .count(),
      ])
      return { tour, shopCount, dressCount, favoriteCount }
    }),
  )
}

export async function getTourAggregate(tourId: string): Promise<TourAggregate | null> {
  const [tour, shops, dresses, assets] = await Promise.all([
    db.tours.get(tourId),
    db.shops.where('tourId').equals(tourId).sortBy('order'),
    db.dresses.where('tourId').equals(tourId).sortBy('order'),
    db.assets.where('tourId').equals(tourId).toArray(),
  ])
  if (!tour) return null
  return {
    tour,
    shops: shops.sort((a, b) => a.order - b.order),
    dresses: dresses.sort((a, b) => a.order - b.order),
    assets,
  }
}

export async function createTour(input: CreateTourInput): Promise<Tour> {
  const timestamp = nowIso()
  const tour: Tour = {
    id: makeId(),
    schemaVersion: SCHEMA_VERSION,
    title: input.title.trim(),
    brideName: input.brideName.trim(),
    tourDate: input.tourDate,
    memo: input.memo.trim(),
    status: 'active',
    faceConfig: { ...defaultFaceTransform },
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.tours.add(tour)
  await setSetting('lastOpenedTourId', tour.id)
  notifyDataChanged()
  return tour
}

export async function patchTour(id: string, patch: Partial<Tour>): Promise<void> {
  const next = { ...patch, updatedAt: nowIso() }
  await db.tours.update(id, next)
  notifyDataChanged()
}

export async function createShop(input: CreateShopInput): Promise<Shop> {
  const existing = await db.shops.where('tourId').equals(input.tourId).sortBy('order')
  const timestamp = nowIso()
  const shop: Shop = {
    id: makeId(),
    tourId: input.tourId,
    name: input.name.trim(),
    appointmentTime: input.appointmentTime || null,
    memo: input.memo.trim(),
    order: (existing.at(-1)?.order ?? 0) + 100,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.transaction('rw', db.shops, db.tours, async () => {
    await db.shops.add(shop)
    await db.tours.update(input.tourId, { updatedAt: timestamp })
  })
  notifyDataChanged()
  return shop
}

export async function patchShop(id: string, patch: Partial<Shop>): Promise<void> {
  const shop = await db.shops.get(id)
  if (!shop) return
  const timestamp = nowIso()
  await db.transaction('rw', db.shops, db.tours, async () => {
    await db.shops.update(id, { ...patch, updatedAt: timestamp })
    await db.tours.update(shop.tourId, { updatedAt: timestamp })
  })
  notifyDataChanged()
}

export async function moveShop(tourId: string, shopId: string, direction: -1 | 1): Promise<void> {
  const shops = await db.shops.where('tourId').equals(tourId).sortBy('order')
  const index = shops.findIndex((shop) => shop.id === shopId)
  const target = shops[index + direction]
  const current = shops[index]
  if (!current || !target) return
  const timestamp = nowIso()
  await db.transaction('rw', db.shops, db.tours, async () => {
    await db.shops.update(current.id, { order: target.order, updatedAt: timestamp })
    await db.shops.update(target.id, { order: current.order, updatedAt: timestamp })
    await db.tours.update(tourId, { updatedAt: timestamp })
  })
  notifyDataChanged()
}

export async function createDress(tourId: string, shopId: string): Promise<Dress> {
  const existing = await db.dresses.where('shopId').equals(shopId).sortBy('order')
  const timestamp = nowIso()
  const dress: Dress = {
    id: makeId(),
    tourId,
    shopId,
    name: `드레스 ${existing.length + 1}`,
    order: (existing.at(-1)?.order ?? 0) + 100,
    style: copyDefaultStyle(),
    quickTags: [],
    memo: '',
    isFavorite: false,
    clientRevision: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.transaction('rw', db.dresses, db.tours, async () => {
    await db.dresses.add(dress)
    await db.tours.update(tourId, { updatedAt: timestamp })
  })
  notifyDataChanged()
  return dress
}

export async function duplicateDress(dressId: string): Promise<Dress | null> {
  const source = await db.dresses.get(dressId)
  if (!source) return null
  const siblings = await db.dresses.where('shopId').equals(source.shopId).sortBy('order')
  const timestamp = nowIso()
  const clone: Dress = {
    ...source,
    id: makeId(),
    name: `드레스 ${siblings.length + 1}`,
    order: (siblings.at(-1)?.order ?? 0) + 100,
    style: { ...source.style, details: [...source.style.details] },
    quickTags: [...source.quickTags],
    memo: '',
    clientRevision: 0,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  await db.transaction('rw', db.dresses, db.tours, async () => {
    await db.dresses.add(clone)
    await db.tours.update(source.tourId, { updatedAt: timestamp })
  })
  notifyDataChanged()
  return clone
}

export async function patchDress(id: string, patch: Partial<Dress>): Promise<void> {
  const dress = await db.dresses.get(id)
  if (!dress) return
  const timestamp = nowIso()
  await db.transaction('rw', db.dresses, db.tours, async () => {
    await db.dresses.update(id, { ...patch, updatedAt: timestamp })
    await db.tours.update(dress.tourId, { updatedAt: timestamp })
  })
  notifyDataChanged()
}

export async function moveDress(shopId: string, dressId: string, direction: -1 | 1): Promise<void> {
  const dresses = await db.dresses.where('shopId').equals(shopId).sortBy('order')
  const index = dresses.findIndex((dress) => dress.id === dressId)
  const target = dresses[index + direction]
  const current = dresses[index]
  if (!current || !target) return
  const timestamp = nowIso()
  await db.transaction('rw', db.dresses, db.tours, async () => {
    await db.dresses.update(current.id, { order: target.order, updatedAt: timestamp })
    await db.dresses.update(target.id, { order: current.order, updatedAt: timestamp })
    await db.tours.update(current.tourId, { updatedAt: timestamp })
  })
  notifyDataChanged()
}

export async function deleteDress(dressId: string): Promise<DeletedDressSnapshot | null> {
  const dress = await db.dresses.get(dressId)
  if (!dress) return null
  await db.transaction('rw', db.dresses, db.tours, async () => {
    await db.dresses.delete(dressId)
    await db.tours.update(dress.tourId, { updatedAt: nowIso() })
  })
  notifyDataChanged()
  return { dress }
}

export async function restoreDress(snapshot: DeletedDressSnapshot): Promise<void> {
  await db.transaction('rw', db.dresses, db.tours, async () => {
    await db.dresses.put(snapshot.dress)
    await db.tours.update(snapshot.dress.tourId, { updatedAt: nowIso() })
  })
  notifyDataChanged()
}

export async function deleteShop(shopId: string): Promise<DeletedShopSnapshot | null> {
  const shop = await db.shops.get(shopId)
  if (!shop) return null
  const dresses = await db.dresses.where('shopId').equals(shopId).toArray()
  await db.transaction('rw', db.shops, db.dresses, db.tours, async () => {
    await db.dresses.bulkDelete(dresses.map((dress) => dress.id))
    await db.shops.delete(shopId)
    await db.tours.update(shop.tourId, { updatedAt: nowIso() })
  })
  notifyDataChanged()
  return { shop, dresses }
}

export async function restoreShop(snapshot: DeletedShopSnapshot): Promise<void> {
  await db.transaction('rw', db.shops, db.dresses, db.tours, async () => {
    await db.shops.put(snapshot.shop)
    if (snapshot.dresses.length > 0) await db.dresses.bulkPut(snapshot.dresses)
    await db.tours.update(snapshot.shop.tourId, { updatedAt: nowIso() })
  })
  notifyDataChanged()
}

export async function deleteTour(tourId: string): Promise<DeletedTourSnapshot | null> {
  const aggregate = await getTourAggregate(tourId)
  if (!aggregate) return null
  await db.transaction('rw', db.tours, db.shops, db.dresses, db.assets, async () => {
    await db.assets.where('tourId').equals(tourId).delete()
    await db.dresses.where('tourId').equals(tourId).delete()
    await db.shops.where('tourId').equals(tourId).delete()
    await db.tours.delete(tourId)
  })
  notifyDataChanged()
  return { aggregate }
}

export async function restoreTour(snapshot: DeletedTourSnapshot): Promise<void> {
  const { aggregate } = snapshot
  await db.transaction('rw', db.tours, db.shops, db.dresses, db.assets, async () => {
    await db.tours.put(aggregate.tour)
    if (aggregate.shops.length > 0) await db.shops.bulkPut(aggregate.shops)
    if (aggregate.dresses.length > 0) await db.dresses.bulkPut(aggregate.dresses)
    if (aggregate.assets.length > 0) await db.assets.bulkPut(aggregate.assets)
  })
  notifyDataChanged()
}

export async function putFaceAsset(
  tourId: string,
  input: Omit<LocalAsset, 'id' | 'tourId' | 'type' | 'createdAt' | 'updatedAt'>,
): Promise<LocalAsset> {
  const tour = await db.tours.get(tourId)
  if (!tour) throw new Error('투어를 찾을 수 없습니다.')
  const previousId = tour.faceConfig.assetId
  const timestamp = nowIso()
  const asset: LocalAsset = {
    id: makeId(),
    tourId,
    type: 'face',
    ...input,
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  const faceConfig: FaceTransform = {
    ...tour.faceConfig,
    assetId: asset.id,
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  }
  await db.transaction('rw', db.assets, db.tours, async () => {
    await db.assets.put(asset)
    if (previousId) await db.assets.delete(previousId)
    await db.tours.update(tourId, { faceConfig, updatedAt: timestamp })
  })
  notifyDataChanged()
  return asset
}

export async function deleteFaceAsset(tourId: string): Promise<void> {
  const tour = await db.tours.get(tourId)
  if (!tour) return
  const timestamp = nowIso()
  await db.transaction('rw', db.assets, db.tours, async () => {
    if (tour.faceConfig.assetId) await db.assets.delete(tour.faceConfig.assetId)
    await db.tours.update(tourId, {
      faceConfig: { ...defaultFaceTransform },
      updatedAt: timestamp,
    })
  })
  notifyDataChanged()
}

export async function getAsset(assetId: string | null): Promise<LocalAsset | null> {
  if (!assetId) return null
  return (await db.assets.get(assetId)) ?? null
}

export async function replaceTourAggregate(
  aggregate: TourAggregate,
  mode: ImportMode,
): Promise<void> {
  await assertAggregateIntegrity(aggregate)
  await db.transaction('rw', db.tours, db.shops, db.dresses, db.assets, async () => {
    if (mode === 'overwrite') {
      await db.assets.where('tourId').equals(aggregate.tour.id).delete()
      await db.dresses.where('tourId').equals(aggregate.tour.id).delete()
      await db.shops.where('tourId').equals(aggregate.tour.id).delete()
      await db.tours.delete(aggregate.tour.id)
    }
    await db.tours.add(aggregate.tour)
    if (aggregate.shops.length > 0) await db.shops.bulkAdd(aggregate.shops)
    if (aggregate.dresses.length > 0) await db.dresses.bulkAdd(aggregate.dresses)
    if (aggregate.assets.length > 0) await db.assets.bulkAdd(aggregate.assets)
  })
  const restored = await getTourAggregate(aggregate.tour.id)
  if (!restored) throw new Error('불러온 기록을 저장하지 못했습니다.')
  await assertAggregateIntegrity(restored)
  await setSetting('lastOpenedTourId', aggregate.tour.id)
  notifyDataChanged()
}

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', db.tours, db.shops, db.dresses, db.assets, db.settings, async () => {
    await Promise.all([
      db.tours.clear(),
      db.shops.clear(),
      db.dresses.clear(),
      db.assets.clear(),
      db.settings.clear(),
    ])
  })
  notifyDataChanged()
}

export async function getSetting<T>(key: string): Promise<T | undefined> {
  return (await db.settings.get(key))?.value as T | undefined
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  const setting: AppSetting = { key, value }
  await db.settings.put(setting)
}

export async function getStorageStats(): Promise<{
  tourCount: number
  shopCount: number
  dressCount: number
  assetBytes: number
}> {
  const [tourCount, shopCount, dressCount, assets] = await Promise.all([
    db.tours.count(),
    db.shops.count(),
    db.dresses.count(),
    db.assets.toArray(),
  ])
  return {
    tourCount,
    shopCount,
    dressCount,
    assetBytes: assets.reduce((sum, asset) => sum + asset.byteSize, 0),
  }
}

export async function assertAggregateIntegrity(aggregate: TourAggregate): Promise<void> {
  const shopIds = new Set(aggregate.shops.map((shop) => shop.id))
  const assetIds = new Set(aggregate.assets.map((asset) => asset.id))

  if (aggregate.shops.some((shop) => shop.tourId !== aggregate.tour.id)) {
    throw new Error('샵 참조가 올바르지 않습니다.')
  }
  if (
    aggregate.dresses.some(
      (dress) => dress.tourId !== aggregate.tour.id || !shopIds.has(dress.shopId),
    )
  ) {
    throw new Error('드레스 참조가 올바르지 않습니다.')
  }
  if (aggregate.assets.some((asset) => asset.tourId !== aggregate.tour.id)) {
    throw new Error('사진 참조가 올바르지 않습니다.')
  }
  if (
    aggregate.tour.faceConfig.assetId &&
    !assetIds.has(aggregate.tour.faceConfig.assetId)
  ) {
    throw new Error('얼굴 사진 참조가 올바르지 않습니다.')
  }
}
