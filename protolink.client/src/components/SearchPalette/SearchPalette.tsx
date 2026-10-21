import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import {
    SEARCH_DEBOUNCE_MS,
    SEARCH_HIDE_TIME_PX,
    SEARCH_NARROW_PX,
    SEARCH_PAGE_SIZE,
    SEARCH_PALETTE_VISIBLE_ROWS,
    SEARCH_PAGE_CODE,
    SEARCH_SKELETON_MS,
} from '../../constants/searchPage'
import { useNavigationWithParams } from '../../hooks/useNavigationWithParams'
import { useAppSelector } from '../../store/store'
import {
    avatarKindForSection,
    buildSearchUrl,
    classifySection,
    flattenIdleRows,
    flattenVisibleRows,
    formatBreadcrumb,
    formatRelativeListTime,
    groupSearchItems,
    isSearchHotkey,
    itemField,
    normalizeLang,
    pushRecentQuery,
    readRecentEntities,
    readRecentQueries,
    removeRecentQuery,
    resolveUiState,
    splitTitleMatch,
    t,
    visibleSections,
    type RecentEntity,
} from '../../services/search/searchHelpers'
import axios from '../../utility/customAxios'
import { AVATAR_STYLES, ensureSearchPaletteStyles } from './searchPaletteStyles'

type SearchItem = Record<string, unknown>

function storage(): Storage | null {
    try {
        return typeof window !== 'undefined' ? window.localStorage : null
    } catch {
        return null
    }
}

async function searchEntitiesApi(
    body: Record<string, unknown>,
    signal: AbortSignal
): Promise<{ ok: boolean; status: number; body: Record<string, unknown> | null; raw: string }> {
    try {
        const res = await axios.post('/api/entities/SearchEntities?fromCache=true', body, {
            signal,
            validateStatus: () => true,
        })
        const data = res.data
        return {
            ok: res.status >= 200 && res.status < 300,
            status: res.status,
            body: data && typeof data === 'object' ? (data as Record<string, unknown>) : null,
            raw: typeof data === 'string' ? data : '',
        }
    } catch (err) {
        if ((err as { name?: string })?.name === 'CanceledError' || (err as { code?: string })?.code === 'ERR_CANCELED') {
            throw err
        }
        return {
            ok: false,
            status: 0,
            body: null,
            raw: (err as Error)?.message || String(err),
        }
    }
}

function parseErrorCode(body: Record<string, unknown> | null): string {
    if (!body) return ''
    return String(body.code || body.Code || '').trim()
}

function TypeAvatar({ kind }: { kind: string }) {
    const style = AVATAR_STYLES[kind] || AVATAR_STYLES.other
    return (
        <div className="pl-sp-avatar" style={{ background: style.bg }} aria-hidden>
            {style.glyph}
        </div>
    )
}

