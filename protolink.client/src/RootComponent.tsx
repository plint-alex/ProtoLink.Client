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
import ConfirmEmailPage from './pages/ConfirmEmailPage'

const RootComponent: React.FC = () => {
    return (
        <Router>
            <Layout name={'Layout'}>
                <Routes>
                        <Route path={ROUTES.HOMEPAGE_ROUTE} element={<HomePage />} />
                        <Route path={ROUTES.TEST_ROUTE} element={<TestPage />} />
                        <Route path={ROUTES.TEST_ROUTE + '/:id'} element={<TestPage />} />
                        <Route path={ROUTES.EXPLORER_ROUTE} element={<AdminPage />} />
                        <Route path={ROUTES.EXPLORER_ROUTE + '/:id'} element={<AdminPage />} />
                        <Route path={ROUTES.LOGIN_ROUTE} element={<LoginPage />} />
                        <Route path={ROUTES.REGISTER_ROUTE} element={<RegisterPage />} />
                        {/* Public: must be before /:id so confirm-email is not treated as an entity */}
                        <Route path={ROUTES.CONFIRM_EMAIL_ROUTE} element={<ConfirmEmailPage />} />
                        {/* After static paths: entity GUID in URL (user profile, etc.) */}
                        <Route path="/:id" element={<HomePage />} />
                        <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Layout>
        </Router>
    )
}

export default RootComponent
