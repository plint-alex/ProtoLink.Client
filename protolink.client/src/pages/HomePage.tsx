import React, { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { AppBar, Toolbar, InputBase, Button, CssBaseline } from '@mui/material'
import { alpha, styled } from '@mui/material/styles'
import { Search } from '@mui/icons-material'
import logoSrc from './images/logo-removebg.png'

import { useAppSelector, useAppDispatch, RootState } from '../store/store'
import { loadViewScript } from '../store/actions/thunkActions/entities'
import { logout as logoutAction } from '../store/actions/thunkActions/authentication'
import { useSelector } from 'react-redux'
import { Dictionary } from '../types/dictionary'
import { DynamicReactElement } from '../types/dynamicReactElement'
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
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const params = useParams()




    const entities = useSelector((state: RootState) => state.entities)
    const entityViews = entities?.entityViews
    const entityId = params.id

    const windowLocal = window as Dictionary<keyof JSX.IntrinsicElements & DynamicReactElement> & Window & typeof globalThis

    const TagName = entityId && entityViews && entityViews[entityId] && entityViews[entityId][0]?.viewId && windowLocal[entityViews[entityId][0].viewId]

    const realEntityId = entityId && ((entityViews && entityViews[entityId] && entityViews[entityId][0].entityId) || entityId)

    const search = location.search
    const queryString = useMemo(() => { return new URLSearchParams(search) }, [search])
    const adminParams = queryString

    let lang = queryString.get('lang');
    const loginParams = new URLSearchParams(`?lang=${lang}&returnUrl=${location.pathname + location.search}`)


    //adminParams.delete('lang');

    let pathname = location.pathname;

    let redirectLocal = false;

    if (!params.id && authentication.accessToken) {
        pathname = `${authentication.userId}`
        redirectLocal = true;
    }

    if (!lang) {

        queryString.set('lang', navigator.language)
        lang = navigator.language
        redirectLocal = true
    }

    useEffect(() => {
        if (redirectLocal) {
            navigate(pathname + '?' + queryString.toString())
        }

    }, [redirectLocal, navigate, pathname, queryString])

    useEffect(() => {
        if (params.id) {
            dispatch(loadViewScript(params.id));
        }
    }, [params.id, dispatch]);

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
                        {authentication.accessToken && <RightTabSpanStyled>{authentication.userName}</RightTabSpanStyled>}
                        <RightTabAStyled href={`http://protolink.ru/scalar`} target="_blank">API</RightTabAStyled>
                        <RightTabLinkStyled to={`/explorer/${realEntityId ? realEntityId : ''}${location.search ? `?${adminParams}` : ''}`} >Explorer</RightTabLinkStyled>
                        {!authentication.accessToken && <RightTabLinkStyled to={`/login/?${loginParams.toString()}`}>Login</RightTabLinkStyled>}
                        {authentication.accessToken && <RightTabButtonStyled onClick={async () => {await dispatch(logoutAction())}}>Logout</RightTabButtonStyled>}
                    </LoginStyled>
                </Toolbar>
            </AppBarStyled>
            <HeaderHeightStyled />
            <CssBaseline />
            {TagName && realEntityId && <TagName level={0} entityId={realEntityId} entityViews={entityViews[realEntityId]} />}
        </>
    )
}

export default HomePage
