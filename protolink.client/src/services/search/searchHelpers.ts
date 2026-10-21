/**
 * Pure helpers for Client search palette (mirrored from ViewEditor views/search-helpers.cjs).
 * Spec: Agents/docs/features/telegram-entity-view-patterns/search (Pattern 6).
 */

export const GUID_RE =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/

/** Exact GUID, or GUID + decorative `-slug` (C2 / Notion-style — id alone resolves). */
const GUID_OR_GUID_SLUG_RE =
    /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(?:-.*)?$/
export const DIRECT_SCORE_MIN = 1000
export const RECENT_QUERIES_KEY = 'protolink.search.recentQueries'
export const RECENT_QUERIES_MAX = 5
export const RECENT_ENTITIES_KEY = 'protolink.search.recentEntities'
export const RECENT_ENTITIES_MAX = 8

export const SECTION_ORDER = [
    'direct',
    'folders',
    'files',
    'notes',
    'people',
    'other',
] as const

export type SearchSectionKey = (typeof SECTION_ORDER)[number]

export type SearchLang = 'en-US' | 'ru-RU'

export type RecentEntity = {
    id: string
    title: string
    typeTag?: string
    openedAt?: number
}

type CopyPack = Record<string, string>

const COPY: Record<SearchLang, CopyPack> = {
    'en-US': {
        placeholder: 'Search by name or paste an id',
        hint: 'Search your entities by name — or paste an id',
        paletteHint: 'Type to search · Enter opens full page',
        recentSearches: 'Recent searches',
        recent: 'Recent',
        seeAll: 'See all results',
        direct: 'Direct match',
        folders: 'Folders',
        files: 'Files',
        notes: 'Notes',
        people: 'People',
        other: 'Other',
        openEntity: 'Open this entity',
        copyLink: 'Copy link',
        linkCopied: 'Link copied',
        open: 'Open',
        more: 'More',
        clear: 'Clear',
        noResults: 'No results for “{q}”',
        tryShorter: 'Try a shorter word',
        signIn: 'Sign in to search your own entities',
        noAccess: 'You don’t have access to this item',
        partial: 'Showing partial results — narrow your search',
        rateLimited: 'Too many searches, try again in a moment',
        error: 'Search didn’t work. Try again.',
        details: 'Details',
    },
    'ru-RU': {
        placeholder: 'Поиск по названию или вставьте id',
        hint: 'Ищите сущности по названию — или вставьте id',
        paletteHint: 'Начните ввод · Enter откроет полную страницу',
        recentSearches: 'Недавние запросы',
        recent: 'Недавние',
        seeAll: 'Все результаты',
        direct: 'Точное совпадение',
        folders: 'Папки',
        files: 'Файлы',
        notes: 'Заметки',
        people: 'Люди',
        other: 'Другое',
        openEntity: 'Открыть эту сущность',
        copyLink: 'Копировать ссылку',
        linkCopied: 'Ссылка скопирована',
        open: 'Открыть',
        more: 'Ещё',
        clear: 'Очистить',
        noResults: 'Ничего не найдено по запросу «{q}»',
        tryShorter: 'Попробуйте более короткое слово',
        signIn: 'Войдите, чтобы искать свои сущности',
        noAccess: 'У вас нет доступа к этому элементу',
        partial: 'Показаны неполные результаты — уточните запрос',
        rateLimited: 'Слишком много запросов, попробуйте чуть позже',
        error: 'Поиск не сработал. Попробуйте ещё раз.',
        details: 'Подробности',
    },
}

export type StorageLike = {
    getItem(key: string): string | null
    setItem(key: string, value: string): void
}

export function isGuid(value: string | undefined | null): boolean {
    return typeof value === 'string' && GUID_RE.test(value.trim())
}

/**
 * First path segment → entity id when it is a GUID or `/{guid}-{slug}`.
 * Wrong/stale slug is ignored; D4 codes (non-GUID segments) return null.
 */
