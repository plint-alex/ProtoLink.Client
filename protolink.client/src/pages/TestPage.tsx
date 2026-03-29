import React from 'react'
import { useLocation } from 'react-router-dom'
import { textCatalogService } from '../services/textCatalogService'
import { SYSTEM_PAGE_CODES } from '../resources/routes-constants'

const TestPage: React.FC = () => {
  const location = useLocation()
  const lang = React.useMemo(() => new URLSearchParams(location.search).get('lang') || 'en-US', [location.search])
  const [texts, setTexts] = React.useState<Record<string, string>>({})
  const t = React.useCallback((code: string) => texts[code] || code, [texts])

  React.useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const loadedTexts = await textCatalogService.loadPageTexts({
          lang,
          systemPageCode: SYSTEM_PAGE_CODES.TEST,
          pathname: location.pathname,
        })
        if (!cancelled) {
          setTexts((prev) => ({ ...prev, ...loadedTexts }))
        }
      } catch (error) {
        console.error('[TestPage] failed to load page texts', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [lang, location.pathname])

  console.log('TestPage component is rendering!')
  console.log('Current URL:', window.location.href)
  console.log('Current pathname:', window.location.pathname)
  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>{t('test-title')}</h1>
      <p>{t('test-description')}</p>
      <p>{t('test-current-url')} {window.location.href}</p>
      <p>{t('test-route-ok')}</p>
    </div>
  )
}

export default TestPage
