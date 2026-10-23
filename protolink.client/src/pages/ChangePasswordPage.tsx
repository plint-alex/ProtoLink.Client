import React, { useEffect, useMemo } from 'react'
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
import { useNavigationWithParams } from '../hooks/useNavigationWithParams'
import { useAppDispatch, useAppSelector } from '../store/store'
import { changePassword } from '../store/actions/thunkActions/authentication'
import { ROUTES } from '../resources/routes-constants'

const CHANGE_DEFAULTS_EN: Record<string, string> = {
  'change-password-title': 'Change password',
  'change-password-field-current': 'Current password',
  'change-password-field-new': 'New password',
  'change-password-field-confirm': 'Confirm new password',
  'change-password-submit': 'Save password',
  'change-password-success': 'Password updated.',
  'change-password-success-hint': 'Other devices may need to sign in again.',
  'change-password-error-current': 'Current password is incorrect.',
  'change-password-validation-min': 'Password must be at least 5 characters',
  'change-password-validation-mismatch': 'Passwords do not match',
  'change-password-validation-required': 'Required',
  'change-password-error-network': 'Network error. Try again later.',
  'change-password-back-home': 'Back',
}

const CHANGE_DEFAULTS_RU: Record<string, string> = {
  'change-password-title': 'Смена пароля',
  'change-password-field-current': 'Текущий пароль',
  'change-password-field-new': 'Новый пароль',
  'change-password-field-confirm': 'Подтвердите новый пароль',
  'change-password-submit': 'Сохранить пароль',
  'change-password-success': 'Пароль обновлён.',
  'change-password-success-hint': 'На других устройствах может потребоваться повторный вход.',
  'change-password-error-current': 'Неверный текущий пароль.',
  'change-password-validation-min': 'Пароль не короче 5 символов',
  'change-password-validation-mismatch': 'Пароли не совпадают',
  'change-password-validation-required': 'Обязательное поле',
  'change-password-error-network': 'Сетевая ошибка. Попробуйте позже.',
  'change-password-back-home': 'Назад',
}

function defaultsForLang(lang: string): Record<string, string> {
  return lang.toLowerCase().startsWith('ru') ? CHANGE_DEFAULTS_RU : CHANGE_DEFAULTS_EN
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

interface ChangeFormData {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

const WRONG_CURRENT_API = 'Current password is incorrect.'

const ChangePasswordPage: React.FC = () => {
  const location = useLocation()
  const navigateWithParams = useNavigationWithParams()
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector((s) => s.authentication?.accessToken)

  const lang = useMemo(
    () => new URLSearchParams(location.search).get('lang') || 'en-US',
    [location.search]
  )
  const defaults = useMemo(() => defaultsForLang(lang), [lang])
  const t = React.useCallback((code: string) => defaults[code] || code, [defaults])

  const [success, setSuccess] = React.useState(false)

  useEffect(() => {
    if (!accessToken) {
      navigateWithParams(ROUTES.LOGIN_ROUTE, {
        params: { logout: null, returnurl: ROUTES.CHANGE_PASSWORD_ROUTE },
        replace: true,
      })
    }
  }, [accessToken, navigateWithParams])

  const schema = React.useMemo(
    () =>
      yup.object().shape({
        currentPassword: yup.string().required(t('change-password-validation-required')),
        newPassword: yup
          .string()
          .min(5, t('change-password-validation-min'))
          .required(t('change-password-validation-required')),
        confirmPassword: yup
          .string()
          .oneOf([yup.ref('newPassword')], t('change-password-validation-mismatch'))
          .required(t('change-password-validation-required')),
      }),
    [t]
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    clearErrors,
  } = useForm<ChangeFormData>({ resolver: yupResolver(schema) })

  const onSubmit = async (data: ChangeFormData) => {
    clearErrors('root')
    clearErrors('currentPassword')
    try {
      const result = await dispatch(
        changePassword({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        })
      )
      if (changePassword.fulfilled.match(result) && result.payload.success) {
        setSuccess(true)
        return
      }
      if (changePassword.rejected.match(result)) {
        const apiError = result.payload?.error || ''
        if (apiError.includes(WRONG_CURRENT_API) || /incorrect|неверн/i.test(apiError)) {
          setError('currentPassword', {
            type: 'manual',
            message: t('change-password-error-current'),
          })
          return
        }
        setError('root', {
          type: 'manual',
          message: apiError || t('change-password-error-network'),
        })
        return
      }
      setError('root', { type: 'manual', message: t('change-password-error-network') })
    } catch {
      setError('root', { type: 'manual', message: t('change-password-error-network') })
    }
  }

  if (!accessToken) {
    return null
  }

  return (
    <PageContainer maxWidth="xs">
      <PagePaper elevation={3}>
        <Typography component="h1" variant="h5">
          {t('change-password-title')}
        </Typography>

        {success ? (
          <>
            <Alert severity="success" sx={{ width: '100%', mt: 1 }}>
              <Typography variant="body1" component="p" sx={{ mb: 0.5 }}>
                {t('change-password-success')}
              </Typography>
              <Typography variant="body2" component="p">
                {t('change-password-success-hint')}
              </Typography>
            </Alert>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={() => navigateWithParams(ROUTES.HOMEPAGE_ROUTE)}
            >
              {t('change-password-back-home')}
            </Button>
          </>
        ) : (
          <>
            {errors.root && (
              <Alert severity="error" sx={{ width: '100%' }}>
                {errors.root.message}
              </Alert>
            )}

            <PageForm onSubmit={handleSubmit(onSubmit)} noValidate>
              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="currentPassword"
                label={t('change-password-field-current')}
                type="password"
                autoComplete="current-password"
                autoFocus
                disabled={isSubmitting}
                error={!!errors.currentPassword}
                helperText={errors.currentPassword?.message}
                {...register('currentPassword')}
              />

              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="newPassword"
                label={t('change-password-field-new')}
                type="password"
                autoComplete="new-password"
                disabled={isSubmitting}
                error={!!errors.newPassword}
                helperText={errors.newPassword?.message}
                {...register('newPassword')}
              />

              <TextField
                variant="outlined"
                margin="normal"
                required
                fullWidth
                id="confirmPassword"
                label={t('change-password-field-confirm')}
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
                {isSubmitting ? <CircularProgress size={24} /> : t('change-password-submit')}
              </SubmitButton>
            </PageForm>
          </>
        )}
      </PagePaper>
    </PageContainer>
  )
}

export default ChangePasswordPage
