/**
 * Admin Explorer E10 cascade — Api DeleteEntity does not remove children.
 * Depth-first: list children (GetEntities ParentIds) → recurse each → then delete self.
 */

export type ExplorerChildRef = { id: string }

export const EXPLORER_ROW_ACTIONS_CLASS = 'explorer-row-actions'

export function explorerDeleteConfirmMessage(label: string): string {
    const safe = String(label || '').trim() || '—'
    return `Remove "${safe}" and all its descendants? This cannot be undone.`
}

/**
 * Pure cascade. Skips self-id child rows and already-visited ids (multi-parent cycles).
 */
export async function deleteEntitySubtree(
    entityId: string,
    listChildren: (parentId: string) => Promise<ExplorerChildRef[]>,
    deleteEntity: (id: string) => Promise<void>,
    visited: Set<string> = new Set()
): Promise<void> {
    if (visited.has(entityId)) {
        return
    }
    visited.add(entityId)

    const children = await listChildren(entityId)
    for (const child of children) {
        if (!child?.id || child.id === entityId || visited.has(child.id)) {
            continue
        }
        await deleteEntitySubtree(child.id, listChildren, deleteEntity, visited)
    }

    await deleteEntity(entityId)
}

export type ExplorerAfterDelete =
    | { action: 'stay' }
    | { action: 'navigate'; path: string }

/**
 * Leave the open route when the deleted entity is the open id or a listed parent
 * (ancestor of the open route — cascade may wipe the open entity).
 */
export function resolveExplorerAfterDelete(opts: {
    openId: string | undefined
    deletedId: string
    deletedIsParentOfOpen: boolean
    remainingParentIds: string[]
}): ExplorerAfterDelete {
    const { openId, deletedId, deletedIsParentOfOpen, remainingParentIds } = opts
    const mustLeave = openId === deletedId || deletedIsParentOfOpen
    if (!mustLeave) {
        return { action: 'stay' }
    }
    const next = remainingParentIds.find((pid) => pid && pid !== deletedId)
    return { action: 'navigate', path: next ? `/explorer/${next}` : '/explorer' }
}
