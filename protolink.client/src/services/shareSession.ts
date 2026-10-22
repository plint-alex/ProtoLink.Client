/**
 * Guest-link session (S4 / AT-S4, AT-S8, AT-S9).
 * Raw token + share JWT live in sessionStorage only — closing the tab ends the session.
 * Never written into redux auth (signed-in user privilege must not be reduced).
 */

import axios from 'axios'

const RAW_TOKEN_KEY = 'protolink.share.rawToken'
const ACCESS_TOKEN_KEY = 'protolink.share.accessToken'
const META_KEY = 'protolink.share.meta'
const ENDED_KEY = 'protolink.share.ended'
const USED_SHARE_CREDENTIAL_KEY = 'protolink.share.usedShareCredential'

export type ShareSessionMeta = {
    entityId: string
    entityName?: string | null
    shareLinkId?: string
    expiresAt?: string
    includeSubtree?: boolean
}

export type RedeemShareLinkResult = {
    accessToken: string
    expiresAt: string
    entityId: string
    entityName?: string | null
    shareLinkId: string
    includeSubtree: boolean
}

export type RedeemOutcome =
    | { ok: true; result: RedeemShareLinkResult }
    | { ok: false; unavailable: true }

export type AddToSharedWithMeApiResult = {
    entityId: string
    shareLinkId: string
    canWrite: boolean
    includeSubtree: boolean
    alreadyHadGrant: boolean
}

export type AddToSharedWithMeOutcome =
    | { ok: true; result: AddToSharedWithMeApiResult }
    | { ok: false; unavailable: true }
    | { ok: false; unavailable: false }

type ShareSessionListener = () => void
const listeners = new Set<ShareSessionListener>()

function notify(): void {
    listeners.forEach((l) => l())
}

export function subscribeShareSession(listener: ShareSessionListener): () => void {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

function storage(): Storage | null {
    try {
        return typeof sessionStorage !== 'undefined' ? sessionStorage : null
    } catch {
        return null
    }
}

export function getShareRawToken(): string | null {
    return storage()?.getItem(RAW_TOKEN_KEY) || null
}

export function getShareAccessToken(): string | null {
    return storage()?.getItem(ACCESS_TOKEN_KEY) || null
}

export function getShareSessionMeta(): ShareSessionMeta | null {
    const raw = storage()?.getItem(META_KEY)
    if (!raw) return null
    try {
        return JSON.parse(raw) as ShareSessionMeta
    } catch {
        return null
    }
}

export function hasShareSession(): boolean {
    return Boolean(getShareRawToken() && getShareAccessToken())
}

/** True when a share JWT was actually sent on a request (guest, or signed-in fallback). */
export function wasShareCredentialUsed(): boolean {
    return storage()?.getItem(USED_SHARE_CREDENTIAL_KEY) === '1'
}

export function markShareCredentialUsed(): void {
    storage()?.setItem(USED_SHARE_CREDENTIAL_KEY, '1')
    notify()
}

/** Session ended mid-tab (re-redeem failed) — show link-unavailable wording once. */
export function isShareSessionEnded(): boolean {
    return storage()?.getItem(ENDED_KEY) === '1'
}

export function markShareSessionEnded(): void {
    storage()?.setItem(ENDED_KEY, '1')
    notify()
}

export function clearShareSessionEnded(): void {
    storage()?.removeItem(ENDED_KEY)
}

export function persistShareSession(rawToken: string, result: RedeemShareLinkResult): void {
    const s = storage()
    if (!s) return
    s.setItem(RAW_TOKEN_KEY, rawToken)
    s.setItem(ACCESS_TOKEN_KEY, result.accessToken)
    s.setItem(
        META_KEY,
        JSON.stringify({
            entityId: result.entityId,
            entityName: result.entityName ?? null,
            shareLinkId: result.shareLinkId,
            expiresAt: result.expiresAt,
            includeSubtree: result.includeSubtree,
        } satisfies ShareSessionMeta)
    )
    s.removeItem(ENDED_KEY)
    notify()
}

export function clearShareSession(): void {
    const s = storage()
    if (!s) return
    s.removeItem(RAW_TOKEN_KEY)
    s.removeItem(ACCESS_TOKEN_KEY)
    s.removeItem(META_KEY)
    s.removeItem(USED_SHARE_CREDENTIAL_KEY)
    notify()
}

/**
 * UX-LS-3: after Leave Shared with me, drop guest-link session only when it is for that root
 * (stale redeem must not undo Leave). No-op when meta is absent or for a different entity.
 */
export function clearShareSessionIfEntity(entityId: string): boolean {
    const meta = getShareSessionMeta()
    const target = (entityId || '').replace(/-/g, '').toLowerCase()
    const current = (meta?.entityId || '').replace(/-/g, '').toLowerCase()
    if (!target || !current || target !== current) return false
    clearShareSession()
    return true
}

export function updateShareAccessToken(accessToken: string, expiresAt?: string): void {
    const s = storage()
    if (!s) return
    s.setItem(ACCESS_TOKEN_KEY, accessToken)
    const meta = getShareSessionMeta()
    if (meta && expiresAt) {
        s.setItem(META_KEY, JSON.stringify({ ...meta, expiresAt }))
    }
    notify()
}

/** Anonymous redeem — must not go through customAxios (avoids 401 / auth loops). */
export async function redeemShareToken(rawToken: string): Promise<RedeemOutcome> {
    try {
        const response = await axios.post<RedeemShareLinkResult>(
            '/api/Share/Redeem',
            { token: rawToken },
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                // Do not send cookies / user Bearer; redeem is anonymous.
                validateStatus: (status) => status === 200 || status === 404,
            }
        )
        if (response.status === 404) {
            return { ok: false, unavailable: true }
        }
        const data = response.data
        if (!data?.accessToken || !data?.entityId) {
            return { ok: false, unavailable: true }
        }
        return { ok: true, result: data }
    } catch {
        return { ok: false, unavailable: true }
    }
}