function SkeletonList() {
    return (
        <div>
            {[0, 1, 2, 3].map((i) => (
                <div className="pl-sp-skel" key={i}>
                    <div className="pl-sp-skel-av" />
                    <div className="pl-sp-skel-lines">
                        <div className="pl-sp-skel-line" />
                        <div className="pl-sp-skel-line short" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export const SearchPalette: React.FC = () => {
    ensureSearchPaletteStyles()
    const navigateWithParams = useNavigationWithParams()
    const location = useLocation()
    const accessToken = useAppSelector((s) => s.authentication?.accessToken)
    const isAuthenticated = Boolean(accessToken)

    const lang = useMemo(
        () => normalizeLang(new URLSearchParams(location.search).get('lang') || 'en-US'),
        [location.search]
    )

    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [items, setItems] = useState<SearchItem[]>([])
    const [loading, setLoading] = useState(false)
    const [showSkeleton, setShowSkeleton] = useState(false)
    const [rateLimited, setRateLimited] = useState(false)
    const [partialTimeout, setPartialTimeout] = useState(false)
    const [truncated, setTruncated] = useState(false)
    const [errorText, setErrorText] = useState('')
    const [showDetails, setShowDetails] = useState(false)
    const [activeIndex, setActiveIndex] = useState(-1)
    const [recentQueries, setRecentQueries] = useState<string[]>(() => readRecentQueries(storage()))
    const [recentEntities, setRecentEntities] = useState<RecentEntity[]>(() =>
        readRecentEntities(storage())
    )
    const [hideTime, setHideTime] = useState(
        () => typeof window !== 'undefined' && window.innerWidth < SEARCH_HIDE_TIME_PX
    )
    const [narrow, setNarrow] = useState(
        () => typeof window !== 'undefined' && window.innerWidth < SEARCH_NARROW_PX
    )

    const inputRef = useRef<HTMLInputElement | null>(null)
    const focusedOnce = useRef(false)
    const abortRef = useRef<AbortController | null>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const buckets = useMemo(() => groupSearchItems(items, query), [items, query])
    const flatRows = useMemo(() => flattenVisibleRows(buckets), [buckets])
    const displayRows = useMemo(
        () => flatRows.slice(0, SEARCH_PALETTE_VISIBLE_ROWS),
        [flatRows]
    )
    const idleRows = useMemo(
        () => flattenIdleRows(recentEntities, recentQueries),
        [recentEntities, recentQueries]
    )
    const uiState = resolveUiState({
        query,
        loading,
        hasItems: items.length > 0,
        rateLimited,
        error: errorText,
        truncated,
        partialTimeout,
    })

    const goToSearchPage = useCallback(
        (q?: string) => {
            const path = buildSearchUrl(`/${SEARCH_PAGE_CODE}`, {
                q: q && q.trim() ? q.trim() : undefined,
                lang,
            })
            setOpen(false)
            setQuery('')
            setItems([])
            setActiveIndex(-1)
            navigateWithParams(path)
        },
        [lang, navigateWithParams]
    )

    const openPalette = useCallback(() => {
        if (typeof window !== 'undefined' && window.innerWidth < SEARCH_NARROW_PX) {
            goToSearchPage()
            return
        }
        setRecentQueries(readRecentQueries(storage()))
        setRecentEntities(readRecentEntities(storage()))
        setOpen(true)
        focusedOnce.current = false
    }, [goToSearchPage])

    const closePalette = useCallback(() => {
        if (abortRef.current) abortRef.current.abort()
        setOpen(false)
        setQuery('')
        setItems([])
        setActiveIndex(-1)
        setErrorText('')
        setRateLimited(false)
        setShowSkeleton(false)
    }, [])

    useEffect(() => {
        const onResize = () => {
            setNarrow(window.innerWidth < SEARCH_NARROW_PX)
            setHideTime(window.innerWidth < SEARCH_HIDE_TIME_PX)
            if (window.innerWidth < SEARCH_NARROW_PX && open) {
                closePalette()
            }
        }
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [open, closePalette])

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (!isSearchHotkey(e)) return
            e.preventDefault()
            if (open) {
                inputRef.current?.focus()
                return
            }
            openPalette()
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
    }, [open, openPalette])

    useEffect(() => {
        if (!open || focusedOnce.current) return
        focusedOnce.current = true
        const el = inputRef.current
        if (el) {
            try {
                el.focus({ preventScroll: true })
            } catch {
                el.focus()
            }
        }
    }, [open])

    const runSearch = useCallback(
        (q: string) => {
            const trimmed = String(q || '').trim()
            if (trimmed.length < 2) {
                if (abortRef.current) abortRef.current.abort()
                setItems([])
                setLoading(false)
                setShowSkeleton(false)
                setRateLimited(false)
                setPartialTimeout(false)
                setTruncated(false)
                setErrorText('')
                return
            }
            if (abortRef.current) abortRef.current.abort()
            const ac = new AbortController()
            abortRef.current = ac
            setLoading(true)
            setRateLimited(false)
            setPartialTimeout(false)
            setErrorText('')
            setShowDetails(false)
            setActiveIndex(-1)
            const skTimer = setTimeout(() => {
                if (!ac.signal.aborted) setShowSkeleton(true)
            }, SEARCH_SKELETON_MS)

            void searchEntitiesApi(
                {
                    query: trimmed,
                    skip: 0,
                    take: SEARCH_PAGE_SIZE,
                    includeHidden: false,
                    lang,
                },
                ac.signal
            )
                .then((res) => {
                    if (ac.signal.aborted) return
                    clearTimeout(skTimer)
                    setShowSkeleton(false)
                    setLoading(false)
                    if (res.status === 429 || parseErrorCode(res.body) === 'rate_limited') {
                        setRateLimited(true)
                        return
                    }
                    if (res.status === 503 || parseErrorCode(res.body) === 'search_timeout') {
                        setPartialTimeout(true)
                        return
                    }
                    if (!res.ok) {
                        setErrorText(
                            String(
                                (res.body && (res.body.message || res.body.Message)) ||
                                    res.raw ||
                                    res.status
                            )
                        )
                        return
                    }
                    const nextItems =
                        (res.body &&
                            ((res.body.items as SearchItem[]) ||
                                (res.body.Items as SearchItem[]))) ||
                        []
                    const trunc = !!(res.body && (res.body.truncated || res.body.Truncated))
                    setTruncated(trunc)
                    setItems(Array.isArray(nextItems) ? nextItems : [])
                    pushRecentQuery(storage(), trimmed)
                    setRecentQueries(readRecentQueries(storage()))
                })
                .catch((err) => {
                    if (
                        ac.signal.aborted ||
                        err?.name === 'CanceledError' ||
                        err?.code === 'ERR_CANCELED'
                    )
                        return
                    clearTimeout(skTimer)
                    setShowSkeleton(false)
                    setLoading(false)
                    setErrorText(err?.message || String(err))
                })
        },
        [lang]
    )

    useEffect(() => {
        if (!open) return
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => runSearch(query), SEARCH_DEBOUNCE_MS)
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current)
        }
    }, [query, open, lang, runSearch])

    const openEntity = (id: string | undefined) => {
        if (!id) return
        const q = lang ? `?lang=${encodeURIComponent(lang)}` : ''
        closePalette()
        navigateWithParams(`/${id}${q}`)
    }

    const onQueryChange = (next: string) => {
        setQuery(next)
        // Pattern 6: palette must not write ?q= into history while typing
    }

    const clearQuery = () => {
        onQueryChange('')
        setItems([])
        setActiveIndex(-1)
        inputRef.current?.focus()
    }

    const onKeyDown = (e: React.KeyboardEvent) => {
        const key = e.key
        const trimmed = query.trim()
        const navCount = !trimmed ? idleRows.length : displayRows.length

        if (key === 'ArrowDown' || key === 'ArrowUp') {
            if (navCount === 0) return
            e.preventDefault()
            setActiveIndex((prev) => {
                if (key === 'ArrowDown') return prev < 0 ? 0 : Math.min(navCount - 1, prev + 1)
                return prev < 0 ? navCount - 1 : Math.max(0, prev - 1)
            })
            return
        }

        if (key === 'Enter') {
            if (!trimmed) {
                if (activeIndex >= 0 && idleRows[activeIndex]) {
                    e.preventDefault()
                    const row = idleRows[activeIndex]
                    if (row.kind === 'entity') openEntity(row.entity.id)
                    else onQueryChange(row.query)
                }
                return
            }
            if (activeIndex >= 0 && displayRows[activeIndex]) {
                e.preventDefault()
                openEntity(String(itemField(displayRows[activeIndex].item, 'id', 'Id') || ''))
                return
            }
            if (trimmed.length >= 2) {
                e.preventDefault()
                goToSearchPage(trimmed)
            }
            return
        }

        if (key === 'Escape') {
            e.preventDefault()
            if (query) {
                clearQuery()
                return
            }
            closePalette()
        }
    }

    if (!open || narrow) return null

    const sections = visibleSections(buckets)
    const showResults = uiState === 'results' || uiState === 'partial'

    const panel = (
        <div className="pl-sp-root">
            <div
                className="pl-sp-scrim"
                role="presentation"
                data-testid="search-palette-scrim"
                onMouseDown={(e) => {
                    if (e.target === e.currentTarget) closePalette()
                }}
            >
                <div
                    className="pl-sp-panel"
                    role="dialog"
                    aria-modal="true"
                    aria-label={t(lang, 'placeholder')}
                    data-testid="search-palette"
                >
                    <div className="pl-sp-field-wrap">
                        <span className="pl-sp-magnifier" aria-hidden>
                            ⌕
                        </span>
                        <input
                            ref={inputRef}
                            className="pl-sp-input"
                            type="search"
                            autoComplete="off"
                            spellCheck={false}
                            placeholder={t(lang, 'placeholder')}
                            aria-label={t(lang, 'placeholder')}
                            value={query}
                            onChange={(e) => onQueryChange(e.target.value)}
                            onKeyDown={onKeyDown}
                            data-testid="search-palette-input"
                        />
                        {query ? (
                            <button
                                type="button"
                                className="pl-sp-icon-btn"
                                aria-label={t(lang, 'clear')}
                                onClick={clearQuery}
                            >
                                ×
                            </button>
                        ) : null}
                    </div>
                    <div className="pl-sp-body">
                        {(uiState === 'idle' || uiState === 'tooShort') && (
                            <>
                                <p className="pl-sp-hint">{t(lang, 'paletteHint')}</p>
                                {recentEntities.length > 0 && (
                                    <section
                                        className="pl-sp-section"
                                        aria-label={t(lang, 'recent')}
                                    >
                                        <h2 className="pl-sp-section-title">{t(lang, 'recent')}</h2>
                                        {recentEntities.map((ent, idx) => (
                                                <button
                                                    type="button"
                                                    key={ent.id}
                                                    className={
                                                        'pl-sp-row' +
                                                        (activeIndex === idx ? ' is-active' : '')
                                                    }
                                                    onClick={() => openEntity(ent.id)}
                                                >
                                                    <TypeAvatar
                                                        kind={avatarKindForSection(
                                                            classifySection(
                                                                { typeTag: ent.typeTag || '' },
                                                                ''
                                                            )
                                                        )}
                                                    />
                                                    <div className="pl-sp-main">
                                                        <p className="pl-sp-title">
                                                            <span className="pl-rest">{ent.title}</span>
                                                        </p>
                                                    </div>
                                                </button>
                                        ))}
                                    </section>
                                )}
                                {recentQueries.length > 0 && (
                                    <section
                                        className="pl-sp-section"
                                        aria-label={t(lang, 'recentSearches')}
                                    >
                                        <h2 className="pl-sp-section-title">
                                            {t(lang, 'recentSearches')}
                                        </h2>
                                        {recentQueries.map((rq, idx) => {
                                            const rowIdx = recentEntities.length + idx
                                            return (
                                                <div
                                                    key={`rq-${rq}`}
                                                    className={
                                                        'pl-sp-recent-row' +
                                                        (activeIndex === rowIdx ? ' is-active' : '')
                                                    }
                                                    onClick={() => onQueryChange(rq)}
                                                >
                                                    <span className="pl-sp-recent-q">{rq}</span>
                                                    <button
                                                        type="button"
                                                        className="pl-sp-icon-btn"
                                                        aria-label={t(lang, 'clear')}
                                                        onClick={(ev) => {
                                                            ev.stopPropagation()
                                                            setRecentQueries(
                                                                removeRecentQuery(storage(), rq)
                                                            )
                                                        }}
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </section>
                                )}
                            </>
                        )}

                        {uiState === 'loading' && showSkeleton && <SkeletonList />}
                        {uiState === 'rateLimited' && (
                            <p className="pl-sp-state">{t(lang, 'rateLimited')}</p>
                        )}
                        {uiState === 'error' && (
                            <div className="pl-sp-state">
                                <p>{t(lang, 'error')}</p>
                                <button
                                    type="button"
                                    className="pl-sp-icon-btn"
                                    style={{ width: 'auto', padding: '0 8px' }}
                                    onClick={() => setShowDetails((v) => !v)}
                                >
                                    {t(lang, 'details')}
                                </button>
                                {showDetails ? (
                                    <pre className="pl-sp-details">{errorText}</pre>
                                ) : null}
                            </div>
                        )}
                        {uiState === 'noAccess' && (
                            <p className="pl-sp-state">{t(lang, 'noAccess')}</p>
                        )}
                        {uiState === 'noResults' && (
                            <div className="pl-sp-state">
                                <p>{t(lang, 'noResults', { q: query.trim() })}</p>
                                <p>{t(lang, 'tryShorter')}</p>
                                {!isAuthenticated && (
                                    <p>
                                        <a
                                            href={`/login?returnurl=${encodeURIComponent(
                                                buildSearchUrl(`/${SEARCH_PAGE_CODE}`, {
                                                    q: query.trim(),
                                                    lang,
                                                })
                                            )}`}
                                        >
                                            {t(lang, 'signIn')}
                                        </a>
                                    </p>
                                )}
                            </div>
                        )}

                        {(uiState === 'partial' || (showResults && truncated)) && (
                            <div className="pl-sp-banner">{t(lang, 'partial')}</div>
                        )}

                        {showResults && (
                            <div role="listbox" aria-label="Search results">
                                {sections.map((sec) => {
                                    const limited = sec.items.filter((item) =>
                                        displayRows.some(
                                            (r) =>
                                                String(itemField(r.item, 'id', 'Id') || '') ===
                                                String(itemField(item, 'id', 'Id') || '')
                                        )
                                    )
                                    if (!limited.length) return null
                                    return (
                                        <section
                                            key={sec.key}
                                            className="pl-sp-section"
                                            aria-labelledby={`pl-sp-sec-${sec.key}`}
                                        >
                                            <h2
                                                className="pl-sp-section-title"
                                                id={`pl-sp-sec-${sec.key}`}
                                            >
                                                {t(lang, sec.key)}
                                            </h2>
                                            {limited.map((item) => {
                                                const id = String(itemField(item, 'id', 'Id') || '')
                                                const title = String(
                                                    itemField(item, 'title', 'Title') ||
                                                        itemField(item, 'code', 'Code') ||
                                                        id ||
                                                        ''
                                                )
                                                const path = itemField(item, 'path', 'Path')
                                                const crumb =
                                                    sec.key === 'direct' &&
                                                    (!path ||
                                                        !(Array.isArray(path) && path.length))
                                                        ? t(lang, 'openEntity')
                                                        : formatBreadcrumb(path, true)
                                                const time = hideTime
                                                    ? ''
                                                    : formatRelativeListTime(
                                                          itemField(
                                                              item,
                                                              'updateTime',
                                                              'UpdateTime'
                                                          ) as string,
                                                          new Date(),
                                                          lang
                                                      )
                                                const parts = splitTitleMatch(title, query)
                                                const flatIdx = displayRows.findIndex(
                                                    (r) =>
                                                        String(
                                                            itemField(r.item, 'id', 'Id') || ''
                                                        ) === id
                                                )
                                                return (
                                                    <button
                                                        type="button"
                                                        key={id}
                                                        className={
                                                            'pl-sp-row' +
                                                            (flatIdx === activeIndex
                                                                ? ' is-active'
                                                                : '')
                                                        }
                                                        role="option"
                                                        aria-selected={flatIdx === activeIndex}
                                                        onClick={() => openEntity(id)}
                                                    >
                                                        <TypeAvatar
                                                            kind={avatarKindForSection(sec.key)}
                                                        />
                                                        <div className="pl-sp-main">
                                                            <p className="pl-sp-title">
                                                                {parts.map((p, i) => (
                                                                    <span
                                                                        key={i}
                                                                        className={
                                                                            p.match
                                                                                ? 'pl-match'
                                                                                : 'pl-rest'
                                                                        }
                                                                    >
                                                                        {p.text}
                                                                    </span>
                                                                ))}
                                                            </p>
                                                            {crumb ? (
                                                                <p className="pl-sp-crumb">{crumb}</p>
                                                            ) : null}
                                                        </div>
                                                        {time ? (
                                                            <div className="pl-sp-time">{time}</div>
                                                        ) : null}
                                                    </button>
                                                )
                                            })}
                                        </section>
                                    )
                                })}
                                {query.trim().length >= 2 && (
                                    <button
                                        type="button"
                                        className="pl-sp-see-all"
                                        onClick={() => goToSearchPage(query.trim())}
                                    >
                                        {t(lang, 'seeAll')}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )

    return createPortal(panel, document.body)
}

export default SearchPalette
