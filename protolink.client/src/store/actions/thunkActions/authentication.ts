import axios from '../../../utility/customAxios'
import { createAsyncThunk } from '@reduxjs/toolkit'
import { AppDispatch, RootState } from '../../store'
import { setAuthentication, authenticationData } from '../authentication'
import { getCommonAxiosConfig } from '../../../utility/commonAxiosConfig'

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

export const logout = createAsyncThunk<void, void, { dispatch: AppDispatch, state: RootState }>(
    'authentication/logout',
    async (_, { dispatch/*, getState */}) => {
        try {
            //const axiosConfig = getCommonAxiosConfig(getState)
            dispatch(setAuthentication(null))
            await axios.post(`/api/authentication/logout`, {})
        } catch (e) {
            console.error(e)
            throw e
        }
    }
)

export const refreshToken = createAsyncThunk<void, RefreshTokenCredentials, { dispatch: AppDispatch, state: RootState }>(
    'authentication/refreshToken',
    async ({ accessToken, refreshToken }, { dispatch, getState }) => {
        try {
            const axiosConfig = getCommonAxiosConfig(getState)
            const response = await axios.post(`/api/authentication/refreshtoken`, { accessToken, refreshToken }, axiosConfig)
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

export const register = createAsyncThunk<void, { credentials: RegisterCredentials; lang: string }>(
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
