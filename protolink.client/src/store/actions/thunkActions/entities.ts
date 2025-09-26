import axios from '../../../utility/customAxios'
import { createAsyncThunk } from '@reduxjs/toolkit'
import type { Entity } from '../../../types/entities'
import type { EntityViewMapping, ViewData } from '../../../types/view'

// Global, idempotent guards for dynamic view loading across re-mounts
type GlobalViewsState = {
  cacheByEntityId: Record<string, EntityViewMapping[]>
  loadedViewIds: Set<string>
  inFlightByEntityId: Record<string, Promise<ViewData>>
}

function getGlobalViewsState(): GlobalViewsState {
  const g = window as any
  if (!g.__protolinkViews) {
    g.__protolinkViews = {
      cacheByEntityId: {},
      loadedViewIds: new Set<string>(),
      inFlightByEntityId: {},
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
            const gv = getGlobalViewsState()

            // 1) Serve from cache if already loaded
            const cached = gv.cacheByEntityId[entityId]
            if (cached) {
                return { entityId, entityViews: cached }
            }

            // 2) Coalesce in-flight requests per entityId
            if (!gv.inFlightByEntityId[entityId]) {
                gv.inFlightByEntityId[entityId] = axios.get<ViewData>(`${baseUrl}getView/${entityId}`).then(r => r.data)
            }
            const viewData = await gv.inFlightByEntityId[entityId]
            delete gv.inFlightByEntityId[entityId]

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

            const executeViewScript = async (rawCode: string, currentViewId?: string) => {
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

                // Pre-check: if the raw code compiles by itself, prefer it directly (no wrapping)
                try {
                    // eslint-disable-next-line no-new-func
                    new Function(sanitized);
                    // Execute only if this viewId hasn't been executed yet
                    if (!getGlobalViewsState().loadedViewIds.has(currentViewId ?? '')) {
                        const direct = document.createElement('script');
                        direct.type = 'text/javascript';
                        direct.text = sanitized;
                        document.body.appendChild(direct);
                        if (currentViewId) getGlobalViewsState().loadedViewIds.add(currentViewId)
                    }
                    return; // done
                } catch {
                    // fall back to wrapper path
                }

                // 2) If it looks like JSX, transpile with Babel at runtime (wrapper path)
                let executableCode = sanitized;
                const probablyJsx = /return\s*\(\s*</.test(sanitized);
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

                // 3) Wrap into an IIFE with explicit globals, using classic string concat to avoid backtick/template collisions
                const wrapped =
                    ';(function (global) {\n' +
                    '  try {\n' +
                    '    var React = global.React;\n' +
                    '    var ReactDOM = global.ReactDOM;\n' +
                    '    var window = global;\n' +
                    '    var document = global.document;\n' +
                         executableCode + '\n' +
                    '  } catch (e) {\n' +
                    "    console.error('[loadViewScript] script runtime error', e);\n" +
                    '  }\n' +
                    '}).call(window, window);';

                // Preflight compile to surface syntax errors clearly before injection
                try {
                    // eslint-disable-next-line no-new-func
                    // Compile the code; if OK, execute directly to avoid HTML parser edge-cases (e.g. </script>)
                    const runner = new Function(wrapped);
                    if (!getGlobalViewsState().loadedViewIds.has(currentViewId ?? '')) {
                        runner();
                        if (currentViewId) getGlobalViewsState().loadedViewIds.add(currentViewId)
                    }
                } catch (compileError: any) {
                    const message: string = (compileError && compileError.message) ? String(compileError.message) : 'Unknown compile error';
                    console.error('[loadViewScript] compile error before injection:', message);
                    try {
                        const banner = document.createElement('div');
                        banner.style.position = 'fixed';
                        banner.style.top = '0';
                        banner.style.left = '0';
                        banner.style.right = '0';
                        banner.style.zIndex = '10000';
                        banner.style.background = '#8b0000';
                        banner.style.color = '#fff';
                        banner.style.padding = '8px 12px';
                        banner.style.fontFamily = 'monospace';
                        banner.style.whiteSpace = 'pre-wrap';
                        banner.textContent = `Dynamic view compile error: ${message}`;
                        document.body.appendChild(banner);
                    } catch {}
                    return; // Skip appending broken script
                }

                // Fallback (should rarely be hit now). Keep DOM injection path as a last resort.
                try {
                    const script = document.createElement('script');
                    script.type = 'text/javascript';
                    script.text = wrapped;
                    if (!getGlobalViewsState().loadedViewIds.has(currentViewId ?? '')) {
                        document.body.appendChild(script);
                        if (currentViewId) getGlobalViewsState().loadedViewIds.add(currentViewId)
                    }
                } catch (injectErr) {
                    console.error('[loadViewScript] injection error', injectErr);
                }
            };

            try {
                // Execute script once per unique view mapping
                const executedOnce: Set<string> = new Set<string>();
                for (const m of viewData?.entityViews || []) {
                    const vid = m.viewId || undefined;
                    if (vid && executedOnce.has(vid)) continue;
                    await executeViewScript(viewData?.scripts ?? '', vid);
                    if (vid) executedOnce.add(vid);
                    break; // script includes all views at once; no need to repeat
                }

                // Post-process: ensure each dynamic view exports a React component
                try {
                    const globalAny = window as any;
                    const ensureReactComponent = (viewId: string | null | undefined) => {
                        if (!viewId) return;
                        const candidate = globalAny[viewId];
                        if (typeof candidate !== 'function') return;
                        let looksLikeElement = false;
                        try {
                            const maybe = candidate({});
                            looksLikeElement = !!maybe && (
                                !!(maybe as any).$$typeof ||
                                typeof (maybe as any).type === 'string' ||
                                typeof (maybe as any).type === 'function'
                            );
                        } catch { /* ignore probe errors */ }

                        if (!looksLikeElement) {
                            globalAny[viewId] = function WrappedDynamicView(props: unknown) {
                                const ReactLocal = globalAny.React;
                                try {
                                    const result = candidate(props);
                                    if (result && (
                                        (result as any).$$typeof ||
                                        typeof (result as any).type === 'string' ||
                                        typeof (result as any).type === 'function'
                                    )) {
                                        return result;
                                    }
                                } catch { /* fall through to fallback */ }
                                return ReactLocal && ReactLocal.createElement
                                    ? ReactLocal.createElement('div', { id: `view-fallback-${viewId}` }, 'View loaded')
                                    : null;
                            };
                        }
                    };

                    (viewData?.entityViews || []).forEach(m => ensureReactComponent(m.viewId));

                    // Inject a richer dynamic Home component ONLY IF server did not provide a usable component
                    try {
                        const homeEntityId = '4cca22a8-bf99-4c52-a753-c820969925c3';
                        const mapping = (viewData?.entityViews || []).find(m => m.entityId === homeEntityId);
                        const viewId = mapping?.viewId || null;
                        if (viewId) {
                            const g: any = window as any;
                            const existing = g[viewId];

                            const isReactElement = (candidate: unknown): boolean => {
                                try {
                                    const el: any = typeof candidate === 'function' ? (candidate as any)({}) : candidate;
                                    return !!el && (el.$$typeof || typeof el.type === 'string' || typeof el.type === 'function');
                                } catch { return false; }
                            };

                            if (!(typeof existing === 'function' && isReactElement(existing))) {
                                g[viewId] = function DynamicHome(props: { entityId?: string }) {
                                    const ReactLocal = g.React;
                                    const [entity, setEntity] = ReactLocal.useState(null as any);
                                    const targetEntityId = props?.entityId || homeEntityId;

                                    ReactLocal.useEffect(() => {
                                        let cancelled = false;
                                        fetch(`/api/entities/getEntity/${targetEntityId}`)
                                            .then(r => r.json())
                                            .then(data => { if (!cancelled) setEntity(data); })
                                            .catch(() => { /* ignore */ });
                                        return () => { cancelled = true; };
                                    }, [targetEntityId]);

                                    const header = ReactLocal.createElement('h2', { style: { margin: '8px 0' } }, 'Home');
                                    if (!entity) {
                                        return ReactLocal.createElement('div', { id: `home-view-${viewId}` }, header,
                                            ReactLocal.createElement('div', null, 'Loading...'));
                                    }

                                    const values = Array.isArray(entity.values) ? entity.values : [];
                                    const items = values.map((v: any) => ReactLocal.createElement(
                                        'li', { key: v.id }, `${v.id}: ${v.value}`
                                    ));

                                    return ReactLocal.createElement('div', { id: `home-view-${viewId}` }, header,
                                        ReactLocal.createElement('div', null, `Entity: ${entity.id}`),
                                        ReactLocal.createElement('ul', null, items)
                                    );
                                };
                            }
                        }
                    } catch (injectErr) {
                        console.warn('[loadViewScript] optional DynamicHome injection skipped', injectErr);
                    }
                } catch (postProcessError) {
                    console.warn('[loadViewScript] post-process failed', postProcessError);
                }
            } catch (e) {
                console.error('[loadViewScript] script execution error', e);
            }

                // Persist cache so future calls skip network and execution
                gv.cacheByEntityId[entityId] = viewData.entityViews
                return { entityId, entityViews: viewData.entityViews };
        } catch (e) {
            console.error(e);
            throw e;
        }
    }
);
