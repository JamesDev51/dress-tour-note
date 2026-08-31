import { copyDefaultStyle, defaultFaceTransform } from '../../../domain/options'
import type { ExportPayload, TourAggregate } from '../../../domain/types'
import { createExportPayload, parseExportPayload, remapPayloadIds } from '../payload'

const aggregate: TourAggregate = {
  tour: {
    id: 'tour-1',
    schemaVersion: 1,
    title: '테스트 투어',
    brideName: '히똥',
    tourDate: '2026-12-13',
    memo: '전체 메모',
    status: 'active',
    faceConfig: { ...defaultFaceTransform },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  shops: [
    {
      id: 'shop-1',
      tourId: 'tour-1',
      name: '샵 A',
      appointmentTime: '11:00',
      memo: '',
      order: 100,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  dresses: [
    {
      id: 'dress-1',
      tourId: 'tour-1',
      shopId: 'shop-1',
      name: '드레스 1',
      order: 100,
      style: { ...copyDefaultStyle(), details: ['beading'] },
      quickTags: ['bridePick'],
      memo: '허리가 예쁨',
      isFavorite: true,
      clientRevision: 3,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  assets: [],
}

describe('editable PDF payload', () => {
  it('serializes and validates a complete aggregate', () => {
    const { payload } = createExportPayload(aggregate, false)
    const parsed = parseExportPayload(JSON.parse(JSON.stringify(payload)))
    expect(parsed.tour.id).toBe('tour-1')
    expect(parsed.dresses[0]?.memo).toBe('허리가 예쁨')
    expect(parsed.tour.faceConfig.assetId).toBeNull()
  })

  it('rejects broken dress-to-shop references', () => {
    const { payload } = createExportPayload(aggregate, false)
    const invalid: ExportPayload = {
      ...payload,
      dresses: payload.dresses.map((dress) => ({ ...dress, shopId: 'missing-shop' })),
    }
    expect(() => parseExportPayload(invalid)).toThrow('드레스 참조')
  })

  it('remaps every linked id for copy import', () => {
    const { payload } = createExportPayload(aggregate, false)
    const copied = remapPayloadIds(payload)
    expect(copied.tour.id).not.toBe(payload.tour.id)
    expect(copied.shops[0]?.tourId).toBe(copied.tour.id)
    expect(copied.dresses[0]?.tourId).toBe(copied.tour.id)
    expect(copied.dresses[0]?.shopId).toBe(copied.shops[0]?.id)
  })
})
