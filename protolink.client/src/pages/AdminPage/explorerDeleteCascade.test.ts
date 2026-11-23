import { describe, expect, it, vi } from 'vitest'
import {
    EXPLORER_ROW_ACTIONS_CLASS,
    deleteEntitySubtree,
    explorerDeleteConfirmMessage,
    resolveExplorerAfterDelete,
} from './explorerDeleteCascade'

describe('EXPLORER_ROW_ACTIONS_CLASS', () => {
    it('is a stable class name for hover CSS', () => {
        expect(EXPLORER_ROW_ACTIONS_CLASS).toBe('explorer-row-actions')
    })
})

describe('explorerDeleteConfirmMessage', () => {
    it('includes label and warns about descendants', () => {
        const msg = explorerDeleteConfirmMessage('My folder')
        expect(msg).toContain('My folder')
        expect(msg.toLowerCase()).toContain('descendant')
    })

    it('uses em dash when label blank', () => {
        expect(explorerDeleteConfirmMessage('  ')).toContain('—')
    })
})

describe('resolveExplorerAfterDelete', () => {
    it('stays when deleting a child of the open route', () => {
        expect(
            resolveExplorerAfterDelete({
                openId: 'open',
                deletedId: 'child',
                deletedIsParentOfOpen: false,
                remainingParentIds: ['p1'],
            })
        ).toEqual({ action: 'stay' })
    })

    it('navigates to remaining parent when deleting a parent of open', () => {
        expect(
            resolveExplorerAfterDelete({
                openId: 'open',
                deletedId: 'p1',
                deletedIsParentOfOpen: true,
                remainingParentIds: ['p1', 'p2'],
            })
        ).toEqual({ action: 'navigate', path: '/explorer/p2' })
    })

    it('navigates to /explorer when open id deleted and no parents left', () => {
        expect(
            resolveExplorerAfterDelete({
                openId: 'open',
                deletedId: 'open',
                deletedIsParentOfOpen: false,
                remainingParentIds: [],
            })
        ).toEqual({ action: 'navigate', path: '/explorer' })
    })
})

describe('deleteEntitySubtree', () => {
    it('deletes depth-first then the root', async () => {
        const tree: Record<string, string[]> = {
            root: ['a', 'b'],
            a: ['a1'],
            a1: [],
            b: [],
        }
        const deleted: string[] = []
        await deleteEntitySubtree(
            'root',
            async (id) => (tree[id] || []).map((cid) => ({ id: cid })),
            async (id) => {
                deleted.push(id)
            }
        )
        expect(deleted).toEqual(['a1', 'a', 'b', 'root'])
    })

    it('skips cycles via visited set', async () => {
        const listChildren = vi
            .fn()
            .mockResolvedValueOnce([{ id: 'child' }])
            .mockResolvedValueOnce([{ id: 'root' }])
        const deleteEntity = vi.fn().mockResolvedValue(undefined)

        await deleteEntitySubtree('root', listChildren, deleteEntity)

        expect(deleteEntity.mock.calls.map((c) => c[0])).toEqual(['child', 'root'])
        expect(listChildren).toHaveBeenCalledTimes(2)
    })

    it('skips self-id child rows', async () => {
        const deleted: string[] = []
        await deleteEntitySubtree(
            'solo',
            async () => [{ id: 'solo' }],
            async (id) => {
                deleted.push(id)
            }
        )
        expect(deleted).toEqual(['solo'])
    })
})
