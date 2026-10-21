import axios from 'axios'

export type AppVersionPayload = {
    api?: {
        version?: string | null
        buildDate?: string | null
        framework?: string | null
    }
    client?: {
        version?: string | null
        builtUtc?: string | null
    }
}

export type ResolvedAppVersions = {
    clientVersion: string
    apiVersion: string | null
    clientBuiltUtc: string | null
    apiBuildDate: string | null
}

const MISSING_CLIENT_MARKER = 'Not deployed'

/**
 * Anonymous GET api/Version — plain axios (no customAxios auth redirects).
 */
export async function fetchAppVersions(): Promise<AppVersionPayload> {
    const response = await axios.get<AppVersionPayload>('/api/Version', {
        headers: { Accept: 'application/json' },
        validateStatus: (status) => status === 200,
    })
    return response.data
}

export function resolveAppVersions(
    payload: AppVersionPayload | null | undefined,
    buildTimeClientVersion: string
): ResolvedAppVersions {
    const rawClient = (payload?.client?.version ?? '').trim()
    const clientFromApi =
        rawClient && !rawClient.includes(MISSING_CLIENT_MARKER) ? rawClient : null
    const apiVersion = (payload?.api?.version ?? '').trim() || null
    return {
        clientVersion: clientFromApi ?? buildTimeClientVersion,
        apiVersion,
        clientBuiltUtc: (payload?.client?.builtUtc ?? '').trim() || null,
        apiBuildDate: (payload?.api?.buildDate ?? '').trim() || null,
    }
}

/** Caption for the header, e.g. `client 1.0.52 · api 1.0.48`. */
export function formatVersionCaption(resolved: ResolvedAppVersions): string {
    if (resolved.apiVersion) {
        return `client ${resolved.clientVersion} · api ${resolved.apiVersion}`
    }
    return `client ${resolved.clientVersion}`
}

/** Tooltip with optional build dates from the Version payload. */
export function formatVersionTooltip(resolved: ResolvedAppVersions): string {
    const parts: string[] = [`client ${resolved.clientVersion}`]
    if (resolved.clientBuiltUtc) {
        parts[0] += ` (built ${resolved.clientBuiltUtc})`
    }
    if (resolved.apiVersion) {
        let api = `api ${resolved.apiVersion}`
        if (resolved.apiBuildDate) {
            api += ` (built ${resolved.apiBuildDate})`
        }
        parts.push(api)
    }
    return parts.join(' · ')
}
