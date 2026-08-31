import Dexie, { type Table } from 'dexie';
import type { Dress, LocalAsset, Shop, Tour } from '../types/domain';

export interface MetaRecord { key:string; value:unknown }
export class GudressDatabase extends Dexie {
  tours!: Table<Tour,string>;
  shops!: Table<Shop,string>;
  dresses!: Table<Dress,string>;
  assets!: Table<LocalAsset,string>;
  meta!: Table<MetaRecord,string>;
  constructor(name='gudress') {
    super(name);
    this.version(1).stores({
      tours:'id, updatedAt, lastOpenedAt, status',
      shops:'id, tourId, [tourId+order]',
      dresses:'id, tourId, shopId, [shopId+order], isFavorite, updatedAt',
      assets:'id, tourId, kind',
      meta:'key'
    });
  }
}
export const db = new GudressDatabase();
