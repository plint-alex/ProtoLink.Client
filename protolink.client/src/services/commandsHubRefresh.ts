import type { AppDispatch } from '../store/store'
import { getEntities, getEntity, loadViewScript } from '../store/actions/thunkActions/entities'
import { isGuid, parseEntityIdFromSegment } from './search/searchHelpers'
import { bumpSubtreeRefresh } from './subtreeRefreshBus'

const ENTITY_ID_KEYS = [
    'entityId',
    'EntityId',
    'parentId',
    'ParentId',
    'rootEntityId',
    'RootEntityId',
] as const

/** Routes that never own an entity subtree for live refresh. */
const NON_ENTITY_SEGMENTS = new Set([
    'login',
    'register',
    'confirm-email',
    'share',
    'explorer',
    'test',
])

export function isDataChangedCommand(commandType: string | null | undefined): boolean {
    return (commandType ?? '').trim().toLowerCase() === 'data_changed'
}

export function shouldRefreshOnCommand(commandType: string | null | undefined): boolean {
    const type = (commandType ?? '').trim().toLowerCase()
    return type === 'data_changed' || type === 'reconnected'
}

/**
 * Prefer an entity id from the command payload when present; otherwise the
 * entity currently on the route. Today's cloud_sync ping only sends { source }.
 */
export function resolveSubtreeEntityId(
    parameters: unknown,
    pathname: string
): string | null {
    const fromParams = entityIdFromParameters(parameters)
    if (fromParams) return fromParams
    return entityIdFromPathname(pathname)
}

export function entityIdFromParameters(parameters: unknown): string | null {
    if (!parameters || typeof parameters !== 'object') return null
    const record = parameters as Record<string, unknown>
    for (const key of ENTITY_ID_KEYS) {
        const value = record[key]
        if (typeof value === 'string' && isGuid(value)) {
            return value.trim()
        }
    }
    return null
}

export function entityIdFromPathname(pathname: string): string | null {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 0) return null

    if (segments[0] === 'explorer' || segments[0] === 'test') {
        const id = segments[1]
        return id && isGuid(id) ? id : null
    }

    const first = segments[0]
    if (NON_ENTITY_SEGMENTS.has(first)) return null
    return parseEntityIdFromSegment(first)
}

export type RefreshSubtreeOptions = {
    entityId: string
    /** When on a home entity route, also reload the dynamic view script. */
    reloadView?: boolean
    lang?: string
}

/**
 * Refetch only the current entity and its immediate children/parents —
 * not a global store wipe and not location.reload().
 */
export async function refreshEntitySubtree(
    dispatch: AppDispatch,
    options: RefreshSubtreeOptions
): Promise<void> {
    const { entityId, reloadView, lang } = options
    await Promise.all([
        dispatch(getEntity({ id: entityId })),
        dispatch(
            getEntities({
                data: { parentIds: [entityId] },
                storageVariable: 'children',
            })
        ),
        dispatch(
            getEntities({
                data: { idsToFindParents: [entityId] },
                storageVariable: 'parents',
            })
        ),
    ])

    if (reloadView) {
        await dispatch(loadViewScript({ entityId, lang }))
    }

    bumpSubtreeRefresh()
}

/** Home entity routes: `/{guid}`, `/{guid}-{slug}`, `/{guid}/{anything}` (not explorer/test). */
export function isHomeEntityPath(pathname: string): boolean {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length === 0) return false
    if (NON_ENTITY_SEGMENTS.has(segments[0])) return false
    return parseEntityIdFromSegment(segments[0]) != null
}
