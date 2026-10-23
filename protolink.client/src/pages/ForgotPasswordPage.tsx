import React from 'react'
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
import { useAppDispatch } from '../store/store'
import { forgotPassword } from '../store/actions/thunkActions/authentication'
import { ROUTES } from '../resources/routes-constants'
import { formatEmailBodyPlaceholder } from './formatEmailBody'

const FORGOT_DEFAULTS_EN: Record<string, string> = {
  'forgot-title': 'Forgot password',
  'forgot-body': "Enter your email. If an account exists, we'll send a reset link.",
  'forgot-field-email': 'Email',
  'forgot-submit': 'Send reset link',
  'forgot-check-email-title': 'Check your email',
  'forgot-check-email-body':
    'If an account exists for {email}, we sent a reset link. Open it to choose a new password.',
  'forgot-check-email-spam': "If you don't see it, check Spam or Promotions.",

  'forgot-check-email-back': 'Back to sign in',
  'forgot-validation-email-invalid': 'Enter a valid email',
  'forgot-validation-email-required': 'Email is required',
  'forgot-error-network': 'Network error. Try again later.',
}

const FORGOT_DEFAULTS_RU: Record<string, string> = {
  'forgot-title': 'Восстановление пароля',
  'forgot-body': 'Введите email. Если аккаунт есть, мы отправим ссылку для сброса.',
  'forgot-field-email': 'Email',
  'forgot-submit': 'Отправить ссылку',
  'forgot-check-email-title': 'Проверьте почту',
  'forgot-check-email-body':
    'Если аккаунт для {email} есть, мы отправили ссылку для сброса. Откройте её, чтобы задать новый пароль.',
  'forgot-check-email-spam': 'Если письма нет — загляните в «Спам» или «Промоакции».',
  'forgot-check-email-back': 'Ко входу',
  'forgot-validation-email-invalid': 'Введите корректный email',
  'forgot-validation-email-required': 'Email обязателен',
  'forgot-error-network': 'Сетевая ошибка. Попробуйте позже.',
}

function defaultsForLang(lang: string): Record<string, string> {
  return lang.toLowerCase().startsWith('ru') ? FORGOT_DEFAULTS_RU : FORGOT_DEFAULTS_EN
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
}))

const PageForm = styled('form')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1),
}))

const SubmitButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
}))

interface ForgotFormData {
  email: string
}

const ForgotPasswordPage: React.FC = () => {
  const location = useLocation()
  const navigateWithParams = useNavigationWithParams()
  const dispatch = useAppDispatch()
  const lang = React.useMemo(
    () => new URLSearchParams(location.search).get('lang') || 'en-US',
    [location.search]
  )
  const defaults = React.useMemo(() => defaultsForLang(lang), [lang])
  const t = React.useCallback((code: string) => defaults[code] || code, [defaults])

  const [submittedEmail, setSubmittedEmail] = React.useState<string | null>(null)

  const schema = React.useMemo(
    () =>
      yup.object().shape({
        email: yup
          .string()
          .email(t('forgot-validation-email-invalid'))
          .required(t('forgot-validation-email-required')),
      }),
    [t]
  )

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ForgotFormData>({ resolver: yupResolver(schema) })

  const goToLogin = () => navigateWithParams(ROUTES.LOGIN_ROUTE)

  const onSubmit = async (data: ForgotFormData) => {
    try {
      const result = await dispatch(forgotPassword({ email: data.email.trim(), lang }))
      // Anti-enumeration: always show success when request completes (fulfilled).
      if (forgotPassword.fulfilled.match(result)) {
        setSubmittedEmail(data.email.trim())
        return
      }
      // Network/transport failure only — do not invent “user not found”.
      setError('root', { type: 'manual', message: t('forgot-error-network') })
    } catch {
      setError('root', { type: 'manual', message: t('forgot-error-network') })
    }
  }

  if (submittedEmail !== null) {
    const body = formatEmailBodyPlaceholder(t('forgot-check-email-body'), submittedEmail)
    return (
      <PageContainer maxWidth="xs">
        <PagePaper elevation={3}>
          <Typography component="h1" variant="h5">
            {t('forgot-check-email-title')}
          </Typography>
          <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
            <Typography variant="body1" component="p" sx={{ mb: 1 }}>
              {body}
            </Typography>
            <Typography variant="body2" component="p">
              {t('forgot-check-email-spam')}
            </Typography>
          </Alert>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            onClick={goToLogin}
          >
            {t('forgot-check-email-back')}
          </Button>
        </PagePaper>
      </PageContainer>
    )
  }

  return (
    <PageContainer maxWidth="xs">
      <PagePaper elevation={3}>
        <Typography component="h1" variant="h5">
          {t('forgot-title')}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, mb: 1, width: '100%', textAlign: 'center' }}>
          {t('forgot-body')}
        </Typography>

        {errors.root && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {errors.root.message}
          </Alert>
        )}

        <PageForm onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label={t('forgot-field-email')}
            type="email"
            autoComplete="email"
            autoFocus
            disabled={isSubmitting}
            error={!!errors.email}
            helperText={errors.email?.message}
            {...register('email')}
          />

          <SubmitButton
            type="submit"
            fullWidth
            variant="contained"
            color="primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={24} /> : t('forgot-submit')}
          </SubmitButton>

          <Button
            fullWidth
            variant="text"
            color="primary"
            onClick={goToLogin}
            disabled={isSubmitting}
          >
            {t('forgot-check-email-back')}
          </Button>
        </PageForm>
      </PagePaper>
    </PageContainer>
  )
}

export default ForgotPasswordPage
