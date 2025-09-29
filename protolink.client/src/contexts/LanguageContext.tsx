import React, { createContext, useContext, useState, ReactNode } from 'react'

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
  const [isLoading] = useState(false)

  const handleSetLanguage = (lang: string) => {
    setLanguageState(lang)
    localStorage.setItem('preferred-language', lang)
    ;(window as any).currentLanguage = lang
    document.body.setAttribute('data-current-language', lang)
  }

  const getText = async (key: string, _params?: any[]): Promise<string> => {
    return key
  }

  const getTextSync = (key: string, _params?: any[]): string => {
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

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export default LanguageContext