import queryString from 'query-string'

export interface Language {
  id: string
  code: string
  name: string
  flag: string
}

class UrlLanguageService {
  private static instance: UrlLanguageService
  private languages: Language[] = []
  private currentLanguage: string = 'en-US'

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

  async loadLanguages(): Promise<Language[]> {
    if (this.languages.length > 0) {
      return this.languages
    }

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
          pageSize: 100,
          pageNumber: 1
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
      } else {
        // Fallback to default languages
        this.languages = [
          { id: '00010002-0002-0000-0000-000000000000', code: 'en-US', name: 'English', flag: '🇺🇸' },
          { id: '00010002-0001-0000-0000-000000000000', code: 'ru-RU', name: 'Русский', flag: '🇷🇺' }
        ]
      }
    } catch (error) {
      console.error('Error loading languages:', error)
      // Fallback to default languages
      this.languages = [
        { id: '00010002-0002-0000-0000-000000000000', code: 'en-US', name: 'English', flag: '🇺🇸' },
        { id: '00010002-0001-0000-0000-000000000000', code: 'ru-RU', name: 'Русский', flag: '🇷🇺' }
      ]
    }

    return this.languages
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

  setLanguage(lang: string) {
    this.currentLanguage = lang
    
    // Update URL with new language parameter - DISABLED to prevent routing conflicts
    // const urlParams = new URLSearchParams(window.location.search)
    // urlParams.set('lang', lang)
    // const newUrl = `${window.location.pathname}?${urlParams.toString()}`
    // window.history.replaceState({}, '', newUrl)
    
    // Set global variables for dynamic scripts
    ;(window as any).currentLanguage = lang
    document.body.setAttribute('data-current-language', lang)
    
    // Trigger a custom event that dynamic scripts can listen to
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }))
  }

  getLanguageFromUrl(): string {
    const { lang } = queryString.parse(window.location.search)
    return (lang as string) || 'en-US'
  }
}

export const urlLanguageService = UrlLanguageService.getInstance()
export default urlLanguageService
