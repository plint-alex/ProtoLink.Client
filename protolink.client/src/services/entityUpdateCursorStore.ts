/**
 * Persist GetEntityUpdates cursor per subtree root in sessionStorage.
 * Shape: (TimeStamp, Id) — exclusive lower bound for the next poll.
 */

export type EntityUpdateCursor = {
    timeStamp: string
    id: string
}

const STORAGE_PREFIX = 'protolink.entityUpdateCursor.'

function storageKey(rootEntityId: string): string {
    return `${STORAGE_PREFIX}${rootEntityId.trim().toLowerCase()}`
}

function getSessionStorage(): Storage | null {
    try {
        if (typeof sessionStorage === 'undefined') return null
        return sessionStorage
    } catch {
        return null
    }
}

export function readEntityUpdateCursor(rootEntityId: string): EntityUpdateCursor | null {
    const root = rootEntityId?.trim()
    if (!root) return null
    const storage = getSessionStorage()
    if (!storage) return null
    const raw = storage.getItem(storageKey(root))
    if (!raw) return null
    try {
        const parsed = JSON.parse(raw) as Partial<EntityUpdateCursor>
        const timeStamp = typeof parsed.timeStamp === 'string' ? parsed.timeStamp.trim() : ''
        const id = typeof parsed.id === 'string' ? parsed.id.trim() : ''
        if (!timeStamp || !id) return null
        return { timeStamp, id }
    } catch {
        return null
    }
}

export function writeEntityUpdateCursor(
    rootEntityId: string,
    cursor: EntityUpdateCursor
): void {
    const root = rootEntityId?.trim()
    if (!root) return
    const timeStamp = cursor.timeStamp?.trim()
    const id = cursor.id?.trim()
    if (!timeStamp || !id) return
    const storage = getSessionStorage()
    if (!storage) return
    storage.setItem(storageKey(root), JSON.stringify({ timeStamp, id }))
}

export function clearEntityUpdateCursor(rootEntityId: string): void {
    const root = rootEntityId?.trim()
    if (!root) return
    const storage = getSessionStorage()
    if (!storage) return
    storage.removeItem(storageKey(root))
}

/** Test helper — storage key shape. */
export const __entityUpdateCursorStoreTest = {
    STORAGE_PREFIX,
    storageKey,
}
