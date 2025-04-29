import axios from 'axios'
import { createAsyncThunk } from '@reduxjs/toolkit'
import type { Entity } from '../../../types/entities'

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
    name: string
    description: string
    code: string
    codeIsUnique: boolean
    order: number
    parentIds: string
    hidden: boolean
}

export interface UpdateEntityParams {
    id: string
    name?: string
    description?: string
    code?: string
    codeIsUnique?: boolean
    order?: number
    parentIds?: string
    hidden?: boolean
    version?: number
}

export interface DeleteEntityParams {
    id: string
}

export interface ParentOperationParams {
    id: string
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

const baseUrl = '/api/entities/';

export const getEntity = createAsyncThunk<Entity, GetEntityParams>(
    'entities/getEntity',
    async ({ id, version, lang, fromCache = true }) => {
        try {
            const response = await axios.get(`${baseUrl}getEntity/${id}`, {
                params: { version, lang, fromCache }
            });
            return response.data;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
);

export const getEntities = createAsyncThunk<Entity[], GetEntitiesParams>(
    'entities/getEntities',
    async (params) => {
        try {
            const response = await axios.get(`${baseUrl}getEntities`, { params });
            return response.data;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
);

export const addEntity = createAsyncThunk<{ id: string }, AddEntityParams>(
    'entities/addEntity',
    async (params) => {
        try {
            const response = await axios.post(`${baseUrl}addEntity`, params);
            return response.data;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
);

export const addEntityAndSelect = createAsyncThunk<{ id: string }, AddEntityParams>(
    'entities/addEntityAndSelect',
    async (params, { dispatch }) => {
        try {
            const response = await axios.post(`${baseUrl}addEntity`, params)
            const entityId = response.data.id
            
            // Fetch the newly created entity
            await dispatch(getEntity({ id: entityId }))
            
            // Fetch related entities
            await dispatch(getEntities({ parentIds: [entityId] }))
            await dispatch(getEntities({ idsToFindParents: [entityId] }))
            
            return response.data
        } catch (e) {
            console.error(e)
            throw e
        }
    }
)

export const updateEntity = createAsyncThunk<{ version: number }, UpdateEntityParams>(
    'entities/updateEntity',
    async (params, { dispatch }) => {
        try {
            const response = await axios.post(`${baseUrl}updateEntity`, params)
            const version = response.data.version
            
            // Fetch updated entity and related entities
            await dispatch(getEntity({ id: params.id }))
            await dispatch(getEntities({ parentIds: [params.id] }))
            await dispatch(getEntities({ idsToFindParents: [params.id] }))
            
            return { version }
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
            await axios.post(`${baseUrl}deleteEntity`, params);
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
);

export const addParent = createAsyncThunk<void, ParentOperationParams>(
    'entities/addParent',
    async (params) => {
        try {
            await axios.post(`${baseUrl}addParent`, params);
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
);

export const removeParent = createAsyncThunk<void, ParentOperationParams>(
    'entities/removeParent',
    async (params) => {
        try {
            await axios.post(`${baseUrl}removeParent`, params);
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
);

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

export const loadViewScript = createAsyncThunk<{ entityId: string; entityViews: any }, string>(
    'entities/loadViewScript',
    async (entityId) => {
        try {
            const response = await axios.get(`${baseUrl}getView/${entityId}`);
            const viewData = response.data;
            
            // Create and execute the script
            const script = document.createElement('script');
            script.text = viewData.scripts;
            document.body.appendChild(script);
            
            return {
                entityId,
                entityViews: viewData.entityViews
            };
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
);
