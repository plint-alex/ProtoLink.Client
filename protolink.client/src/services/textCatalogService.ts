import axios from '../utility/customAxios'
import { NAME_PARENT_ID, pickLocalizedName, type EntityValueLike } from '../constants/entityParents'
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

type LanguageEntity = {
    id: string
    code: string
}

const LANGUAGE_ROOT_ID = '00010002-0000-0000-0000-000000000000'
const TOP_MENU_TEXT_CODES = [
    'layout-brand',
    'layout-home',
    'layout-explorer',
    'layout-login',
    'layout-logout',
    'layout-user-default',
] as const

class TextCatalogService {
    private systemPageEntityIdByCode: Record<string, string> = {}
    private inFlightSystemPageByCode: Record<string, Promise<string | null> | undefined> = {}
    private inFlightByLang: Record<string, Promise<Record<string, string>> | undefined> = {}

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

            const textsResponse = await axios.post<TextEntity[]>('/api/entities/getEntities', {
                parentIds: [pageEntityId],
                skip: 0,
                take: 300,
                includeValues: true,
            })

            const texts = textsResponse.data ?? []
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

    private async getLanguageByCode(langCode: string): Promise<LanguageEntity | null> {
        const response = await axios.post<LanguageEntity[]>(
            '/api/entities/getEntities',
            {
                parentIds: [LANGUAGE_ROOT_ID],
                skip: 0,
                take: 100,
                includeValues: false,
            },
            { headers: { 'X-ProtoLink-Text-Request': '1' } }
        )

        const languages = response.data ?? []
        return languages.find((l) => l.code === langCode) ?? null
    }

    private async loadTopMenuValuesByParentId(
        parentEntityId: string,
        lang: string,
        languageEntity: LanguageEntity | null
    ): Promise<Record<string, string>> {
        const textEntitiesResponse = await axios.post<TextEntity[]>(
            '/api/entities/getEntities',
            {
                parentIds: [parentEntityId],
                skip: 0,
                take: 300,
                includeValues: false,
            },
            { headers: { 'X-ProtoLink-Text-Request': '1' } }
        )
        const textEntities = (textEntitiesResponse.data ?? []).filter((entity) =>
            TOP_MENU_TEXT_CODES.includes(entity.code as (typeof TOP_MENU_TEXT_CODES)[number])
        )

        const textIds = textEntities.map((entity) => entity.id)
        if (!textIds.length) {
            return {}
        }

        const valuesResponse = await axios.post<TextEntity[]>(
            '/api/entities/getEntities',
            {
                ids: textIds,
                skip: 0,
                take: textIds.length,
                includeValues: true,
            },
            { headers: { 'X-ProtoLink-Text-Request': '1' } }
        )

        const entitiesWithValues = valuesResponse.data ?? []
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

            const values = textEntity.values ?? []
            const localizedValue = values.find((v) => {
                const parents = v.parents ?? []
                const hasNameParent = parents.includes(NAME_PARENT_ID)
                const hasLanguageParent =
                    (languageEntity?.id && parents.includes(languageEntity.id)) ||
                    (languageEntity?.code && parents.includes(languageEntity.code)) ||
                    parents.includes(lang)
                return hasNameParent && hasLanguageParent
            })

            if (typeof localizedValue?.value === 'string' && localizedValue.value.trim()) {
                result[code] = localizedValue.value.trim()
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

        const languageEntity = await this.getLanguageByCode(lang)
        const primaryValues = await this.loadTopMenuValuesByParentId(
            primaryParentEntityId,
            lang,
            languageEntity
        )
        const layoutFallbackValues =
            layoutParentEntityId && layoutParentEntityId !== primaryParentEntityId
                ? await this.loadTopMenuValuesByParentId(layoutParentEntityId, lang, languageEntity)
                : {}

        const result: Record<string, string> = {}
        for (const code of TOP_MENU_TEXT_CODES) {
            result[code] = primaryValues[code] || layoutFallbackValues[code] || code
        }
        return result
    }
}

export const textCatalogService = new TextCatalogService()
