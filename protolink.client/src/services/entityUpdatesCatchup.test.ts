import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios from '../utility/customAxios'
import {
    clearEntityUpdateCursor,
    readEntityUpdateCursor,
    writeEntityUpdateCursor,
} from './entityUpdateCursorStore'
import { catchUpEntityUpdates, decideCatchupAction } from './entityUpdatesCatchup'

vi.mock('../utility/customAxios', () => ({
    default: {
        post: vi.fn(),
        get: vi.fn(),
    },
}))

vi.mock('./commandsHubRefresh', () => ({
    refreshEntitySubtree: vi.fn().mockResolvedValue(undefined),
}))

import { refreshEntitySubtree } from './commandsHubRefresh'

const ROOT = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
const CURSOR_ID = '11111111-2222-3333-4444-555555555555'

describe('decideCatchupAction', () => {
    it('returns fullReconcile when RequiresFullReconcile', () => {
        expect(
            decideCatchupAction({
                requiresFullReconcile: true,
                changes: [{ id: 'x' }],
            })
        ).toBe('fullReconcile')
        expect(
            decideCatchupAction({
                requiresFullReconcile: true,
                changes: [],
            })
        ).toBe('fullReconcile')
    })

    it('returns noop for empty changes (no extra GetEntities)', () => {
        expect(
            decideCatchupAction({
                requiresFullReconcile: false,
                changes: [],
            })
        ).toBe('noop')
    })

    it('returns refreshDelta when there are changes', () => {
        expect(
            decideCatchupAction({
                requiresFullReconcile: false,
                changes: [{ id: 'a' }, { id: 'b' }],
            })
        ).toBe('refreshDelta')
    })
})

describe('catchUpEntityUpdates', () => {
    const dispatch = vi.fn()

    beforeEach(() => {
        clearEntityUpdateCursor(ROOT)
        vi.mocked(axios.post).mockReset()
        vi.mocked(refreshEntitySubtree).mockClear()
    })

    afterEach(() => {
        clearEntityUpdateCursor(ROOT)
    })

    it('empty changes: stores NextCursor and does not refresh', async () => {
        writeEntityUpdateCursor(ROOT, {
            timeStamp: '2026-10-01T00:00:00.000Z',
            id: CURSOR_ID,
        })
        vi.mocked(axios.post).mockResolvedValueOnce({
            data: {
                requiresFullReconcile: false,
                changes: [],
                nextCursor: {
                    timeStamp: '2026-10-01T00:00:00.000Z',
                    id: CURSOR_ID,
                },
            },
        })

        const decision = await catchUpEntityUpdates(dispatch as never, {
            rootEntityId: ROOT,
        })

        expect(decision).toBe('noop')
        expect(refreshEntitySubtree).not.toHaveBeenCalled()
        expect(readEntityUpdateCursor(ROOT)?.id).toBe(CURSOR_ID)
    })

    it('RequiresFullReconcile: clears cursor, refreshes, seeds tip cursor', async () => {
        writeEntityUpdateCursor(ROOT, {
            timeStamp: '2020-01-01T00:00:00.000Z',
            id: CURSOR_ID,
        })
        vi.mocked(axios.post)
            .mockResolvedValueOnce({
                data: {
                    requiresFullReconcile: true,
                    changes: [],
                    nextCursor: null,
                },
            })
            .mockResolvedValueOnce({
                data: {
                    requiresFullReconcile: false,
                    changes: [{ id: 'x' }],
                    nextCursor: {
                        timeStamp: '2026-10-20T00:00:00.000Z',
                        id: '99999999-aaaa-bbbb-cccc-dddddddddddd',
                    },
                },
            })

        const decision = await catchUpEntityUpdates(dispatch as never, {
            rootEntityId: ROOT,
            reloadView: true,
        })

        expect(decision).toBe('fullReconcile')
        expect(refreshEntitySubtree).toHaveBeenCalledTimes(1)
        expect(readEntityUpdateCursor(ROOT)).toEqual({
            timeStamp: '2026-10-20T00:00:00.000Z',
            id: '99999999-aaaa-bbbb-cccc-dddddddddddd',
        })
    })
})
