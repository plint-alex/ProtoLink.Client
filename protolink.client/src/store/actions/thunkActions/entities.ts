import axios from 'axios'
import { createAsyncThunk } from '@reduxjs/toolkit'

export interface GetEntityParams {
    id: string
    version?: number
    lang?: string
    fromCache?: boolean
}

export interface GetEntitiesParams {
    ids?: string[]
    idsToFindParents?: string[]
    parentIds?: string[]
    skip?: number
    take?: number
    fromCache?: boolean
}

export interface AddEntityParams {
    entityId: string
    type: string
    values: Record<string, any>
}

export interface UpdateEntityParams {
    id: string
    values: Record<string, any>
}

export interface DeleteEntityParams {
    id: string
}

export interface ParentOperationParams {
    entityId: string
    parentId: string
}

export interface PermissionParams {
    entityId: string
    userId: string
    permission: string
}

export interface GetViewParams {
    id: string
    lang?: string
}

export const getEntity = createAsyncThunk<any, GetEntityParams>(
    'entities/getEntity',
    async ({ id, version, lang, fromCache = true }) => {
        try {
            const response = await axios.get(`/api/entities/GetEntity/${id}`, {
                params: { version, lang, fromCache }
            })
            return response.data
        } catch (e) {
            console.error(e)
            throw e
        }
    }
)

export const getEntities = createAsyncThunk<any[], GetEntitiesParams>(
    'entities/getEntities',
    async (params) => {
        try {
            const response = await axios.post('/api/entities/GetEntities', params)
            return response.data || []
        } catch (e) {
            console.error(e)
            throw e
        }
    }
)

export const addEntity = createAsyncThunk<{ id: string }, AddEntityParams>(
    'entities/addEntity',
    async (params) => {
        try {
            const response = await axios.post('/api/entities/AddEntity', params)
            return response.data
        } catch (e) {
            console.error(e)
            throw e
        }
    }
)

export const updateEntity = createAsyncThunk<{ version: number }, UpdateEntityParams>(
    'entities/updateEntity',
    async (params) => {
        try {
            const response = await axios.post('/api/entities/UpdateEntity', params)
            return response.data
        } catch (e) {
            console.error(e)
            throw e
        }
    }
)

export const deleteEntity = createAsyncThunk<void, DeleteEntityParams>(
    'entities/deleteEntity',
    async (params) => {
        try {
            await axios.post('/api/entities/DeleteEntity', params)
        } catch (e) {
            console.error(e)
            throw e
        }
    }
)

export const addParent = createAsyncThunk<void, ParentOperationParams>(
    'entities/addParent',
    async (params) => {
        try {
            await axios.post('/api/entities/AddParent', params)
        } catch (e) {
            console.error(e)
            throw e
        }
    }
)

export const removeParent = createAsyncThunk<void, ParentOperationParams>(
    'entities/removeParent',
    async (params) => {
        try {
            await axios.post('/api/entities/RemoveParent', params)
        } catch (e) {
            console.error(e)
            throw e
        }
    }
)

export const addPermission = createAsyncThunk<void, PermissionParams>(
    'entities/addPermission',
    async (params) => {
        try {
            await axios.post('/api/entities/AddPermission', params)
        } catch (e) {
            console.error(e)
            throw e
        }
    }
)

export const getView = createAsyncThunk<any, GetViewParams>(
    'entities/getView',
    async ({ id, lang }) => {
        try {
            const response = await axios.get(`/api/entities/GetView/${id}`, {
                params: { lang }
            })
            return response.data
        } catch (e) {
            console.error(e)
            throw e
        }
    }
)
