import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Alert,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { useNavigationWithParams } from '../hooks/useNavigationWithParams'
import { ROUTES } from '../resources/routes-constants'
import { useAppDispatch } from '../store/store'
import { confirmEmail } from '../store/actions/thunkActions/authentication'

const CONFIRM_DEFAULTS_EN: Record<string, string> = {
  'confirm-email-title': 'Confirm email',
  'confirm-email-loading': 'Confirming your email…',
  'confirm-email-success': 'Email confirmed. You can sign in now.',
  'confirm-email-error': 'Could not confirm this link. It may be invalid or already used.',
  'confirm-email-missing-params': 'This confirmation link is incomplete. Use the link from your email.',
  'confirm-email-go-login': 'Sign in',
  'confirm-email-back-home': 'Back to home',
}

const CONFIRM_DEFAULTS_RU: Record<string, string> = {
  'confirm-email-title': 'Подтверждение email',
  'confirm-email-loading': 'Подтверждаем email…',
  'confirm-email-success': 'Email подтверждён. Можно войти.',
  'confirm-email-error': 'Не удалось подтвердить ссылку. Она недействительна или уже использована.',
  'confirm-email-missing-params': 'В ссылке не хватает данных. Откройте её из письма.',
  'confirm-email-go-login': 'Войти',
  'confirm-email-back-home': 'На главную',
}

function defaultsForLang(lang: string): Record<string, string> {
  return lang.toLowerCase().startsWith('ru') ? CONFIRM_DEFAULTS_RU : CONFIRM_DEFAULTS_EN
}

const PageContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(8),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}))

const PagePaper = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  maxWidth: 480,
  gap: theme.spacing(2),
}))

type Status = 'loading' | 'success' | 'error' | 'missing'

const ConfirmEmailPage: React.FC = () => {
  const location = useLocation()
  const navigateWithParams = useNavigationWithParams()
  const dispatch = useAppDispatch()
  const ranRef = useRef(false)

  const lang = useMemo(
    () => new URLSearchParams(location.search).get('lang') || 'en-US',
    [location.search]
  )
  const defaults = useMemo(() => defaultsForLang(lang), [lang])
  const t = (code: string) => defaults[code] || code

  const { userId, token } = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return {
      userId: (params.get('userId') || '').trim(),
      token: (params.get('token') || '').trim(),
    }
  }, [location.search])

  const [status, setStatus] = useState<Status>(
    userId && token ? 'loading' : 'missing'
  )

  useEffect(() => {
    if (!userId || !token) {
      setStatus('missing')
      return
    }
    if (ranRef.current) return
    ranRef.current = true

    let cancelled = false
    void (async () => {
      try {
        const result = await dispatch(confirmEmail({ userId, token }))
        if (cancelled) return
        if (confirmEmail.fulfilled.match(result) && result.payload === true) {
          setStatus('success')
        } else {
          setStatus('error')
        }
      } catch {
        if (!cancelled) setStatus('error')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [dispatch, userId, token])

  return (
    <PageContainer maxWidth="xs">
      <PagePaper elevation={3}>
        <Typography component="h1" variant="h5">
          {t('confirm-email-title')}
        </Typography>

        {status === 'loading' && (
          <>
            <CircularProgress size={32} />
            <Typography variant="body1">{t('confirm-email-loading')}</Typography>
          </>
        )}

        {status === 'success' && (
          <Alert severity="success" sx={{ width: '100%' }}>
            {t('confirm-email-success')}
          </Alert>
        )}

        {status === 'error' && (
          <Alert severity="error" sx={{ width: '100%' }}>
            {t('confirm-email-error')}
          </Alert>
        )}

        {status === 'missing' && (
          <Alert severity="warning" sx={{ width: '100%' }}>
            {t('confirm-email-missing-params')}
          </Alert>
        )}

        {status !== 'loading' && (
          <>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              onClick={() => navigateWithParams(ROUTES.LOGIN_ROUTE)}
            >
              {t('confirm-email-go-login')}
            </Button>
            <Button
              fullWidth
              variant="text"
              color="primary"
              onClick={() => navigateWithParams(ROUTES.HOMEPAGE_ROUTE)}
            >
              {t('confirm-email-back-home')}
            </Button>
          </>
        )}
      </PagePaper>
    </PageContainer>
  )
}

export default ConfirmEmailPage
