import React from 'react'
import { useLocation } from 'react-router-dom'
import { useNavigationWithParams } from '../hooks/useNavigationWithParams'
import { useAppDispatch } from '../store/store'
import {
  Button,
  TextField,
  Typography,
  Paper,
  Container,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material'
import { styled } from '@mui/material/styles'
import { register as registerAction } from '../store/actions/thunkActions/authentication'
import { ROUTES } from '../resources/routes-constants'
import { SYSTEM_PAGE_CODES } from '../resources/routes-constants'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { urlLanguageService } from '../services/urlLanguageService'
import { textCatalogService } from '../services/textCatalogService'
import { formatRegisterCheckEmailBody } from './registerCheckEmail'

const REGISTER_DEFAULTS_EN: Record<string, string> = {
  'register-title': 'Create account',
  'register-field-email': 'Email',
  'register-field-password': 'Password',
  'register-field-confirm-password': 'Confirm password',
  'register-submit': 'Register',
  'register-back-sign-in': 'Back to sign in',
  'register-validation-email-invalid': 'Enter a valid email',
  'register-validation-email-required': 'Email is required',
  'register-validation-password-min': 'Password must be at least 5 characters',
  'register-validation-password-required': 'Password is required',
  'register-validation-password-match': 'Passwords must match',
  'register-validation-confirm-password-required': 'Confirm password is required',
  'register-email-send-failed-prefix': 'Could not send email:',
  'register-error-try-later': 'Please try again later.',
  'register-error-generic': 'Registration failed',
  'register-error-invalid-fields': 'Fix the highlighted fields',
  'register-error-network': 'Network error during registration',
  'register-check-email-title': 'Check your email',
  'register-check-email-body':
    'We sent a confirmation link to {email}. Open it to finish signing up.',
  'register-check-email-body-no-address':
    'We sent a confirmation link to your email. Open it to finish signing up.',
  'register-check-email-spam': "If you don't see it, check Spam or Promotions.",
  'register-check-email-back': 'Back to sign in',
}

const REGISTER_DEFAULTS_RU: Record<string, string> = {
  'register-title': 'Создать аккаунт',
  'register-field-email': 'Email',
  'register-field-password': 'Пароль',
  'register-field-confirm-password': 'Подтвердите пароль',
  'register-submit': 'Зарегистрироваться',
  'register-back-sign-in': 'Ко входу',
  'register-validation-email-invalid': 'Введите корректный email',
  'register-validation-email-required': 'Email обязателен',
  'register-validation-password-min': 'Пароль должен быть не короче 5 символов',
  'register-validation-password-required': 'Пароль обязателен',
  'register-validation-password-match': 'Пароли должны совпадать',
  'register-validation-confirm-password-required': 'Подтверждение пароля обязательно',
  'register-email-send-failed-prefix': 'Не удалось отправить письмо:',
  'register-error-try-later': 'Попробуйте позже.',
  'register-error-generic': 'Регистрация не удалась',
  'register-error-invalid-fields': 'Исправьте выделенные поля',
  'register-error-network': 'Сетевая ошибка при регистрации',
  'register-check-email-title': 'Проверьте почту',
  'register-check-email-body':
    'Мы отправили ссылку для подтверждения на {email}. Откройте её, чтобы завершить регистрацию.',
  'register-check-email-body-no-address':
    'Мы отправили ссылку для подтверждения на вашу почту. Откройте её, чтобы завершить регистрацию.',
  'register-check-email-spam': 'Если письма нет — загляните в «Спам» или «Промоакции».',
  'register-check-email-back': 'Ко входу',
}

function registerDefaultsForLang(lang: string): Record<string, string> {
  return lang.toLowerCase().startsWith('ru') ? REGISTER_DEFAULTS_RU : REGISTER_DEFAULTS_EN
}

const RegisterContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(8),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
}))

const RegisterPaper = styled(Paper)(({ theme }) => ({
  marginTop: theme.spacing(3),
  padding: theme.spacing(4),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
  maxWidth: 480,
}))

const RegisterForm = styled('form')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(1),
}))

const SubmitButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
}))

interface RegisterFormData {
  email: string
  password: string
  confirmPassword: string
}

