import { describe, expect, it } from 'vitest'
import {
    PUBLIC_ENTITY_ID,
    buildOwnerAndPublicReadPermissions,
} from './cloudEntities'

describe('buildOwnerAndPublicReadPermissions', () => {
    const owner = 'a52b6095-7952-4535-90a1-ce8bdaf7f9c7'

    it('includes owner write and public read (avatar CloudFile grant)', () => {
        const perms = buildOwnerAndPublicReadPermissions(owner)
        expect(perms).toHaveLength(2)
        expect(perms[0]).toMatchObject({ permissionForId: owner, canWrite: true })
        expect(perms[1]).toMatchObject({
            permissionForId: PUBLIC_ENTITY_ID,
            canWrite: false,
        })
    })

    it('rejects empty owner', () => {
        expect(() => buildOwnerAndPublicReadPermissions('')).toThrow(/ownerUserId required/)
    })
})
