import axios from '../../../utility/customAxios'
import { isAxiosError } from 'axios'
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
    password: string
    email: string
}

export interface RefreshTokenCredentials {
    accessToken: string
    refreshToken: string
}

export const login = createAsyncThunk<authenticationData, LoginCredentials, { dispatch: AppDispatch }>(
    'authentication/login',
    async ({ login, password, giveinPlaceId }, { dispatch, rejectWithValue }) => {
        try {
            const response = await axios.post(`/api/authentication/login`, { login, password, giveinPlaceId })
            
            const authData: authenticationData = {
                userId: response.data.userId || '',
                login: response.data.login || '',
                userName: response.data.userName || '',
                giveinPlaceId: response.data.giveinPlaceId || 0,
                accessToken: response.data.accessToken || '',
                refreshToken: response.data.refreshToken || '',
                expirationTime: response.data.expirationTime ? new Date(response.data.expirationTime).toISOString() : new Date().toISOString(),
                idleTimeout: response.data.idleTimeout || 0,
                errorFields: response.data.errorFields || [],
                error: response.data.error || ''
            }
            
            dispatch(setAuthentication(authData))
            
            // If there's an error and no access token, reject the thunk
            if (authData.error && !authData.accessToken) {
                return rejectWithValue(authData)
            }
            
            return authData
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

export interface RegisterResult {
    success: boolean
    error?: string
    emailError?: string
    userUpdated?: boolean
}

export const register = createAsyncThunk<RegisterResult, { credentials: RegisterCredentials; lang: string }>(
    'authentication/register',
    async ({ credentials, lang }, { rejectWithValue }) => {
        try {
            const response = await axios.post<RegisterResult>(`/api/authentication/register?lang=${lang}`, credentials)
            return response.data
        } catch (e: unknown) {
            console.error(e)
            if (isAxiosError(e) && e.response?.data) {
                return rejectWithValue(e.response.data as RegisterResult)
            }
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

export interface ForgotPasswordResult {
    success: boolean
}

export const forgotPassword = createAsyncThunk<
    ForgotPasswordResult,
    { email: string; lang: string }
>(
    'authentication/forgotPassword',
    async ({ email, lang }) => {
        const response = await axios.post<ForgotPasswordResult>(
            `/api/authentication/forgotPassword?lang=${encodeURIComponent(lang)}`,
            { email }
        )
        return response.data
    }
)

export interface ResetPasswordResult {
    success: boolean
    error?: string
}

export const resetPassword = createAsyncThunk<
    ResetPasswordResult,
    { userId: string; token: string; newPassword: string },
    { rejectValue: ResetPasswordResult }
>(
    'authentication/resetPassword',
    async ({ userId, token, newPassword }, { rejectWithValue }) => {
        try {
            const response = await axios.post<ResetPasswordResult>(
                `/api/authentication/resetPassword`,
                { userId, token, newPassword }
            )
            return response.data
        } catch (e: unknown) {
            if (isAxiosError(e) && e.response?.data) {
                return rejectWithValue(e.response.data as ResetPasswordResult)
            }
            throw e
        }
    }
)

export interface ChangePasswordResult {
    success: boolean
    error?: string
}

export const changePassword = createAsyncThunk<
    ChangePasswordResult,
    { currentPassword: string; newPassword: string },
    { rejectValue: ChangePasswordResult }
>(
    'authentication/changePassword',
    async ({ currentPassword, newPassword }, { rejectWithValue }) => {
        try {
            const response = await axios.post<ChangePasswordResult>(
                `/api/authentication/changePassword`,
                { currentPassword, newPassword }
            )
            return response.data
        } catch (e: unknown) {
            if (isAxiosError(e) && e.response?.data) {
                return rejectWithValue(e.response.data as ChangePasswordResult)
            }
            throw e
        }
    }
)
