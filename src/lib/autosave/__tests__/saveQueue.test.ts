import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useSaveStore } from '../../../shared/stores'
import {
  flushPendingSaves,
  getPendingSaveCount,
  queueDressPatch,
  resetSaveQueueForTests,
  retryPendingSaves,
} from '../saveQueue'
import { patchDress } from '../../db/repositories'

vi.mock('../../db/repositories', () => ({
  patchDress: vi.fn(),
  patchTour: vi.fn(),
}))

const patchDressMock = vi.mocked(patchDress)

beforeEach(() => {
  resetSaveQueueForTests()
  patchDressMock.mockReset()
})

afterEach(() => {
  resetSaveQueueForTests()
})

describe('autosave queue', () => {
  it('merges rapid changes and flushes the final values once', async () => {
    patchDressMock.mockResolvedValue(undefined)
    queueDressPatch('dress-1', 'tour-1', { memo: '첫 글자' }, 10_000)
    queueDressPatch('dress-1', 'tour-1', { memo: '마지막 글자', isFavorite: true }, 10_000)

    await flushPendingSaves('tour-1')

    expect(patchDressMock).toHaveBeenCalledTimes(1)
    expect(patchDressMock).toHaveBeenCalledWith(
      'dress-1',
      expect.objectContaining({ memo: '마지막 글자', isFavorite: true }),
    )
    expect(getPendingSaveCount()).toBe(0)
    expect(useSaveStore.getState().state).toBe('saved')
  })

  it('keeps a failed patch pending without an infinite retry loop', async () => {
    patchDressMock.mockRejectedValueOnce(new Error('disk unavailable'))
    queueDressPatch('dress-1', 'tour-1', { memo: '안전하게 남아야 함' }, 10_000)

    await expect(flushPendingSaves('tour-1')).rejects.toThrow('disk unavailable')
    expect(patchDressMock).toHaveBeenCalledTimes(1)
    expect(getPendingSaveCount()).toBe(1)
    expect(useSaveStore.getState().state).toBe('error')

    patchDressMock.mockResolvedValueOnce(undefined)
    await retryPendingSaves()
    expect(patchDressMock).toHaveBeenCalledTimes(2)
    expect(getPendingSaveCount()).toBe(0)
    expect(useSaveStore.getState().state).toBe('saved')
  })
})
