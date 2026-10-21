import React, { useEffect, useMemo, useRef, useState } from 'react'
import { CircularProgress, Stack, Typography } from '@mui/material'
import LockOutlined from '@mui/icons-material/LockOutlined'
import { useLocation, useParams } from 'react-router-dom'
import EntityState from '../components/EntityState'
import { useDelayedFlag } from '../hooks/useDelayedFlag'
import { useNavigationWithParams } from '../hooks/useNavigationWithParams'
import { ROUTES } from '../resources/routes-constants'
import {
  clearShareSession,
  markShareSessionEnded,
  persistShareSession,
  redeemShareToken,
} from '../services/shareSession'

const LOADING_DELAY_MS = 300

const COPY_EN = {
  opening: 'Opening shared item…',
  title: 'This link no longer works',
  subtitle:
    'It may have expired or been turned off. Ask the person who sent it for a new one.',
  signIn: 'Sign in',
  goHome: 'Go to ProtoLink',
  details: 'Details',
} as const

const COPY_RU = {
  opening: 'Открываем общий элемент…',
  title: 'Ссылка больше не работает',
  subtitle:
    'Возможно, срок истёк или её отключили. Попросите новую у того, кто её прислал.',
  signIn: 'Войти',
  goHome: 'На ProtoLink',
  details: 'Подробности',
} as const

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
  const isRu = lang.toLowerCase().startsWith('ru')
  const copy = isRu ? COPY_RU : COPY_EN

  const token = (routeToken || '').trim()
  const [status, setStatus] = useState<Status>(token ? 'loading' : 'unavailable')
  const showSpinner = useDelayedFlag(status === 'loading', LOADING_DELAY_MS)

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
        title={copy.title}
        subtitle={copy.subtitle}
        action={{
          label: copy.signIn,
          to: `${ROUTES.LOGIN_ROUTE}?returnurl=${encodeURIComponent(returnUrl)}`,
        }}
        secondaryAction={{
          label: copy.goHome,
          to: ROUTES.HOMEPAGE_ROUTE,
        }}
        detailsLabel={copy.details}
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
            {copy.opening}
          </Typography>
        </>
      )}
    </Stack>
  )
}

export default ShareRedeemPage
