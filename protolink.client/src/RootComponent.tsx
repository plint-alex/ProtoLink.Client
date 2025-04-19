import React from 'react'
import { BrowserRouter as Router, Route, Routes } from 'react-router'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import { Layout } from './components/Layout'
import NotFoundPage from './pages/NotFoundPage'
import { ROUTES } from './resources/routes-constants'

const RootComponent: React.FC = () => {
    return (
        <Layout name={'Layout'}>
            <Router>
                <Routes>
                    <Route path="*" element={<NotFoundPage />} />
                    <Route path={ROUTES.HOMEPAGE_ROUTE} element={<HomePage />} />
                    <Route path={ROUTES.LOGIN_ROUTE} element={<LoginPage />} />
                </Routes>
            </Router>
        </Layout>
    )
}

export default RootComponent
