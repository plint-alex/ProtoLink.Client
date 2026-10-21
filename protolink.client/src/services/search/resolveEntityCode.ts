import axios from '../../utility/customAxios'
import { isGuid } from './searchHelpers'

/**
 * D4: resolve a unique Code to entity id via GET /api/entities/ResolveCode/{code}.
 * Returns null for unknown / non-unique / unreadable codes (API 404).
 */
export async function resolveEntityCode(code: string): Promise<string | null> {
    const trimmed = String(code || '').trim()
    if (!trimmed) return null
    if (isGuid(trimmed)) return trimmed.toLowerCase()
    try {
        const response = await axios.get<{ id?: string; Id?: string }>(
            `/api/entities/ResolveCode/${encodeURIComponent(trimmed)}`
        )
        const id = response.data?.id ?? response.data?.Id
        return id && isGuid(String(id)) ? String(id) : null
    } catch {
        return null
    }
}
