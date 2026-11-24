import {
    LEGACY_CLOUD_DISCRIMINATOR_CODES,
    NAME_TYPE_ENTITY_ID,
} from '../../constants/cloudEntities'

function nameFromValues(
    values:
        | Array<{ value?: unknown; parents?: unknown }>
        | null
        | undefined
): string | null {
    if (!values?.length) return null
    const nameLower = NAME_TYPE_ENTITY_ID.toLowerCase()
    for (const v of values) {
        const parents = v.parents
        const parentIds: string[] = Array.isArray(parents)
            ? parents.map((p) => String(p).toLowerCase())
            : []
        if (!parentIds.includes(nameLower)) continue
        const raw = v.value
        const s =
            typeof raw === 'string'
                ? raw.trim()
                : raw != null && typeof raw === 'object' && 'value' in (raw as object)
                  ? String((raw as { value?: unknown }).value ?? '').trim()
                  : ''
        if (s) return s
    }
    return null
}

/** Admin Explorer row label: file/folder display name → code → Entity.name → id. */
export function explorerEntityLabel(entity: {
    id: string
    code?: string | null
    name?: string | null
    values?: Array<{ value?: unknown; parents?: unknown }> | null
}): string {
    const code = entity.code?.trim() || ''
    const fromValues = nameFromValues(entity.values)
    const displayName = entity.name?.trim() || ''

    // Legacy Cloud* Code is a type discriminator — prefer name Value / Entity.name.
    if (code && LEGACY_CLOUD_DISCRIMINATOR_CODES.has(code)) {
        if (fromValues) return fromValues
        if (displayName) return displayName
        return code
    }

    if (code) return code
    if (fromValues) return fromValues
    if (displayName) return displayName
    return entity.id
}
