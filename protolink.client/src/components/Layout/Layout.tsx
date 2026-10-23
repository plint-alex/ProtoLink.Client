import CssBaseline from '@mui/material/CssBaseline';
import { styled } from '@mui/material/styles';
import {
    AppBar,
    Toolbar,
    Typography,
    Button,
    Box,
    ButtonBase,
    CircularProgress,
    Snackbar,
    Alert,
    Stack,
} from '@mui/material';
import LockOutlined from '@mui/icons-material/LockOutlined';
import { useLocation } from 'react-router-dom';
import React, { PropsWithChildren, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import UrlLanguageSelector from '../UrlLanguageSelector';
import { UserMenu } from './UserMenu';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { logout } from '../../store/actions/thunkActions/authentication';
import { useNavigationWithParams } from '../../hooks/useNavigationWithParams';
import { useCommandsHub } from '../../hooks/useCommandsHub';
import { textCatalogService } from '../../services/textCatalogService';
import { resolveUserAvatarUrl } from '../../services/userAvatarService';
import { DEFAULT_HOME_LANG, getDynamicHomePath } from '../../constants/home';
import {
    clearAuthAndRedirectToLogin,
    isUserAccessExpired,
} from '../../utility/clearAuthSession';
import {
    addToSharedWithMe,
    clearShareSession,
    getShareSessionMeta,
    shouldShowGuestBanner,
    subscribeShareSession,
    wasShareCredentialUsed,
    hasShareSession,
    markShareSessionEnded,
} from '../../services/shareSession';
import { bumpSubtreeRefresh } from '../../services/subtreeRefreshBus';
import { SearchPalette } from '../SearchPalette/SearchPalette';
import EntityState from '../EntityState';
import { ROUTES } from '../../resources/routes-constants';
import {
    fetchAppVersions,
    formatVersionCaption,
    formatVersionTooltip,
    resolveAppVersions,
    type ResolvedAppVersions,
} from '../../services/versionService';

const BUILD_TIME_CLIENT_VERSION = String(import.meta.env.VITE_APP_VERSION ?? '0.0.0');

const RootDiv = styled('div')(() => ({
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
}));

const ContentMain = styled('main')(({ theme }) => ({
    padding: theme.spacing(3),
    width: '100%',
    flexGrow: 1,
}));

const Logo = styled('img')(({ theme }) => ({
    height: 20,
    width: 20,
    marginRight: theme.spacing(1),
}));



type FooProps = {
    name: string
}

export const Layout: React.FC<PropsWithChildren<FooProps>> = (props) => {
    const navigateWithParams = useNavigationWithParams();
    const location = useLocation();
    const dispatch = useAppDispatch();
    const authentication = useAppSelector((state) => state.authentication);
    const isAuthenticated = Boolean(authentication?.accessToken);
    useCommandsHub();
    const userHomePath = authentication?.userId ? `/${authentication.userId}` : null;
    const [layoutTexts, setLayoutTexts] = useState<Record<string, string>>({});
    const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
    const [appVersions, setAppVersions] = useState<ResolvedAppVersions>(() =>
        resolveAppVersions(null, BUILD_TIME_CLIENT_VERSION)
    );
    const [addBusy, setAddBusy] = useState(false);
    const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });
    const [linkUnavailable, setLinkUnavailable] = useState(false);
    const lang = useMemo(() => new URLSearchParams(location.search).get('lang') || 'en-US', [location.search]);
    // Re-render when share sessionStorage changes (redeem / re-redeem / credential used).
    const shareTick = useSyncExternalStore(
        subscribeShareSession,
        () =>
            `${hasShareSession()}:${wasShareCredentialUsed()}:${getShareSessionMeta()?.entityId ?? ''}`,
        () => ''
    );
    const showGuestBanner = shouldShowGuestBanner(isAuthenticated);
    void shareTick;

    useEffect(() => {
        let cancelled = false;
        const userId = authentication?.userId;
        if (!isAuthenticated || !userId) {
            setAvatarSrc(null);
            return;
        }
        ;(async () => {
            const url = await resolveUserAvatarUrl(String(userId), 128);
            if (!cancelled) setAvatarSrc(url);
        })();
        return () => {
            cancelled = true;
        };
    }, [isAuthenticated, authentication?.userId, location.pathname]);

    // Proactive: expired persisted JWT must not keep signed-in chrome with no API call.
    useEffect(() => {
        if (!isAuthenticated) return;
        if (!isUserAccessExpired(authentication?.expirationTime)) return;
        void clearAuthAndRedirectToLogin();
    }, [isAuthenticated, authentication?.expirationTime]);

    const handleNavigation = (path: string) => {
        navigateWithParams(path);
    };

    const openExplorerInNewTab = () => {
        const currentPath = location.pathname === '/' ? '' : location.pathname;
        const explorerPath = `/explorer${currentPath}${location.search ?? ''}`;
        const targetUrl = `${window.location.origin}${explorerPath}`;
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
    };

    const handleLogout = () => {
        void dispatch(logout());
        // Clean URL parameters when redirecting to login after logout
        navigateWithParams('/login', {
            params: { logout: null, returnurl: null },
            replace: true
        });
    };

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const texts = await textCatalogService.loadTopMenuTexts(lang, location.pathname);
                if (!cancelled) {
                    setLayoutTexts(texts);
                }
            } catch (error) {
                console.error('[Layout] failed to load layout texts', error);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [lang, location.pathname]);

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const payload = await fetchAppVersions();
                if (!cancelled) {
                    setAppVersions(resolveAppVersions(payload, BUILD_TIME_CLIENT_VERSION));
                }
            } catch {
                // Keep build-time client caption; do not break layout.
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const versionCaption = formatVersionCaption(appVersions);
    const versionTooltip = formatVersionTooltip(appVersions);

    const isRu = lang.toLowerCase().startsWith('ru');
    const layoutDefaults: Record<string, string> = {
        'layout-brand': 'ProtoLink',
        'layout-home': 'Home',
        'layout-explorer': 'Explorer',
        'layout-login': 'Log in',
        'layout-logout': 'Log out',
        'layout-user-default': 'User',
        'layout-logo-alt': 'ProtoLink Logo',
        'layout-version-title': 'Client and API versions',
        'layout-copy-my-id': isRu ? 'Скопировать мой ID' : 'Copy my ID',
        'layout-copy-my-id-hint': isRu
            ? 'Отправьте это тем, кто хочет дать вам доступ'
            : 'Share this with people who want to give you access',
        'layout-copied': isRu ? 'Скопировано' : 'Copied',
        'usermenu-change-password': isRu ? 'Сменить пароль' : 'Change password',
        'share-guest-banner': isRu
            ? 'Вы смотрите как гость'
            : "You're viewing as a guest",
        // UX-AS §5b: signed-in guest visitor (creator name omitted — Redeem does not return it).
        'share-guest-banner-signed-in': isRu
            ? 'Просмотр по гостевой ссылке'
            : 'Viewing via guest link',
        'share-guest-banner-helper': isRu
            ? 'Сессия вкладки не сохранит доступ — добавьте в «Доступные мне».'
            : "This tab session won't keep it — add it to Shared with me.",
        'share-guest-sign-in': isRu ? 'Войти' : 'Sign in',
        'share-add-to-shared': isRu
            ? 'Добавить в «Доступные мне»'
            : 'Add to Shared with me',
        'share-add-to-shared-toast': isRu
            ? 'Добавлено в «Доступные мне»'
            : 'Added to Shared with me',
        'share-add-to-shared-error': isRu
            ? 'Не удалось добавить. Повторите.'
            : "Couldn't add this. Try again.",
        'share-link-unavailable': isRu
            ? 'Ссылка больше не работает'
            : 'This link no longer works',
        'share-link-unavailable-body': isRu
            ? 'Возможно, срок истёк или её отключили. Попросите новую у того, кто её прислал.'
            : 'It may have expired or been turned off. Ask the person who sent it for a new one.',
        'share-go-protolink': isRu ? 'На ProtoLink' : 'Go to ProtoLink',
        'share-details': isRu ? 'Подробности' : 'Details',
    };
    const t = (code: string) => layoutTexts[code] || layoutDefaults[code] || code;

    const guestBannerText = isAuthenticated
        ? t('share-guest-banner-signed-in')
        : t('share-guest-banner');

    const handleAddToSharedWithMe = () => {
        if (addBusy || !isAuthenticated) return;
        const userToken = authentication?.accessToken;
        if (!userToken) return;
        setAddBusy(true);
        void (async () => {
            try {
                const outcome = await addToSharedWithMe(userToken);
                if (outcome.ok) {
                    clearShareSession();
                    bumpSubtreeRefresh();
                    setToast({
                        open: true,
                        message: t('share-add-to-shared-toast'),
                        severity: 'success',
                    });
                    return;
                }
                if (outcome.unavailable) {
                    clearShareSession();
                    markShareSessionEnded();
                    setLinkUnavailable(true);
                    return;
                }
                setToast({
                    open: true,
                    message: t('share-add-to-shared-error'),
                    severity: 'error',
                });
            } finally {
                setAddBusy(false);
            }
        })();
    };

    if (linkUnavailable) {
        const returnUrl = `${location.pathname}${location.search}`;
        return (
            <RootDiv>
                <CssBaseline />
                <Stack spacing={2} sx={{ p: 3, flexGrow: 1 }}>
                    <EntityState
                        icon={<LockOutlined />}
                        title={t('share-link-unavailable')}
                        subtitle={t('share-link-unavailable-body')}
                        action={{
                            label: t('share-guest-sign-in'),
                            to: `${ROUTES.LOGIN_ROUTE}?returnurl=${encodeURIComponent(returnUrl)}`,
                        }}
                        secondaryAction={{
                            label: t('share-go-protolink'),
                            to: ROUTES.HOMEPAGE_ROUTE,
                        }}
                        detailsLabel={t('share-details')}
                    />
                </Stack>
            </RootDiv>
        );
    }

    return (
        <RootDiv>
            <CssBaseline />
            <AppBar 
                position="static" 
                elevation={0} 
                sx={{ 
                    backgroundColor: '#FFFFFF',
                    borderBottom: '1px solid #E0E0E0',
                    boxShadow: '0 1px 2px 0 rgba(60, 64, 67, 0.3), 0 1px 3px 1px rgba(60, 64, 67, 0.15)',
                    minHeight: 56,
                    height: 56,
                }}
            >
                <Toolbar 
                    sx={{ 
                        minHeight: '56px !important',
                        height: 56,
                        py: 0,
                        px: 1,
                        backgroundColor: '#FFFFFF',
                    }}
                >
                    <ButtonBase
                        onClick={() => {
                            const langParam =
                                new URLSearchParams(location.search).get('lang') ?? DEFAULT_HOME_LANG;
                            // AH3: logo always → product home (guest and signed-in).
                            handleNavigation(
                                `${getDynamicHomePath()}?lang=${encodeURIComponent(langParam)}`
                            );
                        }}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            mr: 1.5,
                            borderRadius: '4px',
                            px: 0.5,
                            py: 0.25,
                        }}
                    >
                        <Logo
                            src="/icon.png"
                            alt={t('layout-logo-alt')}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                        <Typography
                            variant="h6"
                            component="div"
                            sx={{
                                ml: 1,
                                color: '#202124',
                                fontSize: '14px',
                                fontWeight: 400,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                            }}
                        >
                            {t('layout-brand')}
                        </Typography>
                    </ButtonBase>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                        {isAuthenticated && (
                            <>
                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                    <Button
                                        onClick={() => {
                                            if (userHomePath) {
                                                handleNavigation(userHomePath);
                                            }
                                        }}
                                        size="small"
                                        sx={{
                                            color: '#202124',
                                            textTransform: 'uppercase',
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            letterSpacing: '0.5px',
                                            minWidth: 'auto',
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: '4px',
                                            '&:hover': {
                                                backgroundColor: 'rgba(60, 64, 67, 0.08)',
                                            },
                                            ...(userHomePath && location.pathname === userHomePath && {
                                                backgroundColor: 'rgba(60, 64, 67, 0.12)',
                                            }),
                                        }}
                                    >
                                        {t('layout-home')}
                                    </Button>
                                    <Button
                                        onClick={openExplorerInNewTab}
                                        size="small"
                                        sx={{
                                            color: '#202124',
                                            textTransform: 'uppercase',
                                            fontSize: '12px',
                                            fontWeight: 500,
                                            letterSpacing: '0.5px',
                                            minWidth: 'auto',
                                            px: 1.5,
                                            py: 0.5,
                                            borderRadius: '4px',
                                            '&:hover': {
                                                backgroundColor: 'rgba(60, 64, 67, 0.08)',
                                            },
                                            ...(location.pathname.startsWith('/explorer') && {
                                                backgroundColor: 'rgba(60, 64, 67, 0.12)',
                                            }),
                                        }}
                                    >
                                        {t('layout-explorer')}
                                    </Button>
                                </Box>
                                <Box sx={{ flexGrow: 1 }} />
                            </>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 1 }}>
                        <Typography
                            variant="caption"
                            component="span"
                            sx={{ color: '#5f6368', fontSize: '11px', userSelect: 'none', mr: 0.5 }}
                            title={versionTooltip || t('layout-version-title')}
                        >
                            {versionCaption}
                        </Typography>
                        <UrlLanguageSelector />
                        {isAuthenticated ? (
                            <UserMenu
                                userName={authentication?.userName}
                                login={authentication?.login}
                                userId={authentication?.userId}
                                avatarSrc={avatarSrc}
                                onLogout={handleLogout}
                                text={{
                                    login: t('layout-login'),
                                    logout: t('layout-logout'),
                                    userDefault: t('layout-user-default'),
                                    copyMyId: t('layout-copy-my-id'),
                                    copyMyIdHint: t('layout-copy-my-id-hint'),
                                    copied: t('layout-copied'),
                                    changePassword: t('usermenu-change-password'),
                                }}
                            />
                        ) : (
                            <Button
                                onClick={() => handleNavigation('/login')}
                                size="small"
                                sx={{
                                    color: '#202124',
                                    textTransform: 'uppercase',
                                    fontSize: '12px',
                                    fontWeight: 500,
                                    letterSpacing: '0.5px',
                                    minWidth: 'auto',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: '4px',
                                    '&:hover': {
                                        backgroundColor: 'rgba(60, 64, 67, 0.08)',
                                    },
                                }}
                            >
                                {t('layout-login')}
                            </Button>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>
            {showGuestBanner && (
                <Box
                    role="status"
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                        px: 2,
                        py: 0.75,
                        backgroundColor: '#F8F9FA',
                        borderBottom: '1px solid #E0E0E0',
                        minHeight: 36,
                    }}
                >
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                        <Typography
                            variant="body2"
                            sx={{ color: '#5F6368', fontSize: '13px' }}
                        >
                            {guestBannerText}
                        </Typography>
                        {isAuthenticated && (
                            <Typography
                                variant="caption"
                                sx={{ color: '#80868B', fontSize: '12px', display: 'block' }}
                            >
                                {t('share-guest-banner-helper')}
                            </Typography>
                        )}
                    </Box>
                    {!isAuthenticated && (
                        <Button
                            size="small"
                            onClick={() =>
                                handleNavigation(
                                    `/login?returnurl=${encodeURIComponent(
                                        `${location.pathname}${location.search}`
                                    )}`
                                )
                            }
                            sx={{
                                textTransform: 'none',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#1A73E8',
                                minWidth: 'auto',
                                px: 1,
                            }}
                        >
                            {t('share-guest-sign-in')}
                        </Button>
                    )}
                    {isAuthenticated && (
                        <Button
                            size="small"
                            disabled={addBusy}
                            onClick={handleAddToSharedWithMe}
                            startIcon={
                                addBusy ? (
                                    <CircularProgress size={14} color="inherit" />
                                ) : undefined
                            }
                            sx={{
                                textTransform: 'none',
                                fontSize: '13px',
                                fontWeight: 500,
                                color: '#1A73E8',
                                minWidth: 'auto',
                                px: 1,
                                flexShrink: 0,
                            }}
                        >
                            {t('share-add-to-shared')}
                        </Button>
                    )}
                </Box>
            )}
            <ContentMain>
                {props.children}
            </ContentMain>
            <SearchPalette />
            <Snackbar
                open={toast.open}
                autoHideDuration={4000}
                onClose={() => setToast((prev) => ({ ...prev, open: false }))}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setToast((prev) => ({ ...prev, open: false }))}
                    severity={toast.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </RootDiv>
    )
}



