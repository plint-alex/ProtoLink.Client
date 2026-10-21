import axios from '../utility/customAxios'
import { pickLocalizedName, type EntityValueLike } from '../constants/entityParents'
import { resolveEntityCode } from './search/resolveEntityCode'
import {
  DEFAULT_LANGUAGE_CODE,
  DEFAULT_SITE_LANGUAGE_CODES,
  languagePrimaryTag,
  languageShortLabel,
  PREFERRED_LANGUAGE_KEY,
  resolveUrlLanguage,
} from './resolveUrlLanguage'

export interface Language {
  id?: string
  code: string
  /** Native name (name in that language). */
  name: string
  shortLabel: string
  /** Name in the current UI language (a11y). */
  accessibilityName: string
}

type WindowWithLanguage = Window & { currentLanguage?: string }

type LanguageEntityDto = {
  id?: string
  Id?: string
  code?: string
  Code?: string
  values?: EntityValueLike[]
  Values?: EntityValueLike[]
}

const SITE_LANGUAGES_CODE = 'site-languages'

const FALLBACK_LANGUAGES: Language[] = [
  {
    id: '00010002-0001-0000-0000-000000000000',
    code: 'ru-RU',
    name: 'Русский',
    shortLabel: 'RU',
    accessibilityName: 'Русский',
  },
  {
    id: '00010002-0002-0000-0000-000000000000',
    code: 'en-US',
    name: 'English',
    shortLabel: 'EN',
    accessibilityName: 'English',
  },
]

const KNOWN_LANGUAGE_IDS: Record<string, string> = {
  'ru-RU': '00010002-0001-0000-0000-000000000000',
  'en-US': '00010002-0002-0000-0000-000000000000',
}

function isVisitorUiLanguageCode(code: string): boolean {
  return /^[a-z]{2,3}-[A-Za-z0-9]+$/i.test(String(code || ''))
}

function readPreferredLanguage(): string | null {
  try {
    return localStorage.getItem(PREFERRED_LANGUAGE_KEY)
  } catch {
    return null
  }
}

function writePreferredLanguage(lang: string): void {
  try {
    localStorage.setItem(PREFERRED_LANGUAGE_KEY, lang)
  } catch {
    // ignore quota / private mode
  }
}

function readUrlLang(): string | null {
  try {
    return new URL(window.location.href).searchParams.get('lang')
  } catch {
    return null
  }
}

function readNavigatorLanguages(): readonly string[] {
  try {
    if (typeof navigator === 'undefined') return []
    if (Array.isArray(navigator.languages) && navigator.languages.length) {
      return navigator.languages
    }
    return navigator.language ? [navigator.language] : []
  } catch {
    return []
  }
}

class UrlLanguageService {
  private static instance: UrlLanguageService
  private languages: Language[] = []
  private currentLanguage: string = DEFAULT_LANGUAGE_CODE
  private languageIdByCode: Record<string, string> = { ...KNOWN_LANGUAGE_IDS }
  private loadLanguagesPromise: Promise<Language[]> | null = null

  private constructor() {
    this.initializeLanguage()
  }

  static getInstance(): UrlLanguageService {
    if (!UrlLanguageService.instance) {
      UrlLanguageService.instance = new UrlLanguageService()
    }
    return UrlLanguageService.instance
  }

  private siteLanguageCodes(): string[] {
    const fromLoaded = this.languages
      .map((l) => l.code)
      .filter((c) => isVisitorUiLanguageCode(c))
    return fromLoaded.length ? fromLoaded : [...DEFAULT_SITE_LANGUAGE_CODES]
  }

  private initializeLanguage() {
    const resolved = resolveUrlLanguage({
      urlLang: readUrlLang(),
      preferredLanguage: readPreferredLanguage(),
      navigatorLanguages: readNavigatorLanguages(),
      siteLanguageCodes: this.siteLanguageCodes(),
    })
    this.currentLanguage = resolved.code
    this.writeLangToUrl(resolved.code)
    this.applyDocumentLanguage(resolved.code)
    this.applyHreflangAlternates(this.siteLanguageCodes())
    ;(window as WindowWithLanguage).currentLanguage = this.currentLanguage
    document.body.setAttribute('data-current-language', this.currentLanguage)
  }

  private writeLangToUrl(lang: string) {
    try {
      const currentUrl = new URL(window.location.href)
      if (currentUrl.searchParams.get('lang') === lang) return
      currentUrl.searchParams.set('lang', lang)
      window.history.replaceState({}, '', currentUrl.toString())
    } catch {
      // ignore
    }
  }

  private applyDocumentLanguage(lang: string) {
    try {
      document.documentElement.lang = languagePrimaryTag(lang)
    } catch {
      // ignore
    }
  }

