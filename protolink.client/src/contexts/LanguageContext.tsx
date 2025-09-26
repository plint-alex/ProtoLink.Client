import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import languageService from '../services/languageService'

interface LanguageContextType {
  language: string
  setLanguage: (lang: string) => void
  getText: (key: string, params?: any[]) => Promise<string>
  getTextSync: (key: string, params?: any[]) => string
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<string>('en-US')
  const [isLoading, setIsLoading] = useState(false)

  // Initialize language from localStorage or browser language
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language')
    const browserLanguage = navigator.language
    
    if (savedLanguage) {
      setLanguageState(savedLanguage)
      languageService.setLanguage(savedLanguage)
    } else if (browserLanguage.startsWith('ru')) {
      setLanguageState('ru-RU')
      languageService.setLanguage('ru-RU')
    } else {
      setLanguageState('en-US')
      languageService.setLanguage('en-US')
    }
  }, [])

  const setLanguage = (lang: string) => {
    setLanguageState(lang)
    languageService.setLanguage(lang)
    localStorage.setItem('preferred-language', lang)
  }

  const getText = async (key: string, params?: any[]): Promise<string> => {
    setIsLoading(true)
    try {
      const text = await languageService.getTextWithFallback(key, params)
      return text
    } finally {
      setIsLoading(false)
    }
  }

  const getTextSync = (key: string, params?: any[]): string => {
    // For synchronous access, we'll use a simple fallback
    const fallbackTexts: { [lang: string]: { [key: string]: string } } = {
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

    const texts = fallbackTexts[language] || fallbackTexts['en-US']
    let text = texts[key] || key

    if (params && params.length > 0) {
      text = text.replace(/{(\d+)}/g, (match, index) => {
        return params[parseInt(index)] !== undefined ? params[parseInt(index)] : match
      })
    }

    return text
  }

  const value: LanguageContextType = {
    language,
    setLanguage,
    getText,
    getTextSync,
    isLoading
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export default LanguageContext
