import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CustomAxios from './customAxios'
import { setAuthentication } from '../store/actions/authentication'
import { persistor, store } from '../store/store'
import {
    clearShareSession,
    persistShareSession,
} from '../services/shareSession'

function unauthorizedAdapter(config: InternalAxiosRequestConfig) {
    return Promise.reject(
        new AxiosError(
            'Unauthorized',
            'ERR_BAD_REQUEST',
            config,
            {},
            {
                status: 401,
                data: {},
                headers: {},
                statusText: 'Unauthorized',
                config,
            }
        )
    )
}

describe('customAxios 401 clears user session (not guest-only)', () => {
    let navigatedTo: string | null
    let previousAdapter: typeof CustomAxios.defaults.adapter

    beforeEach(async () => {
        navigatedTo = null
        clearShareSession()
        sessionStorage.clear()
        store.dispatch(setAuthentication(null))
        await persistor.flush()
        previousAdapter = CustomAxios.defaults.adapter
        CustomAxios.defaults.adapter = unauthorizedAdapter

        Object.defineProperty(window, 'location', {
            configurable: true,
            value: {
                get href() {
                    return navigatedTo ?? 'https://protolink.ru/notes/x?lang=en-US'
                },
                set href(v: string) {
                    navigatedTo = v
                },
                pathname: '/notes/x',
                search: '?lang=en-US',
                origin: 'https://protolink.ru',
                replace(v: string) {
                    navigatedTo = v
                },
            },
        })
    })

    afterEach(async () => {
        CustomAxios.defaults.adapter = previousAdapter
        clearShareSession()
        sessionStorage.clear()
        store.dispatch(setAuthentication(null))
        await persistor.flush()
        vi.restoreAllMocks()
    })

    it('401 with persisted user token clears auth and navigates to login', async () => {
        store.dispatch(
            setAuthentication({
                userId: 'u1',
                login: 'user',
                userName: 'User',
                giveinPlaceId: 0,
                accessToken: 'dead-jwt',
                refreshToken: 'r',
                expirationTime: '2020-01-01T00:00:00.000Z',
                idleTimeout: 0,
                errorFields: [],
                error: '',
            })
        )
        await persistor.flush()

        await expect(CustomAxios.get('/api/ping')).rejects.toBeTruthy()
        expect(store.getState().authentication.accessToken).toBe('')
        expect(navigatedTo).toMatch(/^\/login\?logout&returnurl=/)
    })

    it('401 with share raw token and no user JWT does not navigate to login', async () => {
        persistShareSession('raw-guest', {
            accessToken: 'share-jwt',
            expiresAt: '2026-10-20T10:00:00Z',
            entityId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
            shareLinkId: '11111111-2222-3333-4444-555555555555',
            includeSubtree: true,
        })

        const axios = await import('axios')
        vi.spyOn(axios.default, 'post').mockRejectedValueOnce({
            response: { status: 401 },
        })

        await expect(CustomAxios.get('/api/ping')).rejects.toBeTruthy()
        expect(navigatedTo).toBeNull()
        expect(store.getState().authentication.accessToken).toBe('')
    })
})
