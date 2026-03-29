import CssBaseline from '@mui/material/CssBaseline';
import { styled } from '@mui/material/styles';
import { AppBar, Toolbar, Typography, Button, Box, ButtonBase } from '@mui/material';
import { useLocation } from 'react-router-dom';
import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import UrlLanguageSelector from '../UrlLanguageSelector';
import { UserMenu } from './UserMenu';
import { useAppDispatch, useAppSelector } from '../../store/store';
import { logout } from '../../store/actions/thunkActions/authentication';
import { useNavigationWithParams } from '../../hooks/useNavigationWithParams';
import { textCatalogService } from '../../services/textCatalogService';


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

const LAYOUT_TEXT_CODES = [
    'layout-brand',
    'layout-home',
    'layout-explorer',
    'layout-login',
    'layout-logout',
    'layout-user-default',
] as const;
const LAYOUT_TEXTS_CACHE_KEY = 'protolink.layoutTexts.last';

const mergeWithPreviousTexts = (
    previous: Record<string, string>,
    incoming: Record<string, string>
): Record<string, string> => {
    const merged: Record<string, string> = { ...previous };
    for (const code of LAYOUT_TEXT_CODES) {
        const nextValue = incoming[code];
        if (nextValue && nextValue !== code) {
            merged[code] = nextValue;
        }
    }
    return merged;
};

const readCachedLayoutTexts = (): Record<string, string> => {
    if (typeof window === 'undefined') {
        return {};
    }

    try {
        const raw = window.sessionStorage.getItem(LAYOUT_TEXTS_CACHE_KEY);
        if (!raw) {
            return {};
        }

        const parsed = JSON.parse(raw) as Record<string, string>;
        return typeof parsed === 'object' && parsed ? parsed : {};
    } catch {
        return {};
    }
};


type FooProps = {
    name: string
}

export const Layout: React.FC<PropsWithChildren<FooProps>> = (props) => {
    const navigateWithParams = useNavigationWithParams();
    const location = useLocation();
    const dispatch = useAppDispatch();
    const authentication = useAppSelector((state) => state.authentication);
    const isAuthenticated = Boolean(authentication?.accessToken);
    const userHomePath = authentication?.userId ? `/${authentication.userId}` : null;
    const [layoutTexts, setLayoutTexts] = useState<Record<string, string>>(readCachedLayoutTexts);
    const lang = useMemo(() => new URLSearchParams(location.search).get('lang') || 'en-US', [location.search]);

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
                const texts = await textCatalogService.loadLayoutTexts(lang);
                if (!cancelled) {
                    setLayoutTexts((prev) => mergeWithPreviousTexts(prev, texts));
                }
            } catch (error) {
                console.error('[Layout] failed to load layout texts', error);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [lang]);

    useEffect(() => {
        if (typeof window === 'undefined' || !Object.keys(layoutTexts).length) {
            return;
        }

        try {
            window.sessionStorage.setItem(LAYOUT_TEXTS_CACHE_KEY, JSON.stringify(layoutTexts));
        } catch {
            // Ignore storage failures; UI should continue with in-memory texts.
        }
    }, [layoutTexts]);

    const t = (code: string) => layoutTexts[code] || '';

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
                        onClick={() => handleNavigation('/')}
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
                            alt="ProtoLink Logo"
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
                        <UrlLanguageSelector />
                        {isAuthenticated ? (
                            <UserMenu
                                userName={authentication?.userName}
                                login={authentication?.login}
                                onLogout={handleLogout}
                                text={{
                                    login: t('layout-login'),
                                    logout: t('layout-logout'),
                                    userDefault: t('layout-user-default'),
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
            <ContentMain>
                {props.children}
            </ContentMain>
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