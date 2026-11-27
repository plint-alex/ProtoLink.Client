/**
 * Admin Explorer delete scope — cascade only the target (+ descendants).
 * Parent-row Remove must unlink via RemoveParent — never DeleteEntity on the parent.
 * Api DeleteEntity does not remove children (E10); client walks depth-first.
 */

export type ExplorerChildRef = { id: string }

export const EXPLORER_ROW_ACTIONS_CLASS = 'explorer-row-actions'

/** Open-entity Delete lives on the Entity form (Update cluster), not Parents/Go-to-root. */
export const OPEN_ENTITY_DELETE_HOST = 'Entity' as const

/** Stable aria-label for open-entity Delete this entity. */
export const OPEN_ENTITY_DELETE_ARIA_LABEL = 'DeleteCurrentEntity'

export function explorerDeleteConfirmMessage(label: string): string {
    const safe = String(label || '').trim() || '—'
    return `Delete "${safe}" and all its descendants? This cannot be undone.`
}

export function explorerUnlinkParentConfirmMessage(label: string): string {
    const safe = String(label || '').trim() || '—'
    return `Unlink parent "${safe}" from this entity? The parent and its other children stay.`
}

/**
 * Parent-row Remove: DeleteRelation only. Never calls DeleteEntity.
 */
export async function unlinkExplorerParent(
    openId: string,
    parentId: string,
    removeParent: (params: { id: string; parentId: string }) => Promise<void>
): Promise<void> {
    await removeParent({ id: openId, parentId })
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
 * Leave the open route only when the deleted entity is the open id.
 * Parent unlink never deletes — do not navigate for parent-row Remove.
 */
export function resolveExplorerAfterDelete(opts: {
    openId: string | undefined
    deletedId: string
    remainingParentIds: string[]
}): ExplorerAfterDelete {
    const { openId, deletedId, remainingParentIds } = opts
    if (openId !== deletedId) {
        return { action: 'stay' }
    }
    const next = remainingParentIds.find((pid) => pid && pid !== deletedId)
    return { action: 'navigate', path: next ? `/explorer/${next}` : '/explorer' }
}
