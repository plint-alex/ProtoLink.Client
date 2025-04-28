import React from 'react'
import { Link } from 'react-router'
import { AppBar, Toolbar, InputBase, Button, CssBaseline } from '@mui/material'
import { alpha, styled } from '@mui/material/styles'
import { Search } from '@mui/icons-material'
import logoSrc from './images/logo-removebg.png'

import { useAppSelector } from '../store/reducers/store';
//import { login } from '../store/actions/authentication'

const HeaderHeightStyled = styled('div')(({ theme }) => ({
    height: theme.mixins.toolbar.minHeight,
}));
const AppBarStyled = styled(AppBar)(({ theme }) => ({
    [theme.breakpoints.up('sm')]: {
        zIndex: theme.zIndex.drawer + 1,
    },
}));
const LogoStyled = styled('img')(({ theme }) => ({
    marginTop: theme.spacing(1),
    height: Number(theme.mixins.toolbar.minHeight),
    marginRight: theme.spacing(10),
}));
const SearchStyled = styled('div')(({ theme }) => ({
    flexGrow: 1,
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(1),
        width: 'auto',
    },
}));
const SearchIconStyled = styled('div')(({ theme }) => ({
    width: theme.spacing(7),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));
const InputBaseStyled = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    padding: theme.spacing(1, 1, 1, 7),
    transition: theme.transitions.create('width'),
    width: '100%',
    [theme.breakpoints.up('sm')]: {
        width: 155,
        '&:focus': {
            width: 200,
        },
    },
}));
const LoginStyled = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(1),
        width: 'auto',
    },
}));
const RightTabSpanStyled = styled('span')(({ theme }) => ({
    margin: theme.spacing(1, 1, 1, 7),
}));
const RightTabLinkStyled = styled(Link)(({ theme }) => ({
    margin: theme.spacing(1, 1, 1, 7),
}));
const RightTabAStyled = styled('a')(({ theme }) => ({
    margin: theme.spacing(1, 1, 1, 7),
}));
const RightTabButtonStyled = styled(Button)(({ theme }) => ({
    margin: theme.spacing(1, 1, 1, 7),
}));
//const InputRootStyled = styled('div')<LogoProps>(() => ({
//    color: 'inherit',
//}));
//const InputInputStyled = styled('div')<LogoProps>(({ theme }) => ({
//    padding: theme.spacing(1, 1, 1, 7),
//        transition: theme.transitions.create('width'),
//            width: '100%',
//                [theme.breakpoints.up('sm')]: {
//        width: 155,
//            '&:focus': {
//            width: 200,
//            },
//    },
//}));

const HomePage: React.FC = () => {
    const authentication = useAppSelector((state) => state.authentication)

    const search = location.search;
    const queryString = new URLSearchParams(search);
    const adminParams = queryString;

    const lang = queryString.get('lang');
    const loginParams = new URLSearchParams(`?lang=${lang}&returnUrl=${location.pathname + location.search}`);

    adminParams.delete('lang');

    return (
        <>
            <AppBarStyled position="fixed" color="inherit">
                <Toolbar>
                    <LogoStyled
                        src={logoSrc}
                    />
                    Link what you want
                    <SearchStyled>
                        <SearchIconStyled>
                            <Search />
                        </SearchIconStyled>
                        <InputBaseStyled
                            placeholder="Поиск …"
                            inputProps={{ 'aria-label': 'Search' }}
                        />
                    </SearchStyled>
                    <LoginStyled>
                        <RightTabAStyled href={`http://protolink.ru/scalar`} target="_blank">API</RightTabAStyled>
                        {authentication.accessToken && <RightTabSpanStyled>{authentication.userName}</RightTabSpanStyled>}
                        <RightTabLinkStyled to={`/Explorer/'}${location.search ? `?${adminParams}` : ''}`} >Explorer</RightTabLinkStyled>
                        {!authentication.accessToken && <RightTabLinkStyled to={`/login/?${loginParams.toString()}`}>Login</RightTabLinkStyled>}
                        {authentication.accessToken && <RightTabButtonStyled onClick={() => { }}>Logout</RightTabButtonStyled>}
                    </LoginStyled>
                </Toolbar>
            </AppBarStyled>
            <HeaderHeightStyled />
            <CssBaseline />
        </>
    )
}

export default HomePage