//const styles = theme => ({
//    root: {
//        display: 'flex',
//        minHeight: '100vh',

//    },
//    logo: {
//        marginTop: theme.spacing(1),
//        height: theme.mixins.toolbar.minHeight - theme.spacing(2),
//        marginRight: theme.spacing(10),
//    },
//    content: {
//        //flexGrow: 1,
//        padding: theme.spacing(3),
//        width: '100%',
//    },
//});

//class Layout extends Component {
//    constructor(props) {
//        super(props);
//        this.state = {
//            canRedirect: false,
//        };
//    }

//    componentDidCatch(error, info) {

//        this.props.enqueueSnackbar({
//            message: error.message,
//            options: {
//                key: new Date().getTime() + Math.random(),
//                variant: 'error'
//            },
//        });
//    }

//    render() {
//        const { children, classes } = this.props;
//        return (
//                <div className={classes.root}>
//                    //<WaitDialog />
//                    //<Notifier />
//                    <CssBaseline />

//                    <main className={classes.content}>

//                        {children}
//                    </main>
//                </div>
//        );
//    }
//}

//let mapState = (state) => {

//    return {
//    };
//};

//let mapDispatch = (dispatch) => {
//    return {
//        enqueueSnackbar: bindActionCreators(notifierActionCreators.enqueueSnackbar, dispatch),
//    };
//};
//const ConnectedLayout = connect(mapState, mapDispatch)(Layout);

//const StyledLayout = (props) => {
//    return <ConnectedLayout {...props} />;
//}


//export default withStyles(styles)(StyledLayout);