import React, { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Alert,
  Button,
  CircularProgress,
  Container,
  Paper,
  TextField,
  Typography,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { isAxiosError } from 'axios'
import { useNavigationWithParams } from '../hooks/useNavigationWithParams'
import { useAppDispatch } from '../store/store'
import { resetPassword } from '../store/actions/thunkActions/authentication'
import { ROUTES } from '../resources/routes-constants'

const RESET_DEFAULTS_EN: Record<string, string> = {
  'reset-title': 'Choose a new password',
  'reset-field-password': 'New password',
  'reset-field-confirm': 'Confirm password',
  'reset-submit': 'Save password',
  'reset-success': 'Password updated. You can sign in now.',
  'reset-error-invalid': 'This reset link is invalid or has expired. Request a new one.',
  'reset-error-missing-params': 'This reset link is incomplete. Use the link from your email.',
  'reset-validation-mismatch': 'Passwords do not match',
  'reset-validation-password-min': 'Password must be at least 5 characters',
  'reset-validation-password-required': 'Password is required',
  'reset-validation-confirm-required': 'Confirm password is required',
  'reset-go-login': 'Back to sign in',
  'reset-request-again': 'Forgot password',
  'reset-error-network': 'Network error. Try again later.',
}

const RESET_DEFAULTS_RU: Record<string, string> = {
  'reset-title': 'Новый пароль',
  'reset-field-password': 'Новый пароль',
  'reset-field-confirm': 'Подтвердите пароль',
  'reset-submit': 'Сохранить пароль',
  'reset-success': 'Пароль обновлён. Можно войти.',
  'reset-error-invalid': 'Ссылка недействительна или устарела. Запросите новую.',
  'reset-error-missing-params': 'В ссылке не хватает данных. Откройте её из письма.',
  'reset-validation-mismatch': 'Пароли не совпадают',
  'reset-validation-password-min': 'Пароль должен быть не короче 5 символов',
  'reset-validation-password-required': 'Пароль обязателен',
  'reset-validation-confirm-required': 'Подтверждение пароля обязательно',
  'reset-go-login': 'Ко входу',
  'reset-request-again': 'Восстановление пароля',
  'reset-error-network': 'Сетевая ошибка. Попробуйте позже.',
}

function defaultsForLang(lang: string): Record<string, string> {
  return lang.toLowerCase().startsWith('ru') ? RESET_DEFAULTS_RU : RESET_DEFAULTS_EN
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
  gap: theme.spacing(1),
}))

const PageForm = styled('form')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1),
}))

const SubmitButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
}))

interface ResetFormData {
  password: string
  confirmPassword: string
}

type PageStatus = 'form' | 'success' | 'missing'

const ResetPasswordPage: React.FC = () => {
  const location = useLocation()
  const navigateWithParams = useNavigationWithParams()
  const dispatch = useAppDispatch()

  const lang = useMemo(
    () => new URLSearchParams(location.search).get('lang') || 'en-US',
    [location.search]
  )
  const defaults = useMemo(() => defaultsForLang(lang), [lang])
  const t = React.useCallback((code: string) => defaults[code] || code, [defaults])

  const { userId, token } = useMemo(() => {
    const params = new URLSearchParams(location.search)
    return {
      userId: (params.get('userId') || '').trim(),
      token: (params.get('token') || '').trim(),
    }
  }, [location.search])

  const [status, setStatus] = React.useState<PageStatus>(
    userId && token ? 'form' : 'missing'
  )
  const [apiError, setApiError] = React.useState<string | null>(null)

  const schema = React.useMemo(
    () =>
      yup.object().shape({
        password: yup
          .string()
          .min(5, t('reset-validation-password-min'))
          .required(t('reset-validation-password-required')),
        confirmPassword: yup
          .string()
          .oneOf([yup.ref('password')], t('reset-validation-mismatch'))
          .required(t('reset-validation-confirm-required')),
      }),
    [t]
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormData>({ resolver: yupResolver(schema) })

  const onSubmit = async (data: ResetFormData) => {
    setApiError(null)
    try {
      const result = await dispatch(
        resetPassword({
          userId,
          token,
          newPassword: data.password,
        })
      )
      if (resetPassword.fulfilled.match(result) && result.payload.success) {
        setStatus('success')
        return
      }
      if (resetPassword.rejected.match(result)) {
        const payload = result.payload as { error?: string } | undefined
        setApiError(payload?.error || t('reset-error-invalid'))
        return
      }
      setApiError(t('reset-error-invalid'))
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.data?.error) {
        setApiError(String(err.response.data.error))
      } else {
        setApiError(t('reset-error-network'))
      }
    }
  }

  const showRequestAgain = status === 'missing' || (status === 'form' && !!apiError)

  return (
    <PageContainer maxWidth="xs">
      <PagePaper elevation={3}>
        <Typography component="h1" variant="h5">
          {t('reset-title')}
        </Typography>

        {status === 'missing' && (
          <Alert severity="warning" sx={{ width: '100%' }}>
            {t('reset-error-missing-params')}
          </Alert>
        )}

        {status === 'success' && (
          <Alert severity="success" sx={{ width: '100%' }}>
            {t('reset-success')}
          </Alert>
        )}

        {status === 'form' && (
          <>
            {apiError && (
              <Alert severity="error" sx={{ width: '100%' }}>
                {apiError}
              </Alert>
            )}

            <PageForm onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="password"
                label={t('reset-field-password')}
                type="password"
                autoComplete="new-password"
                autoFocus
                disabled={isSubmitting}
                error={!!errors.password}
                helperText={errors.password?.message}
                {...register('password')}
              />

              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="confirmPassword"
                label={t('reset-field-confirm')}
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword?.message}
                {...register('confirmPassword')}
              />

              <SubmitButton
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={24} /> : t('reset-submit')}
              </SubmitButton>
            </PageForm>
          </>
        )}

        {status !== 'form' && (
          <Button
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 1 }}
            onClick={() => navigateWithParams(ROUTES.LOGIN_ROUTE)}
          >
            {t('reset-go-login')}
          </Button>
        )}

        {status === 'form' && (
          <Button
            fullWidth
            variant="text"
            color="primary"
            onClick={() => navigateWithParams(ROUTES.LOGIN_ROUTE)}
            disabled={isSubmitting}
          >
            {t('reset-go-login')}
          </Button>
        )}

        {showRequestAgain && (
          <Button
            fullWidth
            variant="text"
            color="primary"
            onClick={() => navigateWithParams(ROUTES.FORGOT_PASSWORD_ROUTE)}
          >
            {t('reset-request-again')}
          </Button>
        )}
      </PagePaper>
    </PageContainer>
  )
}

export default ResetPasswordPage
