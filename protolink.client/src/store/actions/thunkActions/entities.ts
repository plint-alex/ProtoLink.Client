import axios from '../../../utility/customAxios'
import { createAsyncThunk } from '@reduxjs/toolkit'
import type { Entity } from '../../../types/entities'
import type { EntityViewMapping, ViewData } from '../../../types/view'

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
                take: params.data?.take
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

export const loadViewScript = createAsyncThunk<{ entityId: string, entityViews: EntityViewMapping[] }, string>(
    'entities/loadViewScript',
    async (entityId) => {
        try {
            const response = await axios.get<ViewData>(`${baseUrl}getView/${entityId}`);
            const viewData = response.data;

            // Ensure JSX scripts are executable in the browser by transpiling with Babel standalone when needed
            const ensureBabelLoaded = async () => {
                if ((window as any).Babel) return;
                await new Promise<void>((resolve, reject) => {
                    const babelScript = document.createElement('script');
                    babelScript.src = 'https://unpkg.com/@babel/standalone/babel.min.js';
                    babelScript.async = true;
                    babelScript.onload = () => resolve();
                    babelScript.onerror = () => reject(new Error('Failed to load Babel standalone'));
                    document.head.appendChild(babelScript);
                });
            };

            const executeViewScript = async (rawCode: string) => {
                // 1) Sanitize: strip ESM imports/exports which are not supported in injected scripts
                let sanitized = rawCode
                    .replace(/^\s*import\s+[^;]+;?\s*$/gm, '')
                    .replace(/^\s*export\s+default\s+/gm, '')
                    .replace(/^\s*export\s+\{[^}]*\};?\s*$/gm, '')
                    // Avoid duplicate React/ReactDOM declarations from dynamic scripts
                    .replace(/^\s*(?:var|let|const)\s+React\s*=.*$/gm, '')
                    .replace(/^\s*(?:var|let|const)\s+ReactDOM\s*=.*$/gm, '');

                // Extra cleanup: inline/combined declarations e.g., "const React = window.React, ReactDOM = window.ReactDOM;"
                sanitized = sanitized
                    .replace(/(?:^|[;\n\r])\s*(?:const|let|var)\s+React\s*=[^,;]*,\s*ReactDOM\s*=[^;]*;?/g, ';')
                    .replace(/(?:^|[;\n\r])\s*(?:const|let|var)\s+ReactDOM\s*=[^;]*;?/g, ';')
                    .replace(/(?:^|[;\n\r])\s*(?:const|let|var)\s+React\s*=[^;]*;?/g, ';');

                // 2) If it looks like JSX, transpile with Babel at runtime
                let executableCode = sanitized;
                const probablyJsx = /return\s*\(\s*<|React\.createElement\(/.test(sanitized);
                if (probablyJsx) {
                    await ensureBabelLoaded();
                    const Babel: any = (window as any).Babel;
                    try {
                        const transformed = Babel.transform(sanitized, {
                            presets: ['react'],
                            sourceType: 'script'
                        });
                        executableCode = transformed.code ?? sanitized;
                    } catch (transformError) {
                        console.error('[loadViewScript] JSX transform failed', transformError);
                        throw transformError;
                    }
                }

                // 3) Wrap into an IIFE with explicit globals to avoid redeclaration errors
                const wrapped = `;(function (global) {\n` +
                    `  try {\n` +
                    `    var React = global.React;\n` +
                    `    var ReactDOM = global.ReactDOM;\n` +
                    `    var window = global;\n` +
                    `    var document = global.document;\n` +
                    `    ${executableCode}\n` +
                    `  } catch (e) {\n` +
                    `    console.error('[loadViewScript] script runtime error', e);\n` +
                    `  }\n` +
                    `}).call(window, window);`;

                const script = document.createElement('script');
                script.type = 'text/javascript';
                script.text = wrapped;
                document.body.appendChild(script);
            };

            try {
                await executeViewScript(viewData?.scripts ?? '');
            } catch (e) {
                console.error('[loadViewScript] script execution error', e);
            }

            return { entityId, entityViews: viewData.entityViews };
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
);
