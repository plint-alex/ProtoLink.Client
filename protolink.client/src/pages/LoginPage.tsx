import React, { useEffect } from 'react';
import { useNavigationWithParams } from '../hooks/useNavigationWithParams';
import { useAppDispatch, useAppSelector, store } from '../store/store';
import {
    Button,
    TextField,
    Typography,
    Paper,
    Container,
    Grid,
    Alert,
    CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { login as loginAction } from '../store/actions/thunkActions/authentication';
import { ROUTES } from '../resources/routes-constants';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const LoginContainer = styled(Container)(({ theme }) => ({
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
}));

const LoginPaper = styled(Paper)(({ theme }) => ({
    marginTop: theme.spacing(3),
    padding: theme.spacing(4),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: 450,
}));

const LoginForm = styled('form')(({ theme }) => ({
    width: '100%',
    marginTop: theme.spacing(1),
}));

const SubmitButton = styled(Button)(({ theme }) => ({
    margin: theme.spacing(3, 0, 2),
}));

interface LoginFormData {
    login: string;
    password: string;
}

const schema = yup.object().shape({
    login: yup.string().required('Login is required'),
    password: yup.string().required('Password is required'),
});

const LoginPage: React.FC = () => {
    const navigateWithParams = useNavigationWithParams();
    const dispatch = useAppDispatch();
    const authData = useAppSelector((state) => state.authentication);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<LoginFormData>({
        resolver: yupResolver(schema),
    });

    useEffect(() => {
        // Temporarily disabled to test routing
        // const queryString = new URLSearchParams(localLocation.search)
        // const logout = queryString.get('logout')
        // queryString.delete('logout');
        // const returnurl = queryString.get('returnurl') 
        // if (authData.accessToken && logout === null) {
        //     if (returnurl)
        //         location.href = returnurl;
        //     else
        //         navigate(ROUTES.HOMEPAGE_ROUTE);
        // }
    }, [authData, navigateWithParams]);

    const onSubmit = async (data: LoginFormData) => {
        try {
            const result = await dispatch(loginAction({
                login: data.login,
                password: data.password
            }));
            
            // Check if login was rejected (error case)
            if (loginAction.rejected.match(result)) {
                // Get error from the rejected value or from authData
                const errorData = result.payload as any;
                const errorMessage = errorData?.error || store.getState().authentication?.error || 'An error occurred during login';
                setError('root', {
                    type: 'manual',
                    message: errorMessage
                });
                return; // Don't redirect on error
            }
            
            // Check if login was fulfilled successfully
            if (loginAction.fulfilled.match(result)) {
                const authData = result.payload;
                // Only redirect if we have an accessToken and no error
                if (authData?.accessToken && !authData?.error) {
                    // Remove unnecessary URL parameters (logout, returnurl) after successful login
                    navigateWithParams(ROUTES.HOMEPAGE_ROUTE, {
                        params: { logout: null, returnurl: null },
                        replace: true
                    });
                } else if (authData?.error) {
                    // Show error from authData
                    setError('root', {
                        type: 'manual',
                        message: authData.error || 'An error occurred during login'
                    });
                } else if (!authData?.accessToken) {
                    // No access token means login failed
                    setError('root', {
                        type: 'manual',
                        message: 'Login failed. Please check your credentials.'
                    });
                }
            }
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { data?: { errorFields?: unknown; error?: string } } };
                if (axiosError.response?.data) {
                    if (axiosError.response.data.errorFields) {
                        setError('root', {
                            type: 'manual',
                            message: 'Please check your credentials'
                        });
                    } else {
                        setError('root', {
                            type: 'manual',
                            message: axiosError.response.data.error || 'An error occurred during login'
                        });
                    }
                }
            } else {
                setError('root', {
                    type: 'manual',
                    message: 'Network error. Please try again later.'
                });
            }
        }
    };

    return (
        <LoginContainer maxWidth="xs">
            <LoginPaper elevation={3}>
                <Typography component="h1" variant="h5">
                    Sign in
                </Typography>

                {errors.root && (
                    <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                        {errors.root.message}
                    </Alert>
                )}

                <LoginForm onSubmit={handleSubmit(onSubmit)} noValidate>
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="login"
                        label="Login"
                        autoComplete="username"
                        autoFocus
                        disabled={isSubmitting}
                        error={!!errors.login}
                        helperText={errors.login?.message}
                        {...register('login')}
                    />

                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        disabled={isSubmitting}
                        error={!!errors.password}
                        helperText={errors.password?.message}
                        {...register('password')}
                    />

                    <SubmitButton
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? <CircularProgress size={24} /> : 'Sign In'}
                    </SubmitButton>

                <Grid container spacing={2}>
                    <Grid item xs>
                        <Button
                            variant="text"
                            color="primary"
                            onClick={() => navigateWithParams(ROUTES.REGISTER_ROUTE)}
                            disabled={isSubmitting}
                        >
                            Register
                        </Button>
                    </Grid>
                    <Grid item xs>
                        <Button
                            variant="text"
                            color="primary"
                            onClick={() => navigateWithParams(ROUTES.HOMEPAGE_ROUTE)}
                            disabled={isSubmitting}
                        >
                            Back to Home
                        </Button>
                    </Grid>
                </Grid>
                </LoginForm>
            </LoginPaper>
        </LoginContainer>
    );
};

export default LoginPage;
