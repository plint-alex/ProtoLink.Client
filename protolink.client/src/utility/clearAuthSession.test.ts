import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { setAuthentication } from '../store/actions/authentication'
import { store } from '../store/store'
import {
    buildLoginRedirectHref,
    clearPersistedAuth,
    isUserAccessExpired,
} from './clearAuthSession'

describe('clearAuthSession', () => {
    beforeEach(() => {
        store.dispatch(
            setAuthentication({
                userId: 'u1',
                login: 'user',
                userName: 'User',
                giveinPlaceId: 0,
                accessToken: 'stale-jwt',
                refreshToken: 'r',
                expirationTime: '2020-01-01T00:00:00.000Z',
                idleTimeout: 0,
                errorFields: [],
                error: '',
            })
        )
    })

    afterEach(() => {
        store.dispatch(setAuthentication(null))
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it('buildLoginRedirectHref adds logout + returnurl with lang', () => {
        const href = buildLoginRedirectHref('https://protolink.ru/cloud/abc?lang=ru-RU&x=1')
        expect(href).toBe('/login?logout&returnurl=' + encodeURIComponent('/cloud/abc?lang=ru-RU'))
    })

    it('buildLoginRedirectHref on /login keeps logout without looping returnurl', () => {
        const href = buildLoginRedirectHref(
            'https://protolink.ru/login?returnurl=%2Fhome&lang=en-US'
        )
        expect(href).toContain('logout')
        expect(href).toContain('returnurl=')
        expect(href.startsWith('/login?')).toBe(true)
    })

    it('isUserAccessExpired detects past expirationTime', () => {
        expect(isUserAccessExpired('2020-01-01T00:00:00.000Z', Date.parse('2026-10-24T00:00:00Z'))).toBe(
            true
        )
        expect(isUserAccessExpired('2030-01-01T00:00:00.000Z', Date.parse('2026-10-24T00:00:00Z'))).toBe(
            false
        )
        expect(isUserAccessExpired('', Date.now())).toBe(false)
        expect(isUserAccessExpired('not-a-date', Date.now())).toBe(false)
    })

    it('clearPersistedAuth clears accessToken from the store', async () => {
        expect(store.getState().authentication.accessToken).toBe('stale-jwt')
        await clearPersistedAuth()
        expect(store.getState().authentication.accessToken).toBe('')
    })
})
