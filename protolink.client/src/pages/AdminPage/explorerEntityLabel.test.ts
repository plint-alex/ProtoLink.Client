import { describe, expect, it } from 'vitest'
import { NAME_TYPE_ENTITY_ID } from '../../constants/cloudEntities'
import { explorerEntityLabel } from './explorerEntityLabel'

describe('explorerEntityLabel', () => {
    it('prefers non-blank code for normal entities', () => {
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

    it('uses name Value when Code is legacy CloudFile discriminator', () => {
        expect(
            explorerEntityLabel({
                id: '2488df86-73c6-49bd-a74f-3af59903e068',
                code: 'CloudFile',
                name: '',
                values: [
                    {
                        value: 'test text file 1.txt',
                        parents: [NAME_TYPE_ENTITY_ID],
                    },
                ],
            })
        ).toBe('test text file 1.txt')
    })

    it('uses Entity.name when CloudFolder has no name Value', () => {
        expect(
            explorerEntityLabel({
                id: 'folder',
                code: 'CloudFolder',
                name: 'My docs',
                values: [],
            })
        ).toBe('My docs')
    })
})
