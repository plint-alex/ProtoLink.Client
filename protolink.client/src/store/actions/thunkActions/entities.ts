import axios from 'axios'
import { createAsyncThunk } from '@reduxjs/toolkit'
import { AppDispatch } from '../../reducers/store'
import { addEntityContract } from '../entities'

export const login = createAsyncThunk<void, addEntityContract, { dispatch: AppDispatch }>('entities/addEntity', async (data/*, { dispatch }*/) => {
    try {
        await axios.post(`/api/entities/addEntity`, data).then((response) => response.data.results)
        //dispatch(setAuthentication(result))
    } catch (e) {
        console.error(e)
        throw e
    }
})
