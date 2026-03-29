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
  const t = React.useCallback((code: string) => texts[code] || code, [texts])
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

      // Success - redirect to login and clean URL parameters
      if (result.success) {
        navigateWithParams(ROUTES.LOGIN_ROUTE, {
          params: { logout: null, returnurl: null },
          replace: true
        })
      }
    } catch (err: any) {
      // Handle rejected promise from thunk
      if (err?.payload) {
        const errorData = err.payload as { error?: string; emailError?: string }
        if (errorData.emailError) {
          setError('root', {
            type: 'manual',
            message: `${t('register-email-send-failed-prefix')} ${errorData.emailError}. ${t('register-error-try-later')}`,
          })
        } else {
          setError('root', {
            type: 'manual',
            message: errorData.error || t('register-error-generic'),
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
              onClick={() => navigateWithParams(ROUTES.LOGIN_ROUTE, {
                params: { logout: null, returnurl: null },
                replace: true
              })}
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

