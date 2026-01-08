import React from 'react'
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
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { urlLanguageService } from '../services/urlLanguageService'

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

const schema = yup.object().shape({
  email: yup.string().email('Enter a valid email').required('Email is required'),
  password: yup.string().min(5, 'Password must be at least 5 characters').required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
})

const RegisterPage: React.FC = () => {
  const navigateWithParams = useNavigationWithParams()
  const dispatch = useAppDispatch()

  const {
    register: formRegister,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormData>({
    resolver: yupResolver(schema),
  })

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
          message: `Email sending failed: ${result.emailError}. Please try again later.`,
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
            message: `Email sending failed: ${errorData.emailError}. Please try again later.`,
          })
        } else {
          setError('root', {
            type: 'manual',
            message: errorData.error || 'An error occurred during registration',
          })
        }
      } else if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { errorFields?: unknown; error?: string; emailError?: string } } }
        if (axiosError.response?.data) {
          const data = axiosError.response.data
          if (data.errorFields) {
            setError('root', {
              type: 'manual',
              message: 'Registration data is invalid. Please check the fields.',
            })
          } else if (data.emailError) {
            setError('root', {
              type: 'manual',
              message: `Email sending failed: ${data.emailError}. Please try again later.`,
            })
          } else {
            setError('root', {
              type: 'manual',
              message: data.error || 'An error occurred during registration',
            })
          }
        }
      } else {
        setError('root', {
          type: 'manual',
          message: 'Network error. Please try again later.',
        })
      }
    }
  }

  return (
    <RegisterContainer maxWidth="xs">
      <RegisterPaper elevation={3}>
        <Typography component="h1" variant="h5">
          Create a new account
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
            label="Email"
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
            label="Password"
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
            label="Confirm Password"
            type="password"
            id="confirmPassword"
            autoComplete="new-password"
            disabled={isSubmitting}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
            {...formRegister('confirmPassword')}
          />

          <SubmitButton type="submit" fullWidth variant="contained" color="primary" disabled={isSubmitting}>
            {isSubmitting ? <CircularProgress size={24} /> : 'Register'}
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
              Back to Sign In
            </Button>
          </Grid>
        </RegisterForm>
      </RegisterPaper>
    </RegisterContainer>
  )
}

export default RegisterPage

