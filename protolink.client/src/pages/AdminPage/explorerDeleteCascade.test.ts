import { describe, expect, it, vi } from 'vitest'
import {
    EXPLORER_ROW_ACTIONS_CLASS,
    OPEN_ENTITY_DELETE_ARIA_LABEL,
    OPEN_ENTITY_DELETE_HOST,
    deleteEntitySubtree,
    explorerDeleteConfirmMessage,
    explorerUnlinkParentConfirmMessage,
    resolveExplorerAfterDelete,
    unlinkExplorerParent,
} from './explorerDeleteCascade'

describe('EXPLORER_ROW_ACTIONS_CLASS', () => {
    it('is a stable class name for hover CSS', () => {
        expect(EXPLORER_ROW_ACTIONS_CLASS).toBe('explorer-row-actions')
    })
})

describe('open-entity Delete placement contract', () => {
    it('hosts DeleteCurrentEntity on Entity form (Update cluster), not Parents', () => {
        expect(OPEN_ENTITY_DELETE_HOST).toBe('Entity')
        expect(OPEN_ENTITY_DELETE_ARIA_LABEL).toBe('DeleteCurrentEntity')
    })
})

describe('explorerDeleteConfirmMessage', () => {
    it('includes label and warns about descendants', () => {
        const msg = explorerDeleteConfirmMessage('My folder')
        expect(msg).toContain('My folder')
        expect(msg.toLowerCase()).toContain('descendant')
        expect(msg.toLowerCase()).toContain('delete')
    })

    it('uses em dash when label blank', () => {
        expect(explorerDeleteConfirmMessage('  ')).toContain('—')
    })
})

describe('explorerUnlinkParentConfirmMessage', () => {
    it('says unlink and that parent/siblings stay', () => {
        const msg = explorerUnlinkParentConfirmMessage('Parent A')
        expect(msg).toContain('Parent A')
        expect(msg.toLowerCase()).toContain('unlink')
        expect(msg.toLowerCase()).toContain('stay')
        expect(msg.toLowerCase()).not.toContain('descendant')
    })
})

describe('unlinkExplorerParent', () => {
    it('calls removeParent only — never deleteEntity', async () => {
        const removeParent = vi.fn().mockResolvedValue(undefined)
        const deleteEntity = vi.fn()

        await unlinkExplorerParent('open', 'parent', removeParent)

        expect(removeParent).toHaveBeenCalledTimes(1)
        expect(removeParent).toHaveBeenCalledWith({ id: 'open', parentId: 'parent' })
        expect(deleteEntity).not.toHaveBeenCalled()
    })
})

describe('resolveExplorerAfterDelete', () => {
    it('stays when deleting a child of the open route', () => {
        expect(
            resolveExplorerAfterDelete({
                openId: 'open',
                deletedId: 'child',
                remainingParentIds: ['p1'],
            })
        ).toEqual({ action: 'stay' })
    })

    it('stays when a parent id is passed but open was not deleted (unlink case)', () => {
        expect(
            resolveExplorerAfterDelete({
                openId: 'open',
                deletedId: 'p1',
                remainingParentIds: ['p2'],
            })
        ).toEqual({ action: 'stay' })
    })

    it('navigates to remaining parent when open id deleted', () => {
        expect(
            resolveExplorerAfterDelete({
                openId: 'open',
                deletedId: 'open',
                remainingParentIds: ['p1', 'p2'],
            })
        ).toEqual({ action: 'navigate', path: '/explorer/p1' })
    })

    it('navigates to /explorer when open id deleted and no parents left', () => {
        expect(
            resolveExplorerAfterDelete({
                openId: 'open',
                deletedId: 'open',
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
