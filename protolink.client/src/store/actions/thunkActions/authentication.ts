import axios from 'axios'
import { createAsyncThunk } from '@reduxjs/toolkit'
import { AppDispatch } from '../../reducers/store'
import { setAuthentication, authenticationData } from '../authentication'

export interface LoginCredentials {
    login: string
    password: string
    giveinPlaceId?: string
}

export interface RegisterCredentials {
    login: string
    password: string
    email: string
    firstName: string
    lastName: string
}

export interface RefreshTokenCredentials {
    accessToken: string
    refreshToken: string
}

export const login = createAsyncThunk<void, LoginCredentials, { dispatch: AppDispatch }>(
    'authentication/login',
    async ({ login, password, giveinPlaceId }, { dispatch }) => {
        try {
            const response = await axios.post(`/api/authentication/login`, { login, password, giveinPlaceId })
            const authData: authenticationData = {
                userId: response.data.userId,
                login: response.data.login,
                userName: response.data.userName,
                giveinPlaceId: response.data.giveinPlaceId,
                accessToken: response.data.accessToken,
                refreshToken: response.data.refreshToken,
                expirationTime: new Date(response.data.expirationTime).toISOString(),
                idleTimeout: response.data.idleTimeout,
                errorFields: [],
                error: response.data.error || ''
            }
            dispatch(setAuthentication(authData))
        } catch (e) {
            console.error(e)
            throw e
        }
    }
)

export const logout = createAsyncThunk<void, void, { dispatch: AppDispatch }>(
    'authentication/logout',
    async (_, { dispatch }) => {
        try {
            await axios.post(`/api/authentication/logout`)
            dispatch(setAuthentication(null))
        } catch (e) {
            console.error(e)
            throw e
        }
    }
)

export const refreshToken = createAsyncThunk<void, RefreshTokenCredentials, { dispatch: AppDispatch }>(
    'authentication/refreshToken',
    async ({ accessToken, refreshToken }, { dispatch }) => {
        try {
            const response = await axios.post(`/api/authentication/refreshtoken`, { accessToken, refreshToken })
            if (response.data) {
                const authData: authenticationData = {
                    userId: response.data.userId,
                    login: response.data.login,
                    userName: response.data.userName,
                    giveinPlaceId: response.data.giveinPlaceId,
                    accessToken: response.data.accessToken,
                    refreshToken: response.data.refreshToken,
                    expirationTime: new Date(response.data.expirationTime).toISOString(),
                    idleTimeout: response.data.idleTimeout,
                    errorFields: [],
                    error: ''
                }
                dispatch(setAuthentication(authData))
            }
        } catch (e) {
            console.error(e)
            throw e
        }
    }
)

export const register = createAsyncThunk<void, { credentials: RegisterCredentials; lang: string }, { dispatch: AppDispatch }>(
    'authentication/register',
    async ({ credentials, lang }) => {
        try {
            await axios.post(`/api/authentication/register?lang=${lang}`, credentials)
        } catch (e) {
            console.error(e)
            throw e
        }
    }
)

export const confirmEmail = createAsyncThunk<boolean, { userId: string; token: string }, { dispatch: AppDispatch }>(
    'authentication/confirmEmail',
    async ({ userId, token }) => {
        try {
            const response = await axios.get(`/api/authentication/confirmEmail/${userId}/${token}`)
            return response.data.ok
        } catch (e) {
            console.error(e)
            throw e
        }
    }
)
