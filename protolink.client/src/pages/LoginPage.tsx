import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
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
import { SYSTEM_PAGE_CODES } from '../resources/routes-constants';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { textCatalogService } from '../services/textCatalogService';

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

const LoginPage: React.FC = () => {
    const location = useLocation();
    const navigateWithParams = useNavigationWithParams();
    const dispatch = useAppDispatch();
    const authData = useAppSelector((state) => state.authentication);
    const lang = React.useMemo(() => new URLSearchParams(location.search).get('lang') || 'en-US', [location.search]);
    const [texts, setTexts] = React.useState<Record<string, string>>({});
    const t = React.useCallback((code: string) => texts[code] || code, [texts]);

    const schema = React.useMemo(
        () =>
            yup.object().shape({
                login: yup.string().required(t('login-validation-login-required')),
                password: yup.string().required(t('login-validation-password-required')),
            }),
        [t]
    );

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<LoginFormData>({ resolver: yupResolver(schema) });

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

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const loadedTexts = await textCatalogService.loadPageTexts({
                    lang,
                    systemPageCode: SYSTEM_PAGE_CODES.LOGIN,
                    pathname: location.pathname,
                });
                if (!cancelled) {
                    setTexts((prev) => ({ ...prev, ...loadedTexts }));
                }
            } catch (error) {
                console.error('[LoginPage] failed to load page texts', error);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [lang, location.pathname]);

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
                const errorMessage =
                    errorData?.error || store.getState().authentication?.error || t('login-error-generic');
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
                    const uid = authData.userId?.trim();
                    const dest =
                        uid && uid.length > 0
                            ? `/${uid}?lang=${encodeURIComponent(lang)}`
                            : ROUTES.HOMEPAGE_ROUTE;
                    navigateWithParams(dest, {
                        params: { logout: null, returnurl: null },
                        replace: true,
                    });
                } else if (authData?.error) {
                    // Show error from authData
                    setError('root', {
                        type: 'manual',
                        message: authData.error || t('login-error-generic')
                    });
                } else if (!authData?.accessToken) {
                    // No access token means login failed
                    setError('root', {
                        type: 'manual',
                        message: t('login-error-failed')
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
                            message: t('login-error-check-credentials')
                        });
                    } else {
                        setError('root', {
                            type: 'manual',
                            message: axiosError.response.data.error || t('login-error-generic')
                        });
                    }
                }
            } else {
                setError('root', {
                    type: 'manual',
                    message: t('login-error-network')
                });
            }
        }
    };

    return (
        <LoginContainer maxWidth="xs">
            <LoginPaper elevation={3}>
                <Typography component="h1" variant="h5">
                    {t('login-title')}
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
                        label={t('login-field-login')}
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
                        label={t('login-field-password')}
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
                        {isSubmitting ? <CircularProgress size={24} /> : t('login-submit')}
                    </SubmitButton>

                <Grid container spacing={2}>
                    <Grid item xs>
                        <Button
                            variant="text"
                            color="primary"
                            onClick={() => navigateWithParams(ROUTES.REGISTER_ROUTE)}
                            disabled={isSubmitting}
                        >
                            {t('login-register')}
                        </Button>
                    </Grid>
                    <Grid item xs>
                        <Button
                            variant="text"
                            color="primary"
                            onClick={() => navigateWithParams(ROUTES.HOMEPAGE_ROUTE)}
                            disabled={isSubmitting}
                        >
                            {t('login-back-home')}
                        </Button>
                    </Grid>
                </Grid>
                </LoginForm>
            </LoginPaper>
        </LoginContainer>
    );
};

export default LoginPage;
