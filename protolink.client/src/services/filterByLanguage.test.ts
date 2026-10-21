import { describe, expect, it } from 'vitest'
import { filterByLanguage } from './filterByLanguage'

const LANG_RU = '00010002-0001-0000-0000-000000000000'
const LANG_EN = '00010002-0002-0000-0000-000000000000'

const getLanguageId = (code: string): string | undefined => {
  if (code === 'ru-RU') return LANG_RU
  if (code === 'en-US') return LANG_EN
  return undefined
}

describe('filterByLanguage', () => {
  const untagged = { id: 'u1', parents: ['some-folder-id'] }
  const ruOnly = { id: 'r1', parents: [LANG_RU, 'news-catalog'] }
  const enOnly = { id: 'e1', parentIds: [LANG_EN] }
  const both = { id: 'b1', Parents: [LANG_RU, LANG_EN] }

  it('shows untagged entities for every language', () => {
    const forRu = filterByLanguage([untagged], 'ru-RU', getLanguageId)
    const forEn = filterByLanguage([untagged], 'en-US', getLanguageId)
    expect(forRu.map((e) => e.id)).toEqual(['u1'])
    expect(forEn.map((e) => e.id)).toEqual(['u1'])
  })

  it('hides ru-RU-tagged entities from en-US listings', () => {
    const forEn = filterByLanguage([untagged, ruOnly, enOnly], 'en-US', getLanguageId)
    expect(forEn.map((e) => e.id)).toEqual(['u1', 'e1'])
  })

  it('shows ru-RU-tagged entities for ru-RU', () => {
    const forRu = filterByLanguage([untagged, ruOnly, enOnly], 'ru-RU', getLanguageId)
    expect(forRu.map((e) => e.id)).toEqual(['u1', 'r1'])
  })

  it('shows multi-tagged entities in each tagged language', () => {
    expect(filterByLanguage([both], 'ru-RU', getLanguageId).map((e) => e.id)).toEqual(['b1'])
    expect(filterByLanguage([both], 'en-US', getLanguageId).map((e) => e.id)).toEqual(['b1'])
  })
})
