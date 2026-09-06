import axios from '../utility/customAxios'
import { pickLocalizedName, type EntityValueLike } from '../constants/entityParents'
import { urlLanguageService } from './urlLanguageService'
import { ROUTES, SYSTEM_PAGE_CODES, SYSTEM_PAGE_ID_BY_CODE } from '../resources/routes-constants'

type TextEntity = {
    id: string
    code: string
    values?: EntityValueLike[]
}

type LoadPageTextsParams = {
    lang: string
    routeEntityId?: string | null
    systemPageCode?: string
    pathname?: string
}

const TOP_MENU_TEXT_CODES = [
    'layout-brand',
    'layout-home',
    'layout-explorer',
    'layout-login',
    'layout-logout',
    'layout-user-default',
    'layout-logo-alt',
    'layout-version-title',
    'notfound-title',
    'notfound-back-home',
    'home-view-unavailable',
] as const

/** Shown when catalog entities exist but values are missing or language parents could not be resolved. */
const TOP_MENU_DEFAULTS_EN: Record<(typeof TOP_MENU_TEXT_CODES)[number], string> = {
    'layout-brand': 'ProtoLink',
    'layout-home': 'Home',
    'layout-explorer': 'Explorer',
    'layout-login': 'Log in',
    'layout-logout': 'Log out',
    'layout-user-default': 'User',
    'layout-logo-alt': 'ProtoLink Logo',
    'layout-version-title': 'Client package version',
    'notfound-title': 'Oops 404!',
    'notfound-back-home': 'Homepage',
    'home-view-unavailable': 'Dynamic view not available yet for this page.',
}

class TextCatalogService {
    private systemPageEntityIdByCode: Record<string, string> = {}
    private inFlightSystemPageByCode: Record<string, Promise<string | null> | undefined> = {}
    private inFlightByLang: Record<string, Promise<Record<string, string>> | undefined> = {}
    /** Dedupes concurrent GetEntities(children of parent) calls (e.g. Layout top menu + page texts on same entity). */
    private inFlightChildrenByParentId: Map<string, Promise<TextEntity[]>> = new Map()

    private inferSystemPageCodeFromPath(pathname: string): string | null {
        if (pathname === ROUTES.HOMEPAGE_ROUTE) return SYSTEM_PAGE_CODES.HOME_ROOT
        if (pathname === ROUTES.LOGIN_ROUTE) return SYSTEM_PAGE_CODES.LOGIN
        if (pathname === ROUTES.REGISTER_ROUTE) return SYSTEM_PAGE_CODES.REGISTER
        if (pathname === ROUTES.EXPLORER_ROUTE) return SYSTEM_PAGE_CODES.EXPLORER_ROOT
        if (pathname === ROUTES.TEST_ROUTE) return SYSTEM_PAGE_CODES.TEST
        return null
    }

    private async loadSystemPageEntityId(systemPageCode: string): Promise<string | null> {
        const hardcodedId = SYSTEM_PAGE_ID_BY_CODE[systemPageCode]
        if (hardcodedId) {
            return hardcodedId
        }

        if (this.systemPageEntityIdByCode[systemPageCode]) {
            return this.systemPageEntityIdByCode[systemPageCode]
        }

        if (this.inFlightSystemPageByCode[systemPageCode]) {
            return this.inFlightSystemPageByCode[systemPageCode] as Promise<string | null>
        }

        this.inFlightSystemPageByCode[systemPageCode] = (async () => {
            // Keep legacy fallback path if code mapping is incomplete.
            return null
        })()

        try {
            return await this.inFlightSystemPageByCode[systemPageCode]!
        } finally {
            this.inFlightSystemPageByCode[systemPageCode] = undefined
        }
    }

    async resolvePageEntityId(params: LoadPageTextsParams): Promise<string | null> {
        if (params.routeEntityId) {
            return params.routeEntityId
        }

        const inferredCode =
            params.systemPageCode ||
            this.inferSystemPageCodeFromPath(params.pathname || window.location.pathname)
        if (!inferredCode) {
            return null
        }

        return this.loadSystemPageEntityId(inferredCode)
    }

    /**
     * Shared fetch for text entities under a single parent. Merges parallel callers (same parentId)
     * into one HTTP request — e.g. loadTopMenuTexts + loadPageTexts on /explorer/:id.
     */
    private async fetchTextChildrenUnderParent(parentId: string): Promise<TextEntity[]> {
        const existing = this.inFlightChildrenByParentId.get(parentId)
        if (existing) {
            return existing
        }

        const promise = (async () => {
            const response = await axios.post<TextEntity[]>(
                '/api/entities/getEntities',
                {
                    parentIds: [parentId],
                    skip: 0,
                    take: 300,
                    includeValues: true,
                },
                { headers: { 'X-ProtoLink-Text-Request': '1' } }
            )
            return response.data ?? []
        })()

        this.inFlightChildrenByParentId.set(parentId, promise)
        try {
            return await promise
        } finally {
            this.inFlightChildrenByParentId.delete(parentId)
        }
    }

