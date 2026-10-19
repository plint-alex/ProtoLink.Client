import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyText } from './copyText'

describe('copyText', () => {
    afterEach(() => {
        vi.unstubAllGlobals()
        vi.restoreAllMocks()
    })

    it('writes the string via navigator.clipboard', async () => {
        const writeText = vi.fn().mockResolvedValue(undefined)
        vi.stubGlobal('navigator', { clipboard: { writeText } })

        await copyText('8f3a0000-0000-4000-8000-000000000001')

        expect(writeText).toHaveBeenCalledWith('8f3a0000-0000-4000-8000-000000000001')
    })

    it('throws when Clipboard API is missing', async () => {
        vi.stubGlobal('navigator', {})

        await expect(copyText('x')).rejects.toThrow('Clipboard API unavailable')
    })
})