export function parseEntityIdFromSegment(segment: string | undefined | null): string | null {
    if (typeof segment !== 'string') return null
    const trimmed = segment.trim()
    if (!trimmed) return null
    const match = GUID_OR_GUID_SLUG_RE.exec(trimmed)
    return match ? match[1] : null
}

export function normalizeLang(lang: string | undefined | null): SearchLang {
    if (!lang) return 'en-US'
    return String(lang).toLowerCase().indexOf('ru') === 0 ? 'ru-RU' : 'en-US'
}

export function t(lang: string | undefined, key: string, vars?: Record<string, string>): string {
    const pack = COPY[normalizeLang(lang)] || COPY['en-US']
    let text = pack[key] != null ? pack[key] : COPY['en-US'][key] || key
    if (vars) {
        Object.keys(vars).forEach((k) => {
            text = String(text).split(`{${k}}`).join(String(vars[k]))
        })
    }
    return text
}

export function itemField(
    item: Record<string, unknown> | null | undefined,
    camel: string,
    pascal?: string
): unknown {
    if (!item) return undefined
    if (item[camel] !== undefined) return item[camel]
    if (pascal && item[pascal] !== undefined) return item[pascal]
    return undefined
}

export function isDirectMatchItem(
    item: Record<string, unknown> | null | undefined,
    query: string
): boolean {
    if (!item) return false
    const score = Number(itemField(item, 'score', 'Score') || 0)
    if (score >= DIRECT_SCORE_MIN) return true
    const q = String(query || '')
        .trim()
        .toLowerCase()
    if (!q) return false
    const id = String(itemField(item, 'id', 'Id') || '').toLowerCase()
    const code = String(itemField(item, 'code', 'Code') || '').toLowerCase()
    return (isGuid(q) && id === q) || (!!code && code === q)
}

export function classifySection(
    item: Record<string, unknown>,
    query: string
): SearchSectionKey {
    if (isDirectMatchItem(item, query)) return 'direct'
    const tag = String(itemField(item, 'typeTag', 'TypeTag') || itemField(item, 'code', 'Code') || '')
        .trim()
        .toLowerCase()
    if (tag === 'cloudfolder' || tag === 'cloudroot') return 'folders'
    if (tag === 'cloudfile') return 'files'
    if (
        tag === 'note' ||
        tag === 'notes' ||
        tag.indexOf('note') === 0 ||
        tag.indexOf('notes') === 0
    ) {
        return 'notes'
    }
    if (
        tag === 'user' ||
        tag === 'person' ||
        tag === 'people' ||
        tag === 'contact' ||
        tag.indexOf('user') === 0
    ) {
        return 'people'
    }
    return 'other'
}

export type SearchBuckets = Record<SearchSectionKey, Record<string, unknown>[]>

export function groupSearchItems(
    items: Record<string, unknown>[] | undefined,
    query: string
): SearchBuckets {
    const list = Array.isArray(items) ? items : []
    const buckets: SearchBuckets = {
        direct: [],
        folders: [],
        files: [],
        notes: [],
        people: [],
        other: [],
    }
    let directId: string | null = null
    for (const item of list) {
        const section = classifySection(item, query)
        if (section === 'direct') {
            if (buckets.direct.length === 0) {
                buckets.direct.push(item)
                directId = String(itemField(item, 'id', 'Id') || '').toLowerCase()
            }
            continue
        }
        const id = String(itemField(item, 'id', 'Id') || '').toLowerCase()
        if (directId && id === directId) continue
        buckets[section].push(item)
    }
    return buckets
}

export function visibleSections(
    buckets: SearchBuckets
): { key: SearchSectionKey; items: Record<string, unknown>[] }[] {
    const out: { key: SearchSectionKey; items: Record<string, unknown>[] }[] = []
    for (const key of SECTION_ORDER) {
        const rows = buckets[key] || []
        if (rows.length) out.push({ key, items: rows })
    }
    return out
}

export function flattenVisibleRows(
    buckets: SearchBuckets
): { section: SearchSectionKey; item: Record<string, unknown> }[] {
    const sections = visibleSections(buckets)
    const rows: { section: SearchSectionKey; item: Record<string, unknown> }[] = []
    for (const sec of sections) {
        for (const item of sec.items) {
            rows.push({ section: sec.key, item })
        }
    }
    return rows
}

