import axios from '../utility/customAxios'

export type AuthCapabilities = {
    mayClaimUniqueCode: boolean
}

/** Parse GET api/Authentication/capabilities JSON (camel or Pascal). */
export function parseAuthCapabilities(data: unknown): AuthCapabilities {
    const o = data && typeof data === 'object' ? (data as Record<string, unknown>) : {}
    return {
        mayClaimUniqueCode: o.mayClaimUniqueCode === true || o.MayClaimUniqueCode === true,
    }
}

/**
 * Authenticated session capabilities (Phase A vanity claim).
 * Callers must not invent entitlement from admin heuristics.
 */
export async function fetchAuthCapabilities(accessToken: string): Promise<AuthCapabilities> {
    const token = String(accessToken || '').trim()
    if (!token) {
        return { mayClaimUniqueCode: false }
    }
    const response = await axios.get('/api/Authentication/capabilities', {
        headers: { Authorization: 'Bearer ' + token },
    })
    return parseAuthCapabilities(response.data)
}
