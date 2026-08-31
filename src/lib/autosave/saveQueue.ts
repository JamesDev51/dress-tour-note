import type { Dress, Tour } from '../../domain/types'
import { useSaveStore } from '../../shared/stores'
import { isQuotaError } from '../../shared/utils'
import { patchDress, patchTour } from '../db/repositories'

type EntityKind = 'dress' | 'tour'

type PendingPatch = {
  key: string
  kind: EntityKind
  id: string
  tourId: string
  patch: Partial<Dress> | Partial<Tour>
  timer: number | null
}

const pending = new Map<string, PendingPatch>()
const chains = new Map<string, Promise<void>>()
const chainTourIds = new Map<string, string>()
let inFlight = 0

function keyFor(kind: EntityKind, id: string): string {
  return `${kind}:${id}`
}

function updateSaveStateAfterWork(): void {
  if (inFlight === 0 && pending.size === 0 && useSaveStore.getState().state === 'saving') {
    useSaveStore.getState().setSaved()
  }
}

function enqueue(
  kind: EntityKind,
  id: string,
  tourId: string,
  patch: Partial<Dress> | Partial<Tour>,
  delay: number,
): void {
  const key = keyFor(kind, id)
  const current = pending.get(key)
  if (current?.timer !== null && current?.timer !== undefined) window.clearTimeout(current.timer)
  const entry: PendingPatch = {
    key,
    kind,
    id,
    tourId,
    patch: { ...(current?.patch ?? {}), ...patch },
    timer: null,
  }
  entry.timer = window.setTimeout(() => {
    void flushKey(key).catch(() => undefined)
  }, Math.max(0, delay))
  pending.set(key, entry)
  useSaveStore.getState().setSaving()
}

export function queueDressPatch(
  id: string,
  tourId: string,
  patch: Partial<Dress>,
  delay = 0,
): void {
  enqueue('dress', id, tourId, patch, delay)
}

export function queueTourPatch(id: string, patch: Partial<Tour>, delay = 0): void {
  enqueue('tour', id, id, patch, delay)
}

async function persistEntry(entry: PendingPatch): Promise<void> {
  if (entry.kind === 'dress') {
    await patchDress(entry.id, entry.patch as Partial<Dress>)
  } else {
    await patchTour(entry.id, entry.patch as Partial<Tour>)
  }
}

async function flushKey(key: string): Promise<void> {
  const entry = pending.get(key)
  if (!entry) {
    await (chains.get(key) ?? Promise.resolve())
    return
  }
  if (entry.timer !== null) window.clearTimeout(entry.timer)
  pending.delete(key)

  const previous = chains.get(key) ?? Promise.resolve()
  const operation = previous
    .catch(() => undefined)
    .then(async () => {
      inFlight += 1
      useSaveStore.getState().setSaving()
      try {
        await persistEntry(entry)
      } catch (error) {
        const newer = pending.get(key)
        if (newer?.timer !== null && newer?.timer !== undefined) window.clearTimeout(newer.timer)
        pending.set(key, {
          ...entry,
          patch: { ...entry.patch, ...(newer?.patch ?? {}) },
          timer: null,
        })
        useSaveStore
          .getState()
          .setError(
            isQuotaError(error)
              ? '저장 공간이 부족해 변경 내용을 저장하지 못했습니다.'
              : '변경 내용을 저장하지 못했습니다. 다시 시도해주세요.',
            isQuotaError(error),
          )
        throw error
      } finally {
        inFlight -= 1
      }
    })

  chains.set(key, operation)
  chainTourIds.set(key, entry.tourId)
  let succeeded = false
  try {
    await operation
    succeeded = true
  } finally {
    if (chains.get(key) === operation) {
      chains.delete(key)
      chainTourIds.delete(key)
    }
    if (succeeded && pending.has(key)) await flushKey(key)
    updateSaveStateAfterWork()
  }
}

export async function flushPendingSaves(tourId?: string): Promise<void> {
  const keys = [...pending.values()]
    .filter((entry) => !tourId || entry.tourId === tourId)
    .map((entry) => entry.key)
  await Promise.all(keys.map((key) => flushKey(key)))

  const active = [...chains.entries()]
    .filter(([key]) => !tourId || chainTourIds.get(key) === tourId)
    .map(([, promise]) => promise)
  await Promise.all(active)
  updateSaveStateAfterWork()
}

export async function retryPendingSaves(): Promise<void> {
  useSaveStore.getState().setSaving()
  await flushPendingSaves()
}

export function clearPendingSavesForTour(tourId: string): void {
  for (const [key, entry] of pending) {
    if (entry.tourId !== tourId) continue
    if (entry.timer !== null) window.clearTimeout(entry.timer)
    pending.delete(key)
  }
  updateSaveStateAfterWork()
}

export function getPendingSaveCount(): number {
  return pending.size + inFlight
}

export function resetSaveQueueForTests(): void {
  for (const entry of pending.values()) {
    if (entry.timer !== null) window.clearTimeout(entry.timer)
  }
  pending.clear()
  chains.clear()
  chainTourIds.clear()
  inFlight = 0
  useSaveStore.setState({ state: 'saved', errorMessage: null, lastSavedAt: null })
}