    async loadPageTexts(params: LoadPageTextsParams): Promise<Record<string, string>> {
        const pageEntityId = await this.resolvePageEntityId(params)
        if (!pageEntityId) {
            return {}
        }

        const inFlightKey = `${pageEntityId}|${params.lang}`
        if (this.inFlightByLang[inFlightKey]) {
            return this.inFlightByLang[inFlightKey] as Promise<Record<string, string>>
        }

        this.inFlightByLang[inFlightKey] = (async () => {
            await urlLanguageService.loadLanguages()

            const texts = await this.fetchTextChildrenUnderParent(pageEntityId)
            const map: Record<string, string> = {}
            for (const textEntity of texts) {
                map[textEntity.code] = pickLocalizedName(
                    textEntity.values,
                    params.lang,
                    textEntity.code,
                    (langCode) => urlLanguageService.getLanguageId(langCode)
                )
            }

            return map
        })()

        try {
            return await this.inFlightByLang[inFlightKey]!
        } finally {
            this.inFlightByLang[inFlightKey] = undefined
        }
    }

    async loadLayoutTexts(lang: string): Promise<Record<string, string>> {
        return this.loadPageTexts({ lang, systemPageCode: SYSTEM_PAGE_CODES.LAYOUT })
    }

    private resolveGuidEntityIdFromPath(pathname: string): string | null {
        const segments = pathname.split('/').filter(Boolean)
        const guidRegex =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
        if (!segments.length) {
            return null
        }

        // /:id
        if (segments.length === 1 && guidRegex.test(segments[0])) {
            return segments[0]
        }

        // /explorer/:id
        if (segments.length >= 2 && segments[0] === 'explorer' && guidRegex.test(segments[1])) {
            return segments[1]
        }

        return null
    }

    private async resolveSystemPageEntityIdFresh(systemPageCode: string): Promise<string | null> {
        return SYSTEM_PAGE_ID_BY_CODE[systemPageCode] ?? null
    }

    /** Coerce getEntities value rows (camelCase / PascalCase, parents as guid strings). */
    private coerceEntityValues(values: unknown): EntityValueLike[] {
        if (!Array.isArray(values)) {
            return []
        }
        return values.map((v: Record<string, unknown>) => {
            const rawParents = v.parents ?? v.Parents
            const parents = Array.isArray(rawParents)
                ? rawParents.map((p) => {
                      if (typeof p === 'string') {
                          return p
                      }
                      if (p && typeof p === 'object') {
                          const o = p as Record<string, unknown>
                          const id = o.entityParentId ?? o.EntityParentId
                          return id != null ? String(id) : ''
                      }
                      return String(p ?? '')
                  })
                : []
            return {
                value: v.value ?? v.Value,
                parents: parents.filter(Boolean),
            }
        })
    }

    /**
     * Resolves toolbar labels the same way as page texts: {@link pickLocalizedName}
     * (requested lang → en-US → explicit fallback; no cross-language nameOnly when lang is set).
     * The previous custom matcher required a language parent id; when {@link urlLanguageService.getLanguageId}
     * was empty nothing matched, so the UI showed raw codes like layout-home.
     */
    private async loadTopMenuValuesByParentId(
        parentEntityId: string,
        lang: string
    ): Promise<Record<string, string>> {
        await urlLanguageService.loadLanguages()
        const allUnderParent = await this.fetchTextChildrenUnderParent(parentEntityId)
        const entitiesWithValues = allUnderParent.filter((entity) =>
            TOP_MENU_TEXT_CODES.includes(entity.code as (typeof TOP_MENU_TEXT_CODES)[number])
        )

        const byCode = new Map<string, TextEntity>()
        for (const entity of entitiesWithValues) {
            byCode.set(entity.code, entity)
        }

        const result: Record<string, string> = {}
        for (const code of TOP_MENU_TEXT_CODES) {
            const textEntity = byCode.get(code)
            if (!textEntity) {
                continue
            }

            const values = this.coerceEntityValues(textEntity.values)
            const label = pickLocalizedName(
                values,
                lang,
                TOP_MENU_DEFAULTS_EN[code],
                (langCode) => urlLanguageService.getLanguageId(langCode)
            )
            if (label && label !== '...') {
                result[code] = label
            }
        }

        return result
    }

    async loadTopMenuTexts(lang: string, pathname: string): Promise<Record<string, string>> {
        const urlEntityId = this.resolveGuidEntityIdFromPath(pathname)
        const layoutParentEntityId = await this.resolveSystemPageEntityIdFresh(
            SYSTEM_PAGE_CODES.LAYOUT
        )
        const primaryParentEntityId = urlEntityId || layoutParentEntityId
        if (!primaryParentEntityId) {
            return {}
        }

        const primaryValues = await this.loadTopMenuValuesByParentId(primaryParentEntityId, lang)
        const layoutFallbackValues =
            layoutParentEntityId && layoutParentEntityId !== primaryParentEntityId
                ? await this.loadTopMenuValuesByParentId(layoutParentEntityId, lang)
                : {}

        const result: Record<string, string> = {}
        for (const code of TOP_MENU_TEXT_CODES) {
            result[code] =
                primaryValues[code] ||
                layoutFallbackValues[code] ||
                TOP_MENU_DEFAULTS_EN[code] ||
                code
        }
        return result
    }
}

export const textCatalogService = new TextCatalogService()