export function formatBreadcrumb(
    path: unknown,
    collapse: boolean
): string {
    const segments: string[] = []
    const list = Array.isArray(path) ? path : []
    for (const entry of list) {
        const title = itemField(entry as Record<string, unknown>, 'title', 'Title')
        if (title != null && String(title).trim()) segments.push(String(title).trim())
    }
    if (!segments.length) return ''
    if (!collapse || segments.length <= 2) return segments.join(' › ')
    return `… › ${segments.slice(-2).join(' › ')}`
}

export function splitTitleMatch(
    title: string | null | undefined,
    query: string | null | undefined
): { text: string; match: boolean }[] {
    const t0 = title == null ? '' : String(title)
    const q = query == null ? '' : String(query).trim()
    if (!t0 || !q || q.length < 2) return [{ text: t0, match: false }]
    const idx = t0.toLowerCase().indexOf(q.toLowerCase())
    if (idx < 0) return [{ text: t0, match: false }]
    const parts: { text: string; match: boolean }[] = []
    if (idx > 0) parts.push({ text: t0.slice(0, idx), match: false })
    parts.push({ text: t0.slice(idx, idx + q.length), match: true })
    if (idx + q.length < t0.length) parts.push({ text: t0.slice(idx + q.length), match: false })
    return parts
}

export function formatRelativeListTime(
    when: Date | string | number | null | undefined,
    now?: Date,
    lang?: string
): string {
    if (when == null || when === '') return ''
    const d = when instanceof Date ? when : new Date(when)
    if (isNaN(d.getTime())) return ''
    const n = now instanceof Date ? now : new Date()
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    const today = new Date(n.getFullYear(), n.getMonth(), n.getDate())
    const daysAgo = Math.round((today.getTime() - day.getTime()) / 86400000)
    const isRu = normalizeLang(lang) === 'ru-RU'

    if (daysAgo === 0) {
        const hh = d.getHours()
        const mm = d.getMinutes()
        return `${hh < 10 ? '0' : ''}${hh}:${mm < 10 ? '0' : ''}${mm}`
    }
    if (daysAgo >= 1 && daysAgo <= 6) {
        if (isRu) return ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'][d.getDay()]
        return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]
    }
    const ds = `${d.getDate() < 10 ? '0' : ''}${d.getDate()}`
    const ms = `${d.getMonth() + 1 < 10 ? '0' : ''}${d.getMonth() + 1}`
    if (d.getFullYear() === n.getFullYear()) return `${ds}.${ms}`
    return `${ds}.${ms}.${d.getFullYear()}`
}

export function avatarKindForSection(section: string): string {
    if (section === 'folders') return 'folder'
    if (section === 'notes') return 'notes'
    if (section === 'people') return 'people'
    if (section === 'files') return 'file'
    if (section === 'direct' || section === 'recent') return section === 'direct' ? 'direct' : 'other'
    return 'other'
}

export function isJumpToQuery(query: string): boolean {
    return isGuid(String(query || '').trim())
}

export type UiState =
    | 'idle'
    | 'tooShort'
    | 'loading'
    | 'rateLimited'
    | 'error'
    | 'noAccess'
    | 'noResults'
    | 'partial'
    | 'results'

export function resolveUiState(opts: {
    query?: string
    loading?: boolean
    hasItems?: boolean
    rateLimited?: boolean
    error?: string | boolean
    truncated?: boolean
    partialTimeout?: boolean
}): UiState {
    const q = String(opts.query || '').trim()
    if (!q) return 'idle'
    if (q.length < 2) return 'tooShort'
    if (opts.rateLimited) return 'rateLimited'
    if (opts.error && !opts.hasItems) return 'error'
    if (opts.loading && !opts.hasItems) return 'loading'
    if (!opts.loading && !opts.hasItems) return isJumpToQuery(q) ? 'noAccess' : 'noResults'
    if (opts.truncated || opts.partialTimeout) return 'partial'
    return 'results'
}

