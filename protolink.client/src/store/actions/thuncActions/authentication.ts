import axios from 'axios'
import { createAsyncThunk } from '@reduxjs/toolkit'
import { AppDispatch } from '../../reducers/store'
import { setAuthentication, authenticationData  } from '../authentication'

export const login = createAsyncThunk<void, { login: string, password: string }, { dispatch: AppDispatch }>('authenticationActions/login', async ({ login, password }, { dispatch }) => {
    try {
        const result: authenticationData = await axios.post(`authentication/login`, { login, password }).then((response) => response.data.results)
        dispatch(setAuthentication(result))
    } catch (e) {
        console.error(e)
        throw e
    }
})
