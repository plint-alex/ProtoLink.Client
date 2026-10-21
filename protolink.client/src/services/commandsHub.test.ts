import { describe, expect, it } from 'vitest'
import { __commandsHubTest } from './commandsHub'

describe('commandsHub message parsing', () => {
    it('reads camelCase and PascalCase commandType', () => {
        expect(__commandsHubTest.getCommandType({ commandType: 'data_changed' })).toBe(
            'data_changed'
        )
        expect(__commandsHubTest.getCommandType({ CommandType: 'message_sent' })).toBe(
            'message_sent'
        )
        expect(__commandsHubTest.getCommandType('raw')).toBe('raw')
        expect(__commandsHubTest.getCommandType(null)).toBeNull()
    })

    it('reads parameters from either casing', () => {
        expect(__commandsHubTest.getParameters({ parameters: { source: 'cloud_sync' } })).toEqual({
            source: 'cloud_sync',
        })
        expect(__commandsHubTest.getParameters({ Parameters: { entityId: 'x' } })).toEqual({
            entityId: 'x',
        })
        expect(__commandsHubTest.getParameters('raw')).toBeNull()
    })

    it('uses the same-origin hub path', () => {
        expect(__commandsHubTest.HUB_PATH).toBe('/hubs/commands')
    })
})
