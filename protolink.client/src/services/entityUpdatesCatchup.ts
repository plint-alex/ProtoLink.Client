import axios from '../utility/customAxios'
import type { AppDispatch } from '../store/store'
import {
    clearEntityUpdateCursor,
    readEntityUpdateCursor,
    writeEntityUpdateCursor,
    type EntityUpdateCursor,
} from './entityUpdateCursorStore'
import { refreshEntitySubtree } from './commandsHubRefresh'

export type EntityUpdateChange = {
    id: string
    entityId: string
    updateType: string
    timeStamp: string
    changedByUserId: string
}

export type GetEntityUpdatesResult = {
    requiresFullReconcile: boolean
    changes: EntityUpdateChange[]
    nextCursor: EntityUpdateCursor | null
}

export type CatchupDecision = 'noop' | 'refreshDelta' | 'fullReconcile'

/**
 * Pure decision for tests: reconcile vs delta refresh vs skip GetEntities.
 */
export function decideCatchupAction(result: {
    requiresFullReconcile: boolean
    changes: unknown[]
}): CatchupDecision {
    if (result.requiresFullReconcile) return 'fullReconcile'
    if (!result.changes || result.changes.length === 0) return 'noop'
    return 'refreshDelta'
}

function normalizeCursor(raw: unknown): EntityUpdateCursor | null {
    if (!raw || typeof raw !== 'object') return null
    const record = raw as Record<string, unknown>
    const timeStamp =
        (typeof record.timeStamp === 'string' && record.timeStamp) ||
        (typeof record.TimeStamp === 'string' && record.TimeStamp) ||
        ''
    const id =
        (typeof record.id === 'string' && record.id) ||
        (typeof record.Id === 'string' && record.Id) ||
        ''
    if (!timeStamp.trim() || !id.trim()) return null
    return { timeStamp: timeStamp.trim(), id: id.trim() }
}

function normalizeChanges(raw: unknown): EntityUpdateChange[] {
    if (!Array.isArray(raw)) return []
    return raw.map((row) => {
        const r = (row && typeof row === 'object' ? row : {}) as Record<string, unknown>
        return {
            id: String(r.id ?? r.Id ?? ''),
            entityId: String(r.entityId ?? r.EntityId ?? ''),
            updateType: String(r.updateType ?? r.UpdateType ?? ''),
            timeStamp: String(r.timeStamp ?? r.TimeStamp ?? ''),
            changedByUserId: String(r.changedByUserId ?? r.ChangedByUserId ?? ''),
        }
    })
}

export async function fetchEntityUpdates(params: {
    rootEntityId: string
    after?: EntityUpdateCursor | null
}): Promise<GetEntityUpdatesResult> {
    const body: Record<string, unknown> = {
        rootEntityId: params.rootEntityId,
    }
    if (params.after?.timeStamp && params.after?.id) {
        body.afterTimeStamp = params.after.timeStamp
        body.afterId = params.after.id
    }

    const response = await axios.post('/api/entities/GetEntityUpdates', body)
    const data = (response.data ?? {}) as Record<string, unknown>
    return {
        requiresFullReconcile: Boolean(data.requiresFullReconcile ?? data.RequiresFullReconcile),
        changes: normalizeChanges(data.changes ?? data.Changes),
        nextCursor: normalizeCursor(data.nextCursor ?? data.NextCursor),
    }
}

export type CatchUpOptions = {
    rootEntityId: string
    reloadView?: boolean
    lang?: string
}

/**
 * One GetEntityUpdates for the route root. Empty → no GetEntities.
 * Non-empty → same subtree refresh as SignalR. RequiresFullReconcile →
 * discard cursor, full subtree refresh, then store a fresh cursor tip.
 */
export async function catchUpEntityUpdates(
    dispatch: AppDispatch,
    options: CatchUpOptions
): Promise<CatchupDecision> {
    const rootEntityId = options.rootEntityId.trim()
    if (!rootEntityId) return 'noop'

    const stored = readEntityUpdateCursor(rootEntityId)
    let result: GetEntityUpdatesResult
    try {
        result = await fetchEntityUpdates({
            rootEntityId,
            after: stored,
        })
    } catch {
        return 'noop'
    }

    const decision = decideCatchupAction(result)

    if (decision === 'fullReconcile') {
        clearEntityUpdateCursor(rootEntityId)
        await refreshEntitySubtree(dispatch, {
            entityId: rootEntityId,
            reloadView: options.reloadView,
            lang: options.lang,
        })
        await seedCursorAfterReconcile(rootEntityId)
        return decision
    }

    if (decision === 'refreshDelta') {
        await refreshEntitySubtree(dispatch, {
            entityId: rootEntityId,
            reloadView: options.reloadView,
            lang: options.lang,
        })
    }

    if (result.nextCursor) {
        writeEntityUpdateCursor(rootEntityId, result.nextCursor)
    }

    return decision
}

/** After full reconcile, tip the cursor without another GetEntities. */
async function seedCursorAfterReconcile(rootEntityId: string): Promise<void> {
    try {
        const tip = await fetchEntityUpdates({ rootEntityId, after: null })
        if (tip.requiresFullReconcile) {
            clearEntityUpdateCursor(rootEntityId)
            return
        }
        if (tip.nextCursor) {
            writeEntityUpdateCursor(rootEntityId, tip.nextCursor)
        } else {
            clearEntityUpdateCursor(rootEntityId)
        }
    } catch {
        clearEntityUpdateCursor(rootEntityId)
    }
}
