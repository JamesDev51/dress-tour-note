import Dexie, { type EntityTable } from 'dexie'
import type { AppSetting, Dress, LocalAsset, Shop, Tour } from '../../domain/types'

export class DressTourDB extends Dexie {
  tours!: EntityTable<Tour, 'id'>
  shops!: EntityTable<Shop, 'id'>
  dresses!: EntityTable<Dress, 'id'>
  assets!: EntityTable<LocalAsset, 'id'>
  settings!: EntityTable<AppSetting, 'key'>

  constructor(name = 'gudeureseu-db') {
    super(name)

    this.version(1).stores({
      tours: 'id, updatedAt, status',
      shops: 'id, tourId, [tourId+order], updatedAt',
      dresses: 'id, tourId, shopId, [shopId+order], isFavorite, updatedAt',
      assets: 'id, tourId, type, updatedAt',
      settings: 'key',
    })
  }
}

export const db = new DressTourDB()
