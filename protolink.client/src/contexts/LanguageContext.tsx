import React, { createContext, useContext, useState, ReactNode } from 'react'

type TextParams = unknown[]

interface LanguageContextType {
  language: string
  setLanguage: (lang: string) => void
  getText: (key: string, params?: TextParams) => Promise<string>
  getTextSync: (key: string, params?: TextParams) => string
  isLoading: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

type WindowWithLanguage = Window & { currentLanguage?: string }

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguageState] = useState<string>('en-US')
  const [isLoading] = useState(false)

  const handleSetLanguage = (lang: string) => {
    setLanguageState(lang)
    localStorage.setItem('preferred-language', lang)
    ;(window as WindowWithLanguage).currentLanguage = lang
    document.body.setAttribute('data-current-language', lang)
  }

  const getText = async (key: string, _params?: TextParams): Promise<string> => {
    void _params
    return key
  }

  const getTextSync = (key: string, _params?: TextParams): string => {
    void _params
    return key
  }

  const value: LanguageContextType = {
    language,
    setLanguage: handleSetLanguage,
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

// eslint-disable-next-line react-refresh/only-export-components -- hook paired with provider
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export default LanguageContext