import React, { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useNavigationWithParams } from '../hooks/useNavigationWithParams'
import { ROUTES } from '../resources/routes-constants'
import { textCatalogService } from '../services/textCatalogService'
import { SYSTEM_PAGE_CODES } from '../resources/routes-constants'

const NOTFOUND_DEFAULTS_EN: Record<string, string> = {
    'notfound-title': 'Oops 404!',
    'notfound-back-home': 'Homepage',
}

const NotFoundPage: React.FC = () => {
    const navigateWithParams = useNavigationWithParams()
    const location = useLocation()
    const lang = useMemo(
        () => new URLSearchParams(location.search).get('lang') || 'en-US',
        [location.search]
    )
    const [texts, setTexts] = useState<Record<string, string>>({})
    const t = (code: string) => texts[code] || NOTFOUND_DEFAULTS_EN[code] || code

    useEffect(() => {
        let cancelled = false
        void (async () => {
            try {
                const loaded = await textCatalogService.loadPageTexts({
                    lang,
                    systemPageCode: SYSTEM_PAGE_CODES.LAYOUT,
                    pathname: location.pathname,
                })
                if (!cancelled) {
                    setTexts(loaded)
                }
            } catch (error) {
                console.error('[NotFoundPage] failed to load texts', error)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [lang, location.pathname])

    const redirectToHomePage = () => {
        navigateWithParams(ROUTES.HOMEPAGE_ROUTE)
    }

    return (
        <div
            style={{
                position: 'relative',
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexDirection: 'column',
            }}
        >
            <h1 style={{ fontSize: '4em' }}>{t('notfound-title')}</h1>
            <span style={{ cursor: 'pointer' }} onClick={() => redirectToHomePage()}>
                {t('notfound-back-home')}
            </span>
        </div>
    )
}

export default NotFoundPage
