import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import { Layout } from './components/Layout'
import NotFoundPage from './pages/NotFoundPage'
import { ROUTES } from './resources/routes-constants'
import AdminPage from './pages/AdminPage/AdminPage'

const RootComponent: React.FC = () => {
    // rudimentary route debug
    if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.log('[Router] at', window.location.pathname + window.location.search)
    }

    return (
        <Layout name={'Layout'}>
            <Router>
                <Routes>
                    <Route path="*" element={<NotFoundPage />} />
                    <Route path={ROUTES.HOMEPAGE_ROUTE} element={<HomePage />} />
                    <Route path={ROUTES.HOMEPAGE_ROUTE + '/:id'} element={<HomePage />} />
                    <Route path={ROUTES.EXPLORER_ROUTE} element={<AdminPage />} />
                    <Route path={ROUTES.EXPLORER_ROUTE + '/:id'} element={<AdminPage />} />
                    <Route path={ROUTES.LOGIN_ROUTE} element={<LoginPage />} />
                </Routes>
            </Router>
        </Layout>
    )
}

export default RootComponent
