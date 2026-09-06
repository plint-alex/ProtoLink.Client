import axios from '../utility/customAxios'

const AVATAR_PREFIX = 'avatar:'

type EntityLike = {
    id?: string
    Id?: string
    code?: string
    Code?: string
    values?: Array<{
        value?: unknown
        Value?: unknown
        parents?: string[]
        Parents?: string[]
    }>
    Values?: Array<{
        value?: unknown
        Value?: unknown
        parents?: string[]
        Parents?: string[]
    }>
}

function valueText(v: EntityLike['values'] extends (infer U)[] | undefined ? U : never): string {
    if (!v) return ''
    let val: unknown = v.value != null ? v.value : v.Value
    if (val && typeof val === 'object' && val !== null && 'value' in (val as object)) {
        val = (val as { value?: unknown }).value
    }
    return val != null ? String(val) : ''
}

function parseAvatarFileId(values: EntityLike['values']): string | null {
    const list = values || []
    for (let i = 0; i < list.length; i++) {
        const s = valueText(list[i])
        if (s.indexOf(AVATAR_PREFIX) === 0) {
            const id = s.substring(AVATAR_PREFIX.length).trim()
            if (id) return id
        }
    }
    return null
}

/** Preview URL for toolbar / lists (inscribed resize). */
export function buildAvatarPreviewUrl(fileId: string, size = 128): string {
    return (
        '/api/Files/getImage/' +
        encodeURIComponent(String(fileId)) +
        '/avatar?width=' +
        encodeURIComponent(String(size)) +
        '&height=' +
        encodeURIComponent(String(size))
    )
}

/**
 * Resolve signed-in (or any) user's Profile host avatar:{CloudFileId} pointer.
 */
export async function resolveUserAvatarUrl(
    userId: string,
    size = 128
): Promise<string | null> {
    if (!userId) return null
    try {
        const response = await axios.post('/api/entities/getEntities', {
            parentIds: [userId],
            skip: 0,
            take: 200,
            includeValues: true,
        })
        const raw = response.data
        const list: EntityLike[] = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.data)
              ? raw.data
              : []
        const profile = list.find((e) => String(e.code || e.Code) === 'Profile')
        if (!profile) return null
        const fileId = parseAvatarFileId(profile.values || profile.Values)
        if (!fileId) return null
        return buildAvatarPreviewUrl(fileId, size)
    } catch {
        return null
    }
}
