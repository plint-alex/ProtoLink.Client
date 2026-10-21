import CssBaseline from '@mui/material/CssBaseline';
import { styled } from '@mui/material/styles';
import { AppBar, Toolbar, Typography, Button, Box, ButtonBase } from '@mui/material';
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
    getShareSessionMeta,
    shouldShowGuestBanner,
    subscribeShareSession,
    wasShareCredentialUsed,
    hasShareSession,
} from '../../services/shareSession';
import { SearchPalette } from '../SearchPalette/SearchPalette';
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
        'share-guest-banner': isRu
            ? 'Вы смотрите как гость'
            : "You're viewing as a guest",
        'share-guest-banner-signed-in': isRu
            ? 'Вы смотрите по гостевой ссылке. Она не появится в «Доступные мне».'
            : "You're viewing through a guest link. It won't appear in Shared with me.",
        'share-guest-sign-in': isRu ? 'Войти' : 'Sign in',
    };
    const t = (code: string) => layoutTexts[code] || layoutDefaults[code] || code;

    const guestBannerText = isAuthenticated
        ? t('share-guest-banner-signed-in')
        : t('share-guest-banner');

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
                            // AH3: signed-in logo → user home; guest → public product home.
                            const homePath = getDynamicHomePath(
                                isAuthenticated ? authentication?.userId : null
                            );
                            handleNavigation(
                                `${homePath}?lang=${encodeURIComponent(langParam)}`
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
                    <Typography
                        variant="body2"
                        sx={{ flexGrow: 1, color: '#5F6368', fontSize: '13px' }}
                    >
                        {guestBannerText}
                    </Typography>
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
                </Box>
            )}
            <ContentMain>
                {props.children}
            </ContentMain>
            <SearchPalette />
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