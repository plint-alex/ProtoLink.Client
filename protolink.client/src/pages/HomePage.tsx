import React, { useEffect, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AppBar, Toolbar, InputBase, Button, CssBaseline, Container, Typography, Box } from '@mui/material'
import { alpha, styled } from '@mui/material/styles'
import { Search } from '@mui/icons-material'
import logoSrc from './images/logo-removebg.png'

import { useAppSelector, useAppDispatch, RootState } from '../store/store'
import { loadViewScript } from '../store/actions/thunkActions/entities'
import { logout as logoutAction } from '../store/actions/thunkActions/authentication'
import { useSelector } from 'react-redux'
import { Dictionary } from '../types/dictionary'
import { DynamicReactElement } from '../types/dynamicReactElement'
import { useLanguage } from '../contexts/LanguageContext'
import LanguageChanger from '../components/LanguageChanger'

const HeaderHeightStyled = styled('div')(({ theme }) => ({
    height: theme.mixins.toolbar.minHeight,
}))

const AppBarStyled = styled(AppBar)(({ theme }) => ({
    [theme.breakpoints.up('sm')]: {
        zIndex: theme.zIndex.drawer + 1,
    },
}))

const LogoStyled = styled('img')(({ theme }) => ({
    marginTop: theme.spacing(1),
    height: Number(theme.mixins.toolbar.minHeight),
    marginRight: theme.spacing(10),
}))

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
}))

const SearchIconStyled = styled('div')(({ theme }) => ({
    width: theme.spacing(7),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}))

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
}))

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
}))

const RightTabSpanStyled = styled('span')(({ theme }) => ({
    margin: theme.spacing(1, 1, 1, 7),
}))

const RightTabLinkStyled = styled(Link)(({ theme }) => ({
    margin: theme.spacing(1, 1, 1, 7),
}))

const RightTabAStyled = styled('a')(({ theme }) => ({
    margin: theme.spacing(1, 1, 1, 7),
}))

const RightTabButtonStyled = styled(Button)(({ theme }) => ({
    margin: theme.spacing(1, 1, 1, 7),
}))

const HomePage: React.FC = () => {
    const authentication = useAppSelector((state) => state.authentication)
    const dispatch = useAppDispatch()
    const navigate = useNavigate()
    const params = useParams()
    const { getTextSync } = useLanguage()

    const entities = useSelector((state: RootState) => state.entities)
    const entityViews = entities?.entityViews
    const entityId = params.id

    const windowLocal = window as Dictionary<keyof JSX.IntrinsicElements & DynamicReactElement> & Window & typeof globalThis

    const TagName = entityId && entityViews && entityViews[entityId] && entityViews[entityId][0]?.viewId && windowLocal[entityViews[entityId][0].viewId]
    const realEntityId = entityId && ((entityViews && entityViews[entityId] && entityViews[entityId][0].entityId) || entityId)

    const search = location.search
    const queryString = useMemo(() => new URLSearchParams(search), [search])
    const loginParams = new URLSearchParams(`?lang=${queryString.get('lang') || navigator.language}&returnUrl=${location.pathname + location.search}`)

    // Auto-redirect logic
    useEffect(() => {
        if (!params.id && authentication.accessToken && location.pathname !== '/') {
            navigate(`${authentication.userId}?${queryString.toString()}`)
        }
    }, [params.id, authentication.accessToken, location.pathname, navigate, queryString])

    // Load view script
    useEffect(() => {
        if (params.id) {
            dispatch(loadViewScript(params.id))
        } else {
            // Load dynamic home page entity when no specific entity ID is provided
            const homePageEntityId = "f1752f99-e09f-43ad-9616-c1ab709df02e"
            dispatch(loadViewScript(homePageEntityId))
        }
    }, [params.id, dispatch])

    return (
        <>
            <AppBarStyled position="fixed" color="inherit">
                <Toolbar>
                    <LogoStyled src={logoSrc} />
                    <SearchStyled>
                        <SearchIconStyled>
                            <Search />
                        </SearchIconStyled>
                        <InputBaseStyled
                            placeholder="Search..."
                            inputProps={{ 'aria-label': 'Search' }}
                        />
                    </SearchStyled>
                    <LoginStyled>
                        {authentication.accessToken && <RightTabSpanStyled>{authentication.userName}</RightTabSpanStyled>}
                        <LanguageChanger />
                        <RightTabAStyled href="http://protolink.ru/scalar" target="_blank">API</RightTabAStyled>
                        <RightTabLinkStyled to={`/explorer/${realEntityId || ''}${location.search ? `?${queryString.toString()}` : ''}`}>Explorer</RightTabLinkStyled>
                        {!authentication.accessToken && <RightTabLinkStyled to={`/login/?${loginParams.toString()}`}>Login</RightTabLinkStyled>}
                        {authentication.accessToken && <RightTabButtonStyled onClick={() => dispatch(logoutAction())}>Logout</RightTabButtonStyled>}
                    </LoginStyled>
                </Toolbar>
            </AppBarStyled>
            <HeaderHeightStyled />
            <CssBaseline />
            {TagName && realEntityId ? (
                <TagName level={0} entityId={realEntityId} entityViews={entityViews[realEntityId]} />
            ) : (
                <div />
            )}
        </>
    )
}

export default HomePage