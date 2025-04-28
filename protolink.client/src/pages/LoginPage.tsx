import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAppDispatch, useAppSelector } from '../store/reducers/store';
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

const LoginPage: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const [login, setLogin] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [passwordError, setPasswordError] = useState('');

    // Check if user is already authenticated
    const authData = useAppSelector((state) => state.authentication);

    useEffect(() => {
        // If user is already authenticated, redirect to homepage
        if (authData.accessToken) {
            navigate(ROUTES.HOMEPAGE_ROUTE);
        }
    }, [authData, navigate]);

    const validateForm = () => {
        let isValid = true;

        if (!login.trim()) {
            setLoginError('Login is required');
            isValid = false;
        } else {
            setLoginError('');
        }

        if (!password) {
            setPasswordError('Password is required');
            isValid = false;
        } else {
            setPasswordError('');
        }

        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            await dispatch(loginAction({
                login,
                password
            }));
            navigate(ROUTES.HOMEPAGE_ROUTE);
        } catch (err: unknown) {
            if (err && typeof err === 'object' && 'response' in err) {
                const axiosError = err as { response?: { data?: { errorFields?: unknown; error?: string } } };
                if (axiosError.response?.data) {
                    if (axiosError.response.data.errorFields) {
                        setError('Please check your credentials');
                    } else {
                        setError(axiosError.response.data.error || 'An error occurred during login');
                    }
                }
            } else {
                setError('Network error. Please try again later.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <LoginContainer maxWidth="xs">
            <LoginPaper elevation={3}>
                <Typography component="h1" variant="h5">
                    Sign in
                </Typography>

                {error && (
                    <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                        {error}
                    </Alert>
                )}

                <LoginForm onSubmit={handleSubmit} noValidate>
                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        id="login"
                        label="Login"
                        name="login"
                        autoComplete="username"
                        autoFocus
                        value={login}
                        onChange={(e) => setLogin(e.target.value)}
                        error={!!loginError}
                        helperText={loginError}
                        disabled={loading}
                    />

                    <TextField
                        variant="outlined"
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        error={!!passwordError}
                        helperText={passwordError}
                        disabled={loading}
                    />

                    <SubmitButton
                        type="submit"
                        fullWidth
                        variant="contained"
                        color="primary"
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Sign In'}
                    </SubmitButton>

                    <Grid container spacing={2}>
                        
                            <Button
                                variant="text"
                                color="primary"
                                onClick={() => navigate(ROUTES.HOMEPAGE_ROUTE)}
                                disabled={loading}
                            >
                                Back to Home
                            </Button>
                    </Grid>
                </LoginForm>
            </LoginPaper>
        </LoginContainer>
    );
};

export default LoginPage;
