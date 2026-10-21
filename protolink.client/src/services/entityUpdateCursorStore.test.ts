import { afterEach, describe, expect, it } from 'vitest'
import {
    clearEntityUpdateCursor,
    readEntityUpdateCursor,
    writeEntityUpdateCursor,
    __entityUpdateCursorStoreTest,
} from './entityUpdateCursorStore'

const ROOT = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

describe('entityUpdateCursorStore', () => {
    afterEach(() => {
        clearEntityUpdateCursor(ROOT)
        clearEntityUpdateCursor(ROOT.toUpperCase())
    })

    it('persists and reads (TimeStamp, Id) per root', () => {
        expect(readEntityUpdateCursor(ROOT)).toBeNull()

        writeEntityUpdateCursor(ROOT, {
            timeStamp: '2026-10-19T12:00:00.000Z',
            id: '11111111-2222-3333-4444-555555555555',
        })

        expect(readEntityUpdateCursor(ROOT)).toEqual({
            timeStamp: '2026-10-19T12:00:00.000Z',
            id: '11111111-2222-3333-4444-555555555555',
        })
        // Case-insensitive root key
        expect(readEntityUpdateCursor(ROOT.toUpperCase())).toEqual({
            timeStamp: '2026-10-19T12:00:00.000Z',
            id: '11111111-2222-3333-4444-555555555555',
        })
    })

    it('clears cursor for a root', () => {
        writeEntityUpdateCursor(ROOT, {
            timeStamp: '2026-10-19T12:00:00.000Z',
            id: '11111111-2222-3333-4444-555555555555',
        })
        clearEntityUpdateCursor(ROOT)
        expect(readEntityUpdateCursor(ROOT)).toBeNull()
    })

    it('ignores malformed storage values', () => {
        sessionStorage.setItem(
            __entityUpdateCursorStoreTest.storageKey(ROOT),
            '{not-json'
        )
        expect(readEntityUpdateCursor(ROOT)).toBeNull()

        sessionStorage.setItem(
            __entityUpdateCursorStoreTest.storageKey(ROOT),
            JSON.stringify({ timeStamp: 'x' })
        )
        expect(readEntityUpdateCursor(ROOT)).toBeNull()
    })
})
