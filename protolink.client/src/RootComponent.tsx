import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import { Layout } from './components/Layout'
import NotFoundPage from './pages/NotFoundPage'
import { ROUTES } from './resources/routes-constants'
import AdminPage from './pages/AdminPage/AdminPage'
import TestPage from './pages/TestPage'
import RegisterPage from './pages/RegisterPage'

const RootComponent: React.FC = () => {
    // Enhanced route debug
    if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.log('[Router] at', window.location.pathname + window.location.search)
        console.log('[Router] current pathname:', window.location.pathname)
        console.log('[Router] test route should match:', window.location.pathname === '/test' || window.location.pathname.startsWith('/test/'))
        console.log('[Router] explorer route should match:', window.location.pathname === '/explorer' || window.location.pathname.startsWith('/explorer/'))
        console.log('[Router] login route should match:', window.location.pathname === '/login')
        console.log('[Router] home route should match:', window.location.pathname === '/')
    }

    return (
        <Router>
            <Layout name={'Layout'}>
                <Routes>
                        <Route path={ROUTES.HOMEPAGE_ROUTE} element={<HomePage />} />
                        <Route path={ROUTES.HOMEPAGE_ROUTE + '/:id'} element={<HomePage />} />
                        <Route path={ROUTES.TEST_ROUTE} element={<TestPage />} />
                        <Route path={ROUTES.TEST_ROUTE + '/:id'} element={<TestPage />} />
                        <Route path={ROUTES.EXPLORER_ROUTE} element={<AdminPage />} />
                        <Route path={ROUTES.EXPLORER_ROUTE + '/:id'} element={<AdminPage />} />
                        <Route path={ROUTES.LOGIN_ROUTE} element={<LoginPage />} />
                        <Route path={ROUTES.REGISTER_ROUTE} element={<RegisterPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Layout>
        </Router>
    )
}

export default RootComponent
