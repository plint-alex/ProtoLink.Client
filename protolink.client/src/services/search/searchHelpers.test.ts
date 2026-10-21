import { describe, it, expect } from 'vitest'
import {
    buildSearchUrl,
    flattenIdleRows,
    groupSearchItems,
    isSearchHotkey,
    parseEntityIdFromSegment,
    pushRecentEntity,
    pushRecentQuery,
    readRecentEntities,
    readRecentQueries,
    removeRecentQuery,
    resolveUiState,
    t,
    visibleSections,
} from './searchHelpers'

function memStorage() {
    const data: Record<string, string> = {}
    return {
        getItem: (k: string) => data[k] ?? null,
        setItem: (k: string, v: string) => {
            data[k] = String(v)
        },
    }
}

describe('searchHelpers', () => {
    it('parses GUID and GUID-slug path segments (C2)', () => {
        const id = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
        expect(parseEntityIdFromSegment(id)).toBe(id)
        expect(parseEntityIdFromSegment(`${id}-hello-world`)).toBe(id)
        expect(parseEntityIdFromSegment(`${id}-stale-title`)).toBe(id)
        expect(parseEntityIdFromSegment('search')).toBeNull()
        expect(parseEntityIdFromSegment('login')).toBeNull()
        expect(parseEntityIdFromSegment(null)).toBeNull()
    })

    it('groups sections and hides empty', () => {
        const items = [
            { id: '1', title: 'A', typeTag: 'CloudFile', score: 400 },
            { id: '2', title: 'B', typeTag: 'CloudFolder', score: 600 },
            { id: '3', title: 'C', code: 'notes-page', typeTag: 'notes-page', score: 400 },
            { id: '4', title: 'D', typeTag: 'Weird', score: 200 },
        ]
        const buckets = groupSearchItems(items, 'report')
        expect(visibleSections(buckets).map((s) => s.key)).toEqual([
            'folders',
            'files',
            'notes',
            'other',
        ])
    })

    it('resolves UI states', () => {
        expect(resolveUiState({ query: '' })).toBe('idle')
        expect(resolveUiState({ query: 'a' })).toBe('tooShort')
        expect(resolveUiState({ query: 'ab', loading: true, hasItems: false })).toBe('loading')
        expect(resolveUiState({ query: 'ab', loading: false, hasItems: false })).toBe('noResults')
        expect(
            resolveUiState({
                query: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
                loading: false,
                hasItems: false,
            })
        ).toBe('noAccess')
    })

    it('stores recent queries and entities', () => {
        const mem = memStorage()
        pushRecentQuery(mem, 'one')
        pushRecentQuery(mem, 'two')
        pushRecentQuery(mem, 'one')
        expect(readRecentQueries(mem)).toEqual(['one', 'two'])
        expect(removeRecentQuery(mem, 'one')).toEqual(['two'])

        pushRecentEntity(mem, {
            id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
            title: 'Alpha',
        })
        pushRecentEntity(mem, {
            id: 'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
            title: 'Beta',
        })
        pushRecentEntity(mem, {
            id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
            title: 'Alpha2',
        })
        const ents = readRecentEntities(mem)
        expect(ents.map((e) => e.id)).toEqual([
            'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
            'bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee',
        ])
        expect(ents[0].title).toBe('Alpha2')
    })

    it('flattens idle rows entities then queries', () => {
        const rows = flattenIdleRows(
            [{ id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', title: 'A' }],
            ['q1']
        )
        expect(rows).toHaveLength(2)
        expect(rows[0].kind).toBe('entity')
        expect(rows[1].kind).toBe('query')
    })

    it('builds search URL and copy', () => {
        expect(buildSearchUrl('/search', { q: 'report', lang: 'en-US' })).toBe(
            '/search?q=report&lang=en-US'
        )
        expect(t('en-US', 'seeAll')).toBe('See all results')
        expect(t('ru-RU', 'seeAll')).toBe('Все результаты')
    })

    it('detects Ctrl/Cmd+K hotkey', () => {
        expect(isSearchHotkey({ key: 'k', ctrlKey: true, metaKey: false })).toBe(true)
        expect(isSearchHotkey({ key: 'K', metaKey: true, ctrlKey: false })).toBe(true)
        expect(isSearchHotkey({ key: 'k', ctrlKey: false, metaKey: false })).toBe(false)
    })
})
