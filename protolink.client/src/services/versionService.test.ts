import { afterEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import {
    fetchAppVersions,
    formatVersionCaption,
    formatVersionTooltip,
    resolveAppVersions,
} from './versionService'

vi.mock('axios', () => ({
    default: {
        get: vi.fn(),
    },
}))

describe('resolveAppVersions', () => {
    it('prefers live client and api versions', () => {
        const resolved = resolveAppVersions(
            {
                api: { version: '1.0.48', buildDate: '2026-10-20 01:00:00' },
                client: { version: '1.0.52', builtUtc: '2026-10-20T02:00:00Z' },
            },
            '1.0.50'
        )
        expect(resolved).toEqual({
            clientVersion: '1.0.52',
            apiVersion: '1.0.48',
            clientBuiltUtc: '2026-10-20T02:00:00Z',
            apiBuildDate: '2026-10-20 01:00:00',
        })
    })

    it('falls back to build-time client when wwwroot version.json is missing', () => {
        const resolved = resolveAppVersions(
            {
                api: { version: '1.0.48' },
                client: { version: 'Not deployed (missing wwwroot/version.json)' },
            },
            '1.0.54'
        )
        expect(resolved.clientVersion).toBe('1.0.54')
        expect(resolved.apiVersion).toBe('1.0.48')
    })

    it('falls back to build-time when payload is empty', () => {
        const resolved = resolveAppVersions(null, '1.0.54')
        expect(resolved.clientVersion).toBe('1.0.54')
        expect(resolved.apiVersion).toBeNull()
    })
})

describe('formatVersionCaption / tooltip', () => {
    it('formats both versions for the header caption', () => {
        expect(
            formatVersionCaption({
                clientVersion: '1.0.52',
                apiVersion: '1.0.48',
                clientBuiltUtc: null,
                apiBuildDate: null,
            })
        ).toBe('client 1.0.52 · api 1.0.48')
    })

    it('omits api when unavailable', () => {
        expect(
            formatVersionCaption({
                clientVersion: '1.0.54',
                apiVersion: null,
                clientBuiltUtc: null,
                apiBuildDate: null,
            })
        ).toBe('client 1.0.54')
    })

    it('includes build dates in the tooltip when present', () => {
        expect(
            formatVersionTooltip({
                clientVersion: '1.0.52',
                apiVersion: '1.0.48',
                clientBuiltUtc: '2026-10-20T02:00:00Z',
                apiBuildDate: '2026-10-20 01:00:00',
            })
        ).toBe(
            'client 1.0.52 (built 2026-10-20T02:00:00Z) · api 1.0.48 (built 2026-10-20 01:00:00)'
        )
    })
})

describe('fetchAppVersions', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('GETs /api/Version anonymously', async () => {
        const payload = {
            api: { version: '1.0.48' },
            client: { version: '1.0.52' },
        }
        vi.mocked(axios.get).mockResolvedValue({ data: payload, status: 200 })

        await expect(fetchAppVersions()).resolves.toEqual(payload)
        expect(axios.get).toHaveBeenCalledWith(
            '/api/Version',
            expect.objectContaining({
                headers: { Accept: 'application/json' },
            })
        )
    })
})
