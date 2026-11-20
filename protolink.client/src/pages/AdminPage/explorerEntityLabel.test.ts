import { describe, expect, it } from 'vitest'
import { explorerEntityLabel } from './explorerEntityLabel'

describe('explorerEntityLabel', () => {
    it('prefers non-blank code', () => {
        expect(
            explorerEntityLabel({ id: 'guid', code: 'MyCloud', name: 'Display' })
        ).toBe('MyCloud')
    })

    it('uses display name when code blank', () => {
        expect(
            explorerEntityLabel({ id: 'guid', code: '  ', name: 'Android My Cloud' })
        ).toBe('Android My Cloud')
    })

    it('falls back to id when code and name blank', () => {
        expect(explorerEntityLabel({ id: 'ba9266e9-ac45-46f3-9b6d-cdde2f4e2d35', code: '' })).toBe(
            'ba9266e9-ac45-46f3-9b6d-cdde2f4e2d35'
        )
    })
})
