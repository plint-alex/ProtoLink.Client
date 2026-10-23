import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CircularProgress, Stack, Typography } from '@mui/material'
import LockOutlined from '@mui/icons-material/LockOutlined'
import { useLocation, useParams } from 'react-router-dom'
import EntityState from '../components/EntityState'
import { useDelayedFlag } from '../hooks/useDelayedFlag'
import { useNavigationWithParams } from '../hooks/useNavigationWithParams'
import { ROUTES, SYSTEM_PAGE_CODES } from '../resources/routes-constants'
import { textCatalogService } from '../services/textCatalogService'
import {
  clearShareSession,
  markShareSessionEnded,
  persistShareSession,
  redeemShareToken,
} from '../services/shareSession'

const LOADING_DELAY_MS = 300

/** EN-only offline fallback; RU/EN product copy comes from Api catalog. */
const SHARE_REDEEM_DEFAULTS_EN: Record<string, string> = {
  'share-redeem-opening': 'Opening shared item…',
  'share-redeem-title': 'This link no longer works',
  'share-redeem-subtitle':
    'It may have expired or been turned off. Ask the person who sent it for a new one.',
  'share-redeem-sign-in': 'Sign in',
  'share-redeem-go-home': 'Go to ProtoLink',
  'share-redeem-details': 'Details',
}

type Status = 'loading' | 'unavailable'

/**
 * /share/{token} → Redeem → sessionStorage → replace navigate to /{entityId} (AT-S3, AT-S4).
 * Failure uses one generic product state (AT-S23, AT-S27) — never raw HTTP / GUID in the UI.
 */
const ShareRedeemPage: React.FC = () => {
  const { token: routeToken } = useParams<{ token?: string }>()
  const location = useLocation()
  const navigateWithParams = useNavigationWithParams()
  const ranRef = useRef(false)

  const lang = useMemo(
    () => new URLSearchParams(location.search).get('lang') || 'en-US',
    [location.search]
  )
  const [texts, setTexts] = useState<Record<string, string>>({})
  const t = React.useCallback(
    (code: string) => texts[code] || SHARE_REDEEM_DEFAULTS_EN[code] || code,
    [texts]
  )

  const token = (routeToken || '').trim()
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'unavailable')
  const showSpinner = useDelayedFlag(status === 'loading', LOADING_DELAY_MS)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const loadedTexts = await textCatalogService.loadPageTexts({
          lang,
          systemPageCode: SYSTEM_PAGE_CODES.SHARE_REDEEM,
          pathname: location.pathname,
        })
        if (!cancelled) {
          setTexts((prev) => ({ ...prev, ...loadedTexts }))
        }
      } catch (error) {
        console.error('[ShareRedeemPage] failed to load page texts', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [lang, location.pathname])

  useEffect(() => {
    if (!token) {
      setStatus('unavailable')
      markShareSessionEnded()
      return
    }
    if (ranRef.current) return
    ranRef.current = true

    let cancelled = false
    void (async () => {
      const outcome = await redeemShareToken(token)
      if (cancelled) return
      if (!outcome.ok) {
        clearShareSession()
        markShareSessionEnded()
        setStatus('unavailable')
        return
      }
      persistShareSession(token, outcome.result)
      navigateWithParams(`/${outcome.result.entityId}`, { replace: true })
    })()

    return () => {
      cancelled = true
    }
  }, [token, navigateWithParams])

  if (status === 'unavailable') {
    const returnUrl = `${location.pathname}${location.search}`
    return (
      <EntityState
        icon={<LockOutlined />}
        title={t('share-redeem-title')}
        subtitle={t('share-redeem-subtitle')}
        action={{
          label: t('share-redeem-sign-in'),
          to: `${ROUTES.LOGIN_ROUTE}?returnurl=${encodeURIComponent(returnUrl)}`,
        }}
        secondaryAction={{
          label: t('share-redeem-go-home'),
          to: ROUTES.HOMEPAGE_ROUTE,
        }}
        detailsLabel={t('share-redeem-details')}
        // Intentionally omit details — never surface token / HTTP / GUID (AT-S27).
      />
    )
  }

  return (
    <Stack spacing={2} alignItems="center" sx={{ py: 8 }} aria-busy="true">
      {showSpinner && (
        <>
          <CircularProgress size={32} />
          <Typography variant="body1" color="text.secondary">
            {t('share-redeem-opening')}
          </Typography>
        </>
      )}
    </Stack>
  )
}

export default ShareRedeemPage
