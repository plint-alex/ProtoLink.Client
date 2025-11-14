import CssBaseline from '@mui/material/CssBaseline';
import { styled } from '@mui/material/styles';
import { AppBar, Toolbar, Typography, Button, Box, Tooltip } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import React, { PropsWithChildren } from 'react';
import UrlLanguageSelector from '../UrlLanguageSelector';
// import { useLanguageNavigation } from '../../hooks/useLanguageNavigation'; // Disabled - causing URL conflicts
import { useAppDispatch, useAppSelector } from '../../store/store';
import { logout } from '../../store/actions/thunkActions/authentication';


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
    height: 32,
    width: 32,
    marginRight: theme.spacing(2),
}));


type FooProps = {
    name: string
}

export const Layout: React.FC<PropsWithChildren<FooProps>> = (props) => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();
    const authentication = useAppSelector((state) => state.authentication);
    const isAuthenticated = Boolean(authentication?.accessToken);
    
    // Ensure lang parameter is present on all pages
    // useLanguageNavigation(); // Disabled - causing URL conflicts

    const handleNavigation = (path: string) => {
        // Navigate directly without adding language parameters
        navigate(path);
    };

    const handleLogout = () => {
        void dispatch(logout());
        handleNavigation('/login');
    };

    return (
        <RootDiv>
            <CssBaseline />
            <AppBar position="static" elevation={1} sx={{ minHeight: 48 }}>
                <Toolbar sx={{ minHeight: 48, py: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                        <Logo 
                            src="/logo.png" 
                            alt="ProtoLink Logo"
                            onError={(e) => {
                                // Fallback to text if logo not found
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                        <Typography variant="h6" component="div" sx={{ ml: 1 }}>
                            ProtoLink
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button 
                                color="inherit" 
                                onClick={() => handleNavigation('/')}
                                variant={location.pathname === '/' ? 'outlined' : 'text'}
                                size="small"
                            >
                                Home
                            </Button>
                            <Button 
                                color="inherit" 
                                onClick={() => handleNavigation('/explorer')}
                                variant={location.pathname.startsWith('/explorer') ? 'outlined' : 'text'}
                                size="small"
                            >
                                Explorer
                            </Button>
                        </Box>
                        <Box sx={{ flexGrow: 1 }} />
                        {!isAuthenticated && (
                            <Button 
                                color="inherit" 
                                onClick={() => handleNavigation('/login')}
                                variant={location.pathname === '/login' ? 'outlined' : 'text'}
                                size="small"
                            >
                                Login
                            </Button>
                        )}
                        {isAuthenticated && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {authentication?.userName && (
                                    <Tooltip title={authentication.userName}>
                                        <Typography variant="body2" sx={{ maxWidth: 120, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {authentication.userName}
                                        </Typography>
                                    </Tooltip>
                                )}
                                <Button 
                                    color="inherit" 
                                    onClick={handleLogout}
                                    variant="outlined"
                                    size="small"
                                >
                                    Logout
                                </Button>
                            </Box>
                        )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <UrlLanguageSelector />
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