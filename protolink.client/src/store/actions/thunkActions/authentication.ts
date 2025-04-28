import axios from 'axios'
import { createAsyncThunk } from '@reduxjs/toolkit'
import { AppDispatch } from '../../reducers/store'
import { setAuthentication, authenticationData  } from '../authentication'

export const login = createAsyncThunk<void, { login: string, password: string }, { dispatch: AppDispatch }>('authenticationActions/login', async ({ login, password }, { dispatch }) => {
    try {
        const response: authenticationData = await axios.post(`/api/authentication/login`, { login, password }).then((response) => response.data)

        const authData: authenticationData = {
            userId: response.userId,
            login: response.login,
            userName: response.userName,
            giveinPlaceId: response.giveinPlaceId,
            accessToken: response.accessToken,
            refreshToken: response.refreshToken,
            expirationTime: new Date(response.expirationTime),
            idleTimeout: response.idleTimeout,
            errorFields: [],
            error: ''
        }

        dispatch(setAuthentication(authData))
    } catch (e) {
        console.error(e)
        throw e
    }
})
