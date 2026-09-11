# PERSISTENCE LAYER

## OVERVIEW

Dexie/IndexedDB is the canonical store for tours, shops, dresses, face assets, and metadata; this directory owns schema and mutations.

## STRUCTURE

| File                   | Role                                                                        |
| ---------------------- | --------------------------------------------------------------------------- |
| `database.ts`          | `GudressDatabase`, schema version, table/index declarations, singleton `db` |
| `repositories.ts`      | CRUD, ordering, cascades, snapshots, import strategies, full reset          |
| `repositories.test.ts` | fake-IndexedDB integration coverage and database lifecycle                  |

## CONVENTIONS

- Keep persistent entity types in `src/types/domain.ts`; keep Dexie-specific metadata local here.
- Multi-table writes use `db.transaction` and update the parent tour timestamp in the same operation.
- Collection order is explicit integer `order`; deletion and reordering compact it back to contiguous values.
- Dress mutations normalize incompatible top/neckline combinations and cap details at four.
- Face replacement removes the old asset and initializes dress transforms atomically.
- `getTourSnapshot` returns sorted shops/dresses plus referenced local assets for export.
- Import `copy` remaps every tour/shop/dress/asset ID and cross-reference; `overwrite` replaces the complete aggregate.
- Request persistent browser storage after the first durable tour is created.

## ANTI-PATTERNS

- Do not persist domain state in Zustand as a parallel source of truth.
- Do not change a Dexie index or stored shape without an explicit schema-version migration decision.
- Do not split cascade operations across transactions or leave orphaned dresses/assets.
- Do not preserve stale ordering after deletion, duplication, import, or reorder.
- Do not mutate imported snapshots before validation in the portable/PDF boundary.
- Do not make face removal leave `faceAssetId` or `faceTransform` references behind.

## VALIDATION

- Add repository integration coverage for changed transaction, cascade, remap, or ordering behavior.
- Tests use `fake-indexeddb/auto` from `src/testSetup.ts` and delete/reopen the database between cases.
- Run `npm test -- src/db/repositories.test.ts`, then `npm run typecheck`.
- Changes affecting immediate persistence also require the relevant Playwright reload/navigation journey.
