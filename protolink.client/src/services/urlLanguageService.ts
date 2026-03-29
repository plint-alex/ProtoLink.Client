import queryString from 'query-string'

export interface Language {
  id?: string
  code: string
  name: string
  flag: string
}

class UrlLanguageService {
  private static instance: UrlLanguageService
  private languages: Language[] = []
  private currentLanguage: string = 'en-US'
  private languageIdByCode: Record<string, string> = {}

  private constructor() {
    this.initializeLanguage()
  }

  static getInstance(): UrlLanguageService {
    if (!UrlLanguageService.instance) {
      UrlLanguageService.instance = new UrlLanguageService()
    }
    return UrlLanguageService.instance
  }

  private initializeLanguage() {
    // Get language from URL parameter
    const { lang } = queryString.parse(window.location.search)
    
    if (lang && typeof lang === 'string') {
      // Keep existing language parameter
      this.currentLanguage = lang
    } else {
      // If no lang parameter, add default one
      this.addLangParameter('en-US')
    }

    // Set global variables for dynamic scripts
    (window as any).currentLanguage = this.currentLanguage
    document.body.setAttribute('data-current-language', this.currentLanguage)
  }

  private addLangParameter(lang: string) {
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('lang', lang)
    window.history.replaceState({}, '', currentUrl.toString())
  }

  private loadLanguagesPromise: Promise<Language[]> | null = null;

  async loadLanguages(): Promise<Language[]> {
    if (this.languages.length > 0) {
      return this.languages
    }

    // Prevent duplicate requests - reuse existing promise if request is in flight
    if (this.loadLanguagesPromise) {
      return this.loadLanguagesPromise;
    }

    this.loadLanguagesPromise = (async () => {
      try {
        // Fetch language entities from API
        const response = await fetch('/api/entities/GetEntities', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}`
          },
          body: JSON.stringify({
            parentIds: ['00010002-0000-0000-0000-000000000000'], // lang entity parent
            skip: 0,
            take: 100
          })
        })

        if (response.ok) {
          const data = await response.json()
          this.languages = data.map((entity: any) => ({
            id: entity.id,
            code: entity.code,
            name: this.getLanguageName(entity.code),
            flag: this.getLanguageFlag(entity.code)
          }))
          this.languageIdByCode = this.languages.reduce<Record<string, string>>((acc, lang) => {
            if (lang.id) {
              acc[lang.code] = lang.id
            }
            return acc
          }, {})
        } else {
          // Fallback to default languages
          this.languages = [
            { id: 'en-US', code: 'en-US', name: 'English', flag: '🇺🇸' },
            { id: 'ru-RU', code: 'ru-RU', name: 'Русский', flag: '🇷🇺' }
          ]
          this.languageIdByCode = {}
        }
      } catch (error) {
        console.error('Error loading languages:', error)
        // Fallback to default languages
        this.languages = [
          { id: 'en-US', code: 'en-US', name: 'English', flag: '🇺🇸' },
          { id: 'ru-RU', code: 'ru-RU', name: 'Русский', flag: '🇷🇺' }
        ]
        this.languageIdByCode = {}
      } finally {
        // Reset promise after completion so it can be retried if needed
        this.loadLanguagesPromise = null;
      }

      return this.languages
    })();

    return this.loadLanguagesPromise;
  }

  private getLanguageName(code: string): string {
    const names: { [key: string]: string } = {
      'en-US': 'English',
      'ru-RU': 'Русский',
      'es-ES': 'Español',
      'fr-FR': 'Français',
      'de-DE': 'Deutsch'
    }
    return names[code] || code
  }

  private getLanguageFlag(code: string): string {
    const flags: { [key: string]: string } = {
      'en-US': '🇺🇸',
      'ru-RU': '🇷🇺',
      'es-ES': '🇪🇸',
      'fr-FR': '🇫🇷',
      'de-DE': '🇩🇪'
    }
    return flags[code] || '🌐'
  }

  getCurrentLanguage(): string {
    return this.currentLanguage
  }

  getLanguageId(langCode: string): string | undefined {
    return this.languageIdByCode[langCode]
  }

  setLanguage(lang: string) {
    this.currentLanguage = lang

    // Update URL with new language parameter and reload to apply
    const currentUrl = new URL(window.location.href)
    currentUrl.searchParams.set('lang', lang)
    window.location.replace(currentUrl.toString())

    // Set global variables for dynamic scripts (in case they run before reload)
    ;(window as any).currentLanguage = lang
    document.body.setAttribute('data-current-language', lang)

    // Trigger a custom event even though the page reloads
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }))
  }

  getLanguageFromUrl(): string {
    const { lang } = queryString.parse(window.location.search)
    return (lang as string) || 'en-US'
  }
}

export const urlLanguageService = UrlLanguageService.getInstance()
export default urlLanguageService
