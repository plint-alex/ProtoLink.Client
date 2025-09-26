import axios from '../utility/customAxios'

export interface LanguageText {
  [key: string]: string
}

class LanguageService {
  private cache: Map<string, LanguageText> = new Map()
  private currentLanguage: string = 'en-US'

  setLanguage(lang: string) {
    this.currentLanguage = lang
    // Clear cache when language changes
    this.cache.clear()
  }

  getCurrentLanguage(): string {
    return this.currentLanguage
  }

  async getText(key: string, params?: any[]): Promise<string> {
    try {
      // Check cache first
      const cacheKey = `${this.currentLanguage}_${key}`
      if (this.cache.has(cacheKey)) {
        let text = this.cache.get(cacheKey)![key] || key
        if (params && params.length > 0) {
          text = this.formatString(text, params)
        }
        return text
      }

      // Fetch from API
      const response = await axios.get(`/api/entities/getEntityByCode/${key}`, {
        params: { lang: this.currentLanguage }
      })

      if (response.data && response.data.values) {
        // Find the text value for current language
        const textValue = response.data.values.find((v: any) => 
          v.languageId === this.getLanguageId(this.currentLanguage)
        )

        if (textValue) {
          const text = textValue.value || key
          this.cache.set(cacheKey, { [key]: text })
          
          if (params && params.length > 0) {
            return this.formatString(text, params)
          }
          return text
        }
      }

      // Fallback to key if not found
      return key
    } catch (error) {
      console.error(`Error fetching text for key ${key}:`, error)
      return key
    }
  }

  async getMultipleTexts(keys: string[]): Promise<LanguageText> {
    const texts: LanguageText = {}
    
    for (const key of keys) {
      texts[key] = await this.getText(key)
    }
    
    return texts
  }

  private getLanguageId(lang: string): string {
    const languageMap: { [key: string]: string } = {
      'ru-RU': '00010002-0001-0000-0000-000000000000',
      'en-US': '00010002-0002-0000-0000-000000000000'
    }
    return languageMap[lang] || languageMap['en-US']
  }

  private formatString(str: string, params: any[]): string {
    return str.replace(/{(\d+)}/g, (match, index) => {
      return params[parseInt(index)] !== undefined ? params[parseInt(index)] : match
    })
  }

  // Static text fallbacks for when API is not available
  private getFallbackTexts(): { [lang: string]: LanguageText } {
    return {
      'en-US': {
        'homepage_title': 'Welcome to ProtoLink',
        'homepage_subtitle': 'Dynamic Entity Management System',
        'homepage_description': 'ProtoLink is a powerful platform for managing entities with dynamic views. Create, explore, and manage your data with our flexible and extensible system.',
        'homepage_get_started': 'Get Started',
        'homepage_sign_in_prompt': 'Sign in to access your entities and start building dynamic views',
        'homepage_sign_in_button': 'Sign In',
        'homepage_explore_demo_button': 'Explore Demo',
        'homepage_welcome_back': 'Welcome back, {0}!',
        'homepage_ready_to_explore': 'Ready to explore your entities and create dynamic views?',
        'homepage_go_to_explorer': 'Go to Explorer',
        'homepage_browse_all': 'Browse All',
        'language_switch': 'Language'
      },
      'ru-RU': {
        'homepage_title': 'Добро пожаловать в ProtoLink',
        'homepage_subtitle': 'Система управления динамическими сущностями',
        'homepage_description': 'ProtoLink - это мощная платформа для управления сущностями с динамическими представлениями. Создавайте, исследуйте и управляйте вашими данными с помощью нашей гибкой и расширяемой системы.',
        'homepage_get_started': 'Начать работу',
        'homepage_sign_in_prompt': 'Войдите в систему, чтобы получить доступ к вашим сущностям и начать создавать динамические представления',
        'homepage_sign_in_button': 'Войти',
        'homepage_explore_demo_button': 'Изучить демо',
        'homepage_welcome_back': 'Добро пожаловать, {0}!',
        'homepage_ready_to_explore': 'Готовы исследовать ваши сущности и создавать динамические представления?',
        'homepage_go_to_explorer': 'Перейти к исследователю',
        'homepage_browse_all': 'Просмотреть все',
        'language_switch': 'Язык'
      }
    }
  }

  async getTextWithFallback(key: string, params?: any[]): Promise<string> {
    try {
      return await this.getText(key, params)
    } catch (error) {
      // Use fallback text
      const fallbackTexts = this.getFallbackTexts()
      const fallback = fallbackTexts[this.currentLanguage] || fallbackTexts['en-US']
      let text = fallback[key] || key
      
      if (params && params.length > 0) {
        text = this.formatString(text, params)
      }
      
      return text
    }
  }
}

export const languageService = new LanguageService()
export default languageService
