import axios from '../utility/customAxios'
import { pickLocalizedName, type EntityValueLike } from '../constants/entityParents'
import { urlLanguageService } from './urlLanguageService'

type TextEntity = {
    id: string
    code: string
    values?: EntityValueLike[]
}

const SPECIAL_ROOT_ID = '00010000-0000-0000-0000-000000000000'
const LAYOUT_TEXTS_CONTAINER_CODE = 'layout-texts'

class TextCatalogService {
    private layoutTextsCache: Record<string, Record<string, string>> = {}
    private inFlightByLang: Record<string, Promise<Record<string, string>> | undefined> = {}

    async loadLayoutTexts(lang: string): Promise<Record<string, string>> {
        if (this.layoutTextsCache[lang]) {
            return this.layoutTextsCache[lang]
        }

        if (this.inFlightByLang[lang]) {
            return this.inFlightByLang[lang] as Promise<Record<string, string>>
        }

        this.inFlightByLang[lang] = (async () => {
            await urlLanguageService.loadLanguages()

            const specialChildrenResponse = await axios.post<TextEntity[]>('/api/entities/getEntities', {
                parentIds: [SPECIAL_ROOT_ID],
                skip: 0,
                take: 500,
                includeValues: false,
            })

            const specialChildren = specialChildrenResponse.data ?? []
            const layoutContainer = specialChildren.find((entity) => entity.code === LAYOUT_TEXTS_CONTAINER_CODE)
            if (!layoutContainer?.id) {
                this.layoutTextsCache[lang] = {}
                return {}
            }

            const textsResponse = await axios.post<TextEntity[]>('/api/entities/getEntities', {
                parentIds: [layoutContainer.id],
                skip: 0,
                take: 200,
                includeValues: true,
            })

            const texts = textsResponse.data ?? []
            const map: Record<string, string> = {}
            for (const textEntity of texts) {
                map[textEntity.code] = pickLocalizedName(
                    textEntity.values,
                    lang,
                    textEntity.code,
                    (langCode) => urlLanguageService.getLanguageId(langCode)
                )
            }

            this.layoutTextsCache[lang] = map
            return map
        })()

        try {
            return await this.inFlightByLang[lang]!
        } finally {
            this.inFlightByLang[lang] = undefined
        }
    }
}

export const textCatalogService = new TextCatalogService()
