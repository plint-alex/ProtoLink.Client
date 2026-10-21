import { describe, expect, it } from 'vitest'
import {
    entityIdFromParameters,
    entityIdFromPathname,
    isDataChangedCommand,
    isHomeEntityPath,
    resolveSubtreeEntityId,
    shouldRefreshOnCommand,
} from './commandsHubRefresh'

const ENTITY = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

describe('commandsHubRefresh', () => {
    it('recognizes data_changed and reconnected', () => {
        expect(isDataChangedCommand('data_changed')).toBe(true)
        expect(isDataChangedCommand('DATA_CHANGED')).toBe(true)
        expect(isDataChangedCommand('message_sent')).toBe(false)
        expect(shouldRefreshOnCommand('data_changed')).toBe(true)
        expect(shouldRefreshOnCommand('reconnected')).toBe(true)
        expect(shouldRefreshOnCommand('message_read')).toBe(false)
    })

    it('reads entity id from command parameters when present', () => {
        expect(entityIdFromParameters({ source: 'cloud_sync' })).toBeNull()
        expect(entityIdFromParameters({ entityId: ENTITY })).toBe(ENTITY)
        expect(entityIdFromParameters({ ParentId: ENTITY })).toBe(ENTITY)
    })

    it('parses entity id from explorer and home paths only', () => {
        expect(entityIdFromPathname(`/explorer/${ENTITY}`)).toBe(ENTITY)
        expect(entityIdFromPathname(`/${ENTITY}`)).toBe(ENTITY)
        expect(entityIdFromPathname(`/${ENTITY}/hello-world`)).toBe(ENTITY)
        expect(entityIdFromPathname(`/${ENTITY}-hello-world`)).toBe(ENTITY)
        expect(entityIdFromPathname('/explorer')).toBeNull()
        expect(entityIdFromPathname('/login')).toBeNull()
        expect(entityIdFromPathname('/confirm-email')).toBeNull()
        expect(entityIdFromPathname('/register')).toBeNull()
        expect(entityIdFromPathname('/share/token')).toBeNull()
        expect(entityIdFromPathname('/')).toBeNull()
        expect(isHomeEntityPath(`/${ENTITY}`)).toBe(true)
        expect(isHomeEntityPath(`/${ENTITY}/hello-world`)).toBe(true)
        expect(isHomeEntityPath(`/${ENTITY}-hello-world`)).toBe(true)
        expect(isHomeEntityPath(`/explorer/${ENTITY}`)).toBe(false)
    })

    it('prefers payload entity id over the route', () => {
        const fromPayload = '11111111-2222-3333-4444-555555555555'
        expect(
            resolveSubtreeEntityId({ entityId: fromPayload }, `/explorer/${ENTITY}`)
        ).toBe(fromPayload)
        expect(resolveSubtreeEntityId({ source: 'cloud_sync' }, `/explorer/${ENTITY}`)).toBe(
            ENTITY
        )
    })
})