  private applyHreflangAlternates(siteCodes: readonly string[]) {
    try {
      const head = document.head
      if (!head) return
      head
        .querySelectorAll('link[data-protolink-hreflang="1"]')
        .forEach((el) => el.remove())

      const url = new URL(window.location.href)
      const pathAndQuery = url.pathname + url.search
      const origin = url.origin

      const add = (hreflang: string, hrefLangCode: string | null) => {
        const link = document.createElement('link')
        link.setAttribute('rel', 'alternate')
        link.setAttribute('hreflang', hreflang)
        link.setAttribute('data-protolink-hreflang', '1')
        const href = new URL(pathAndQuery, origin)
        if (hrefLangCode) {
          href.searchParams.set('lang', hrefLangCode)
        } else {
          href.searchParams.set('lang', DEFAULT_LANGUAGE_CODE)
        }
        link.setAttribute('href', href.toString())
        head.appendChild(link)
      }

      for (const code of siteCodes) {
        add(languagePrimaryTag(code), code)
      }
      add('x-default', DEFAULT_LANGUAGE_CODE)
    } catch {
      // ignore
    }
  }

  private mapEntityToLanguage(
    entity: LanguageEntityDto,
    currentLang: string
  ): Language | null {
    const code = String(entity.code ?? entity.Code ?? '').trim()
    if (!isVisitorUiLanguageCode(code)) return null
    const id = String(entity.id ?? entity.Id ?? '').trim() || undefined
    const values = (entity.values ?? entity.Values ?? []) as EntityValueLike[]
    const getId = (langCode: string) =>
      this.languageIdByCode[langCode] ?? KNOWN_LANGUAGE_IDS[langCode]

    // Seed id map early so pickLocalizedName can resolve [name, languageId].
    if (id) {
      this.languageIdByCode[code] = id
    }

    const nativeName = pickLocalizedName(values, code, code, getId)
    const accessibilityName = pickLocalizedName(values, currentLang, nativeName, getId)

    return {
      id,
      code,
      name: nativeName,
      shortLabel: languageShortLabel(code),
      accessibilityName,
    }
  }

  private applyFallbackLanguages(): Language[] {
    this.languages = FALLBACK_LANGUAGES.map((l) => ({ ...l }))
    this.languageIdByCode = { ...KNOWN_LANGUAGE_IDS }
    return this.languages
  }

  async loadLanguages(): Promise<Language[]> {
    if (this.languages.length > 0) {
      return this.languages
    }

    if (this.loadLanguagesPromise) {
      return this.loadLanguagesPromise
    }

    this.loadLanguagesPromise = (async () => {
      try {
        const siteLanguagesId = await resolveEntityCode(SITE_LANGUAGES_CODE)
        if (!siteLanguagesId) {
          return this.applyFallbackLanguages()
        }

        const response = await axios.post<LanguageEntityDto[]>('/api/entities/GetEntities', {
          parentIds: [siteLanguagesId],
          skip: 0,
          take: 100,
          includeValues: true,
        })

        const rows = Array.isArray(response.data) ? response.data : []
        // First pass: register language ids so pickLocalizedName works.
        for (const entity of rows) {
          const code = String(entity.code ?? entity.Code ?? '').trim()
          const id = String(entity.id ?? entity.Id ?? '').trim()
          if (isVisitorUiLanguageCode(code) && id) {
            this.languageIdByCode[code] = id
          }
        }

        const mapped = rows
          .map((entity) => this.mapEntityToLanguage(entity, this.currentLanguage))
          .filter((l): l is Language => l != null)

        if (!mapped.length) {
          return this.applyFallbackLanguages()
        }

        mapped.sort((a, b) => {
          const rank = (code: string) =>
            code === 'ru-RU' ? 0 : code === 'en-US' ? 1 : 10
          return rank(a.code) - rank(b.code) || a.code.localeCompare(b.code)
        })

        this.languages = mapped
        this.applyHreflangAlternates(this.siteLanguageCodes())
        return this.languages
      } catch (error) {
        console.error('Error loading languages:', error)
        return this.applyFallbackLanguages()
      } finally {
        this.loadLanguagesPromise = null
      }
    })()

    return this.loadLanguagesPromise
  }

  getCurrentLanguage(): string {
    return this.currentLanguage
  }

  getLanguageId(langCode: string): string | undefined {
    return this.languageIdByCode[langCode] ?? KNOWN_LANGUAGE_IDS[langCode]
  }

  setLanguage(lang: string) {
    const normalized =
      resolveUrlLanguage({
        urlLang: lang,
        siteLanguageCodes: this.siteLanguageCodes(),
      }).code

    this.currentLanguage = normalized
    writePreferredLanguage(normalized)
    ;(window as WindowWithLanguage).currentLanguage = normalized
    document.body.setAttribute('data-current-language', normalized)
    this.applyDocumentLanguage(normalized)

    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('lang', normalized)
    window.location.replace(currentUrl.toString())

    window.dispatchEvent(
      new CustomEvent('languageChanged', { detail: { language: normalized } })
    )
  }

  getLanguageFromUrl(): string {
    const resolved = resolveUrlLanguage({
      urlLang: readUrlLang(),
      preferredLanguage: readPreferredLanguage(),
      navigatorLanguages: readNavigatorLanguages(),
      siteLanguageCodes: this.siteLanguageCodes(),
    })
    return resolved.code
  }
}

export const urlLanguageService = UrlLanguageService.getInstance()
export default urlLanguageService
