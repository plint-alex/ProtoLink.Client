import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import { Layout } from './components/Layout'
import NotFoundPage from './pages/NotFoundPage'
import EntityHomeRoute from './components/EntityHomeRoute'
import { ROUTES } from './resources/routes-constants'
import AdminPage from './pages/AdminPage/AdminPage'
import TestPage from './pages/TestPage'
import RegisterPage from './pages/RegisterPage'
import ConfirmEmailPage from './pages/ConfirmEmailPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ChangePasswordPage from './pages/ChangePasswordPage'
import ShareRedeemPage from './pages/ShareRedeemPage'

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
                        {/* Public: must be before /:id so auth helpers / share are not treated as entities */}
                        <Route path={ROUTES.CONFIRM_EMAIL_ROUTE} element={<ConfirmEmailPage />} />
                        <Route path={ROUTES.FORGOT_PASSWORD_ROUTE} element={<ForgotPasswordPage />} />
                        <Route path={ROUTES.RESET_PASSWORD_ROUTE} element={<ResetPasswordPage />} />
                        <Route path={ROUTES.CHANGE_PASSWORD_ROUTE} element={<ChangePasswordPage />} />
                        <Route path={ROUTES.SHARE_ROUTE} element={<ShareRedeemPage />} />
                        {/* C2: /{guid}, /{guid}-{slug}, /{guid}/{anything} — id alone resolves */}
                        <Route path="/:id/*" element={<EntityHomeRoute />} />
                        <Route path="*" element={<NotFoundPage />} />
                </Routes>
            </Layout>
        </Router>
    )
}

export default RootComponent