/**
 * S6 cycle-2: mint a personal Shared-with-me grant from the raw guest-link token.
 * Must use the signed-in user JWT only — never the share JWT (Api rejects share-only).
 * Does not go through customAxios (avoids 403→share-JWT fallback).
 */
export async function addToSharedWithMe(userAccessToken: string): Promise<AddToSharedWithMeOutcome> {
    const raw = getShareRawToken()
    const user = (userAccessToken || '').trim()
    if (!raw || !user) {
        return { ok: false, unavailable: false }
    }
    try {
        const response = await axios.post<AddToSharedWithMeApiResult>(
            '/api/Share/AddToSharedWithMe',
            { token: raw },
            {
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${user}`,
                },
                validateStatus: (status) => status === 200 || status === 404,
            }
        )
        if (response.status === 404) {
            return { ok: false, unavailable: true }
        }
        const data = response.data
        if (!data?.entityId) {
            return { ok: false, unavailable: false }
        }
        return {
            ok: true,
            result: {
                entityId: data.entityId,
                shareLinkId: data.shareLinkId,
                canWrite: Boolean(data.canWrite),
                includeSubtree: Boolean(data.includeSubtree),
                alreadyHadGrant: Boolean(data.alreadyHadGrant),
            },
        }
    } catch {
        return { ok: false, unavailable: false }
    }
}

let reRedeemInFlight: Promise<boolean> | null = null

/** Silent re-redeem for AT-S8. Returns false when the link is gone — caller must not redirect to login. */
export async function reRedeemShareSession(): Promise<boolean> {
    if (reRedeemInFlight) return reRedeemInFlight

    reRedeemInFlight = (async () => {
        const raw = getShareRawToken()
        if (!raw) return false
        const outcome = await redeemShareToken(raw)
        if (!outcome.ok) {
            clearShareSession()
            markShareSessionEnded()
            return false
        }
        persistShareSession(raw, outcome.result)
        return true
    })()

    try {
        return await reRedeemInFlight
    } finally {
        reRedeemInFlight = null
    }
}

/** Guest banner when share credential is in play (anon guest, or signed-in fallback). */
export function shouldShowGuestBanner(isAuthenticated: boolean): boolean {
    if (!hasShareSession() && !isShareSessionEnded()) return false
    if (!isAuthenticated) return hasShareSession()
    return wasShareCredentialUsed()
}