const RegisterPage: React.FC = () => {
  const location = useLocation()
  const navigateWithParams = useNavigationWithParams()
  const dispatch = useAppDispatch()
  const lang = React.useMemo(() => new URLSearchParams(location.search).get('lang') || 'en-US', [location.search])
  const [texts, setTexts] = React.useState<Record<string, string>>({})
  const [checkEmailAddress, setCheckEmailAddress] = React.useState<string | null>(null)
  const defaults = React.useMemo(() => registerDefaultsForLang(lang), [lang])
  const t = React.useCallback(
    (code: string) => texts[code] || defaults[code] || code,
    [texts, defaults]
  )
  const schema = React.useMemo(
    () =>
      yup.object().shape({
        email: yup.string().email(t('register-validation-email-invalid')).required(t('register-validation-email-required')),
        password: yup
          .string()
          .min(5, t('register-validation-password-min'))
          .required(t('register-validation-password-required')),
        confirmPassword: yup
          .string()
          .oneOf([yup.ref('password')], t('register-validation-password-match'))
          .required(t('register-validation-confirm-password-required')),
      }),
    [t]
  )

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
  })

  React.useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const loadedTexts = await textCatalogService.loadPageTexts({
          lang,
          systemPageCode: SYSTEM_PAGE_CODES.REGISTER,
          pathname: location.pathname,
        })
        if (!cancelled) {
          setTexts((prev) => ({ ...prev, ...loadedTexts }))
        }
      } catch (error) {
        console.error('[RegisterPage] failed to load page texts', error)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [lang, location.pathname])

  const goToLogin = () => {
    navigateWithParams(ROUTES.LOGIN_ROUTE, {
      params: { logout: null, returnurl: null },
      replace: true,
    })
  }

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const result = await dispatch(
        registerAction({
          credentials: {
            password: data.password,
            email: data.email,
          },
          lang: urlLanguageService.getCurrentLanguage(),
        })
      ).unwrap()

      // If email error occurred, show it and don't redirect
      if (result.emailError) {
        setError('root', {
          type: 'manual',
          message: `${t('register-email-send-failed-prefix')} ${result.emailError}. ${t('register-error-try-later')}`,
        })
        return
      }

      // If other error occurred, show it
      if (result.error) {
        setError('root', {
          type: 'manual',
          message: result.error,
        })
        return
      }

      // Success — stay on register with check-email panel (do not silent-redirect)
      if (result.success) {
        setCheckEmailAddress(data.email.trim())
      }
    } catch (err: unknown) {
      const payload =
        err && typeof err === 'object' && 'payload' in err
          ? (err as { payload?: { error?: string; emailError?: string } }).payload
          : undefined
      if (payload) {
        if (payload.emailError) {
          setError('root', {
            type: 'manual',
            message: `${t('register-email-send-failed-prefix')} ${payload.emailError}. ${t('register-error-try-later')}`,
          })
        } else {
          setError('root', {
            type: 'manual',
            message: payload.error || t('register-error-generic'),
          })
        }
      } else if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { errorFields?: unknown; error?: string; emailError?: string } } }
        if (axiosError.response?.data) {
          const data = axiosError.response.data
          if (data.errorFields) {
            setError('root', {
              type: 'manual',
              message: t('register-error-invalid-fields'),
            })
          } else if (data.emailError) {
            setError('root', {
              type: 'manual',
              message: `${t('register-email-send-failed-prefix')} ${data.emailError}. ${t('register-error-try-later')}`,
            })
          } else {
            setError('root', {
              type: 'manual',
              message: data.error || t('register-error-generic'),
            })
          }
        }
      } else {
        setError('root', {
          type: 'manual',
          message: t('register-error-network'),
        })
      }
    }
  }

  if (checkEmailAddress !== null) {
    const body = formatRegisterCheckEmailBody(t('register-check-email-body'), checkEmailAddress)

    return (
      <RegisterContainer maxWidth="xs">
        <RegisterPaper elevation={3}>
          <Typography component="h1" variant="h5">
            {t('register-check-email-title')}
          </Typography>
          <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
            <Typography variant="body1" component="p" sx={{ mb: 1 }}>
              {body}
            </Typography>
            <Typography variant="body2" component="p">
              {t('register-check-email-spam')}
            </Typography>
          </Alert>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            sx={{ mt: 3 }}
            onClick={goToLogin}
          >
            {t('register-check-email-back')}
          </Button>
        </RegisterPaper>
      </RegisterContainer>
    )
  }

  return (
    <RegisterContainer maxWidth="xs">
      <RegisterPaper elevation={3}>
        <Typography component="h1" variant="h5">
          {t('register-title')}
        </Typography>

        {errors.root && (
          <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
            {errors.root.message}
          </Alert>
        )}

        <RegisterForm onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            id="email"
            label={t('register-field-email')}
            type="email"
            autoComplete="email"
            disabled={isSubmitting}
            error={!!errors.email}
            helperText={errors.email?.message}
            {...formRegister('email')}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            label={t('register-field-password')}
            type="password"
            id="password"
            autoComplete="new-password"
            disabled={isSubmitting}
            error={!!errors.password}
            helperText={errors.password?.message}
            {...formRegister('password')}
          />
          <TextField
            variant="outlined"
            margin="normal"
            required
            fullWidth
            label={t('register-field-confirm-password')}
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            disabled={isSubmitting}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            {...formRegister('confirmPassword')}
          />

          <SubmitButton type="submit" fullWidth variant="contained" color="primary" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : t('register-submit')}
          </SubmitButton>

          <Grid container spacing={2} justifyContent="space-between">
            <Button
              variant="text"
              color="primary"
              onClick={goToLogin}
              disabled={isSubmitting}
            >
              {t('register-back-sign-in')}
            </Button>
          </Grid>
        </RegisterForm>
      </RegisterPaper>
    </RegisterContainer>
  )
}

export default RegisterPage
