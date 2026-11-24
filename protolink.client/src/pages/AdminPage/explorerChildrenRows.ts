/**
 * Admin Explorer Children rows — when the open entity is a CloudFile leaf,
 * GetEntities(parentIds:[openId]) is correctly empty; still surface the file
 * so humans can see the entity “has a file”.
 */

import { CLOUD_FILE_CODE, CLOUD_FILE_TYPE_ENTITY_ID } from '../../constants/cloudEntities'

export type ExplorerEntityRef = {
    id: string
    code?: string | null
    typeEntityId?: string | null
}

export function isExplorerCloudFileEntity(entity: ExplorerEntityRef | null | undefined): boolean {
    if (!entity?.id) return false
    const typeId = String(entity.typeEntityId || '').trim().toLowerCase()
    if (typeId === CLOUD_FILE_TYPE_ENTITY_ID.toLowerCase()) return true
    const code = String(entity.code || '').trim()
    return code.localeCompare(CLOUD_FILE_CODE, undefined, { sensitivity: 'accent' }) === 0
}

/**
 * Children table rows for the open explorer id.
 * If open is a CloudFile and Api children omit it (leaf), prepend the open entity.
 */
export function explorerChildrenRows<T extends ExplorerEntityRef>(
    openEntity: T | null | undefined,
    children: T[] | null | undefined
): T[] {
    const list = Array.isArray(children) ? [...children] : []
    if (!openEntity?.id || !isExplorerCloudFileEntity(openEntity)) {
        return list
    }
    if (list.some((row) => row.id === openEntity.id)) {
        return list
    }
    return [openEntity, ...list]
}