export function readRecentQueries(storage?: StorageLike | null): string[] {
    try {
        const raw = storage?.getItem?.(RECENT_QUERIES_KEY) ?? null
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed
            .map((x) => String(x || '').trim())
            .filter(Boolean)
            .slice(0, RECENT_QUERIES_MAX)
    } catch {
        return []
    }
}

export function pushRecentQuery(storage: StorageLike | null | undefined, query: string): string[] {
    const q = String(query || '').trim()
    if (q.length < 2) return readRecentQueries(storage)
    const prev = readRecentQueries(storage).filter((x) => x.toLowerCase() !== q.toLowerCase())
    const next = [q, ...prev].slice(0, RECENT_QUERIES_MAX)
    try {
        storage?.setItem?.(RECENT_QUERIES_KEY, JSON.stringify(next))
    } catch {
        /* ignore quota */
    }
    return next
}

export function removeRecentQuery(storage: StorageLike | null | undefined, query: string): string[] {
    const q = String(query || '')
        .trim()
        .toLowerCase()
    const next = readRecentQueries(storage).filter((x) => x.toLowerCase() !== q)
    try {
        storage?.setItem?.(RECENT_QUERIES_KEY, JSON.stringify(next))
    } catch {
        /* ignore */
    }
    return next
}

export function readRecentEntities(storage?: StorageLike | null): RecentEntity[] {
    try {
        const raw = storage?.getItem?.(RECENT_ENTITIES_KEY) ?? null
        if (!raw) return []
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return []
        return parsed
            .map((x) => {
                if (!x || typeof x !== 'object') return null
                const id = String((x as RecentEntity).id || '').trim()
                if (!isGuid(id)) return null
                const title = String((x as RecentEntity).title || id).trim() || id
                const typeTag = (x as RecentEntity).typeTag
                    ? String((x as RecentEntity).typeTag)
                    : undefined
                const openedAt = Number((x as RecentEntity).openedAt) || undefined
                return { id, title, typeTag, openedAt } as RecentEntity
            })
            .filter((x): x is RecentEntity => !!x)
            .slice(0, RECENT_ENTITIES_MAX)
    } catch {
        return []
    }
}

export function pushRecentEntity(
    storage: StorageLike | null | undefined,
    entity: RecentEntity
): RecentEntity[] {
    const id = String(entity?.id || '').trim()
    if (!isGuid(id)) return readRecentEntities(storage)
    const title = String(entity.title || id).trim() || id
    const prev = readRecentEntities(storage).filter((x) => x.id.toLowerCase() !== id.toLowerCase())
    const next = [
        { id, title, typeTag: entity.typeTag, openedAt: entity.openedAt ?? Date.now() },
        ...prev,
    ].slice(0, RECENT_ENTITIES_MAX)
    try {
        storage?.setItem?.(RECENT_ENTITIES_KEY, JSON.stringify(next))
    } catch {
        /* ignore */
    }
    return next
}

export function buildSearchUrl(
    pathname: string,
    params: { q?: string; in?: string; lang?: string }
): string {
    const url = new URL(pathname || '/search', 'https://protolink.local')
    if (params.q) url.searchParams.set('q', params.q)
    else url.searchParams.delete('q')
    if (params.in) url.searchParams.set('in', params.in)
    else url.searchParams.delete('in')
    if (params.lang) url.searchParams.set('lang', params.lang)
    return url.pathname + url.search
}

/** Idle keyboard rows: recent entities then recent queries. */
export type IdleNavRow =
    | { kind: 'entity'; entity: RecentEntity }
    | { kind: 'query'; query: string }

export function flattenIdleRows(
    recentEntities: RecentEntity[],
    recentQueries: string[]
): IdleNavRow[] {
    const rows: IdleNavRow[] = []
    for (const entity of recentEntities) rows.push({ kind: 'entity', entity })
    for (const query of recentQueries) rows.push({ kind: 'query', query })
    return rows
}

export function isSearchHotkey(e: KeyboardEvent | { key: string; metaKey: boolean; ctrlKey: boolean }): boolean {
    return (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)
}
