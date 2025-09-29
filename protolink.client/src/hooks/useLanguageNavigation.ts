import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export const useLanguageNavigation = () => {
  const location = useLocation()

  useEffect(() => {
    try {
      // Get current language from URL parameters or default to 'en-US'
      const urlParams = new URLSearchParams(window.location.search)
      let currentLang = 'en-US'
      
      if (urlParams.has('lang')) {
        currentLang = urlParams.get('lang') || 'en-US'
      } else {
        // Add lang parameter if it doesn't exist
        urlParams.set('lang', 'en-US')
        const newUrl = `${window.location.pathname}?${urlParams.toString()}`
        window.history.replaceState({}, '', newUrl)
      }
      
      // Update global variables
      ;(window as any).currentLanguage = currentLang
      document.body.setAttribute('data-current-language', currentLang)
    } catch (error) {
      // Fallback
      ;(window as any).currentLanguage = 'en-US'
      document.body.setAttribute('data-current-language', 'en-US')
    }
  }, [location.search, location.pathname])
}