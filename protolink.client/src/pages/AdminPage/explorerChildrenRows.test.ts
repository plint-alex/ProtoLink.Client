import { describe, expect, it } from 'vitest'
import { CLOUD_FILE_CODE, CLOUD_FILE_TYPE_ENTITY_ID } from '../../constants/cloudEntities'
import { explorerChildrenRows, isExplorerCloudFileEntity } from './explorerChildrenRows'

describe('isExplorerCloudFileEntity', () => {
    it('detects typeCloudFile TypeEntityId', () => {
        expect(
            isExplorerCloudFileEntity({
                id: 'f1',
                code: 'notes.txt',
                typeEntityId: CLOUD_FILE_TYPE_ENTITY_ID,
            })
        ).toBe(true)
    })

    it('detects legacy CloudFile Code', () => {
        expect(
            isExplorerCloudFileEntity({ id: 'f1', code: CLOUD_FILE_CODE, typeEntityId: null })
        ).toBe(true)
    })

    it('rejects folders', () => {
        expect(
            isExplorerCloudFileEntity({ id: 'd1', code: 'CloudFolder', typeEntityId: null })
        ).toBe(false)
    })
})

describe('explorerChildrenRows', () => {
    const file = {
        id: '2488df86-73c6-49bd-a74f-3af59903e068',
        code: CLOUD_FILE_CODE,
        typeEntityId: CLOUD_FILE_TYPE_ENTITY_ID,
    }

    it('surfaces open CloudFile when Api children empty', () => {
        expect(explorerChildrenRows(file, [])).toEqual([file])
    })

    it('does not duplicate when child list already contains open id', () => {
        expect(explorerChildrenRows(file, [file])).toEqual([file])
    })

    it('leaves folder children unchanged when open is not a CloudFile', () => {
        const folder = { id: 'folder', code: 'CloudFolder', typeEntityId: null }
        const child = { id: 'c1', code: CLOUD_FILE_CODE, typeEntityId: CLOUD_FILE_TYPE_ENTITY_ID }
        expect(explorerChildrenRows(folder, [child])).toEqual([child])
    })

    it('prepends open CloudFile ahead of other children', () => {
        const other = { id: 'other', code: 'x', typeEntityId: null }
        expect(explorerChildrenRows(file, [other])).toEqual([file, other])
    })
})
