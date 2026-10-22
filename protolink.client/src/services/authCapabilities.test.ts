import { describe, expect, it, vi, beforeEach } from 'vitest'
import axios from '../utility/customAxios'
import { fetchAuthCapabilities, parseAuthCapabilities } from './authCapabilities'

vi.mock('../utility/customAxios', () => ({
    default: {
        get: vi.fn(),
    },
}))

describe('parseAuthCapabilities', () => {
    it('reads mayClaimUniqueCode true', () => {
        expect(parseAuthCapabilities({ mayClaimUniqueCode: true })).toEqual({
            mayClaimUniqueCode: true,
        })
    })

    it('reads PascalCase MayClaimUniqueCode', () => {
        expect(parseAuthCapabilities({ MayClaimUniqueCode: true })).toEqual({
            mayClaimUniqueCode: true,
        })
    })

    it('defaults false for missing / false / junk', () => {
        expect(parseAuthCapabilities(null).mayClaimUniqueCode).toBe(false)
        expect(parseAuthCapabilities({ mayClaimUniqueCode: false }).mayClaimUniqueCode).toBe(false)
        expect(parseAuthCapabilities({ mayClaimUniqueCode: 'true' }).mayClaimUniqueCode).toBe(false)
        expect(parseAuthCapabilities({}).mayClaimUniqueCode).toBe(false)
    })
})

describe('fetchAuthCapabilities', () => {
    beforeEach(() => {
        vi.mocked(axios.get).mockReset()
    })

    it('returns false without token and does not call API', async () => {
        await expect(fetchAuthCapabilities('')).resolves.toEqual({ mayClaimUniqueCode: false })
        expect(axios.get).not.toHaveBeenCalled()
    })

    it('GETs capabilities with Bearer token', async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: { mayClaimUniqueCode: true } })
        await expect(fetchAuthCapabilities('tok')).resolves.toEqual({ mayClaimUniqueCode: true })
        expect(axios.get).toHaveBeenCalledWith('/api/Authentication/capabilities', {
            headers: { Authorization: 'Bearer tok' },
        })
    })
})
