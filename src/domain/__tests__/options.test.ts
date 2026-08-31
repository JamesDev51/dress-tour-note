import {
  applyCompatibilityRules,
  copyDefaultStyle,
  getDetailedStyleLabels,
  toggleDressDetail,
} from '../options'

describe('dress option rules', () => {
  it('keeps only minimal when minimal detail is selected', () => {
    expect(toggleDressDetail(['beading', 'pearl'], 'minimal')).toEqual(['minimal'])
    expect(toggleDressDetail(['minimal'], 'minimal')).toEqual([])
  })

  it('removes minimal when a decorative detail is selected', () => {
    expect(toggleDressDetail(['minimal'], 'bow')).toEqual(['bow'])
  })

  it('aligns one-shoulder upper style with asymmetric neckline', () => {
    const style = { ...copyDefaultStyle(), neckline: 'sweetheart' as const, upperStyle: 'oneShoulder' as const }
    const result = applyCompatibilityRules(style, 'upperStyle')
    expect(result.style.neckline).toBe('asymmetric')
    expect(result.changedMessage).toContain('비대칭')
  })

  it('uses a compatible neckline for halter', () => {
    const style = { ...copyDefaultStyle(), neckline: 'square' as const, upperStyle: 'halter' as const }
    const result = applyCompatibilityRules(style, 'neckline')
    expect(result.style.neckline).toBe('vNeck')
  })

  it('creates a complete Korean descriptor list', () => {
    const labels = getDetailedStyleLabels(copyDefaultStyle())
    expect(labels).toHaveLength(9)
    expect(labels.map((item) => item.label)).toContain('치마')
    expect(labels.map((item) => item.label)).toContain('뒷모습')
  })
})
