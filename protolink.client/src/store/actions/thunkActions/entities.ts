import axios from '../../../utility/customAxios'
import { createAsyncThunk } from '@reduxjs/toolkit'
import type { Entity, Permission } from '../../../types/entities'
import type { EntityViewMapping, ViewData } from '../../../types/view'

type GlobalViewsState = {
  cacheByEntityId: Record<string, EntityViewMapping[]>
  loadedViewIds: Set<string>
}

function getGlobalViewsState(): GlobalViewsState {
  const g = window as any
  if (!g.__protolinkViews) {
    g.__protolinkViews = {
      cacheByEntityId: {},
      loadedViewIds: new Set<string>()
    }
  }
  return g.__protolinkViews as GlobalViewsState
}

export interface GetEntityParams {
    id: string
    version?: number
    lang?: string
    fromCache?: boolean
}

export interface GetEntitiesParams {
    data: {
        ids?: string[]
        idsToFindParents?: string[]
        parentIds?: string[]
        skip?: number
        take?: number
        fromCache?: boolean
        /** When true (default), matches API GetEntitiesContract.includeValues */
        includeValues?: boolean
    }
    storageVariable?: string
    cache?: boolean 
}

export interface AddEntityParams {
    name: string
    description: string
    code: string
    codeIsUnique: boolean
    order: number
    parentIds: string[]
    hidden: boolean
}

export interface UpdateEntityParams {
    id: string
    name?: string
    description?: string
    code?: string
    codeIsUnique?: boolean
    order?: number
    parentIds?: string[]
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

export interface GetPermissionsParams {
    entityId: string
}

export interface AddPermissionParams {
    id: string
    permissionForId: string
    canWrite: boolean
}

export interface RemovePermissionParams {
    entityId: string
    permissionForId: string
}

export interface GetViewParams {
    id: string
    lang?: string
}

export interface GetViewResult {
    scripts: string
    entityViews: Array<{
        entityId: string
        viewId: string | null
    }>
}

const baseUrl = '/api/entities/';

export const getEntity = createAsyncThunk<Entity, GetEntityParams>(
    'entities/getEntity',
    async (params/*, { getState }*/) => {
        try {
            //const axiosConfig = getCommonAxiosConfig(getState)
            const response = await axios.get(`${baseUrl}getEntity/${params.id}`/*, axiosConfig*/);
            return response.data;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
);

export const getEntities = createAsyncThunk<{
    data: Entity[],
    storageVariable?: string
    cache?: boolean
}, GetEntitiesParams>(
    'entities/getEntities',
    async (params) => {
        try {
            const response = await axios.post(`${baseUrl}getEntities`, {
                ids: params.data?.ids,
                parentIds: params.data?.parentIds,
                idsToFindParents: params.data?.idsToFindParents,
                skip: params.data?.skip,
                take: params.data?.take,
                includeValues: params.data?.includeValues ?? true
            });
            return {
                data: response.data,
                storageVariable: params.storageVariable,
                cache: params.cache
            }
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
            const response = await axios.post(`${baseUrl}addEntity`, {
                name: params.name,
                description: params.description,
                code: params.code,
                codeIsUnique: params.codeIsUnique,
                order: params.order,
                parentIds: params.parentIds,
                hidden: params.hidden
            });
            return response.data;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
);

export const addEntityAndSelect = createAsyncThunk<{ id: string }, AddEntityParams>(
    'entities/addEntityAndSelect',
    async (params) => {
        try {
            const response = await axios.post<{ id:string }>(`${baseUrl}addEntity`, {
                name: params.name,
                description: params.description,
                code: params.code,
                codeIsUnique: params.codeIsUnique,
                order: params.order,
                parentIds: params.parentIds,
                hidden: params.hidden
            });
            const entityId = response.data.id;

            return { id: entityId };
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
);

export const updateEntity = createAsyncThunk<{ version: number }, UpdateEntityParams>(
    'entities/updateEntity',
    async (params, { dispatch }) => {
        try {
            const response = await axios.post(`${baseUrl}updateEntity`, {
                id: params.id,
                name: params.name,
                description: params.description,
                code: params.code,
                codeIsUnique: params.codeIsUnique,
                order: params.order,
                parentIds: params.parentIds,
                hidden: params.hidden,
                version: params.version
            });
            const version = response.data.version;

            // Fetch updated entity and related entities
            await dispatch(getEntity({ id: params.id }));
            await dispatch(getEntities({ data: { parentIds: [params.id] } }));
            await dispatch(getEntities({ data: { idsToFindParents: [params.id] } }));

            return { version };
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
);

export const deleteEntity = createAsyncThunk<void, DeleteEntityParams>(
    'entities/deleteEntity',
    async (params) => {
        try {
            await axios.post(`${baseUrl}deleteEntity`, {
                id: params.id
            });
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
            await axios.post(`${baseUrl}addParent`, {
                id: params.id,
                parentId: params.parentId
            });
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
            await axios.post(`${baseUrl}removeParent`, {
                id: params.id,
                parentId: params.parentId
            });
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

export const getPermissions = createAsyncThunk<Permission[], GetPermissionsParams>(
    'entities/getPermissions',
    async (params) => {
        try {
            const response = await axios.get<Permission[]>(`${baseUrl}GetPermissions`, {
                params: { entityId: params.entityId }
            });
            return response.data;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
);

export const addPermissionNew = createAsyncThunk<void, AddPermissionParams>(
    'entities/addPermissionNew',
    async (params) => {
        try {
            await axios.post(`${baseUrl}AddPermission`, {
                id: params.id,
                permissionForId: params.permissionForId,
                canWrite: params.canWrite
            });
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
);

export const removePermission = createAsyncThunk<void, RemovePermissionParams>(
    'entities/removePermission',
    async (params) => {
        try {
            await axios.post(`${baseUrl}RemovePermission`, {
                entityId: params.entityId,
                permissionForId: params.permissionForId
            });
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
);

export const getView = createAsyncThunk<GetViewResult, GetViewParams>(
    'entities/getView',
    async ({ id, lang }) => {
        try {
            const response = await axios.get(`${baseUrl}getView/${id}`, {
                params: { lang }
            });
            return response.data;
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
);

type LoadViewScriptParams = {
    entityId: string;
    lang?: string;
};

type LoadViewScriptResult = {
    entityId: string;
    entityViews: EntityViewMapping[];
    originalScript?: string;
    transpiledScript?: string;
};

type ViewDataResponse = ViewData & { originalScripts?: string };

export const loadViewScript = createAsyncThunk<LoadViewScriptResult, LoadViewScriptParams>(
    'entities/loadViewScript',
    async ({ entityId, lang }) => {
        try {
            const response = await axios.get<ViewDataResponse>(`${baseUrl}getView/${entityId}`, {
                params: { lang }
            });

            const viewData = response.data ?? { scripts: '', entityViews: [] };
            const scriptText = viewData.scripts ?? '';
            const gv = getGlobalViewsState();

            if (scriptText && !gv.loadedViewIds.has(entityId)) {
                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.text = scriptText;
                document.body.appendChild(script);
                gv.loadedViewIds.add(entityId);
            }

            gv.cacheByEntityId[entityId] = viewData.entityViews || [];

            const normalize = (value?: string | null) => {
                if (!value) return '';
                return value.trimStart().replace(/^\s*;*/, '');
            };

            return {
                entityId,
                entityViews: viewData.entityViews || [],
                originalScript: normalize(viewData.originalScripts),
                transpiledScript: normalize(viewData.scripts)
            };
        } catch (e) {
            console.error('[loadViewScript] failed to load view', e);
            throw e;
        }
    }
);
