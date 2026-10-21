import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from '../../../utility/customAxios'
import { PUBLIC_ENTITY_ID } from '../../../constants/cloudEntities'
import { addFile } from './files'

vi.mock('../../../utility/customAxios', () => ({
    default: {
        post: vi.fn(),
    },
}))

describe('addFile publicRead grant', () => {
    const owner = 'a52b6095-7952-4535-90a1-ce8bdaf7f9c7'
    const folderId = '11111111-1111-1111-1111-111111111111'
    const cloudFileId = '22222222-2222-2222-2222-222222222222'

    beforeEach(() => {
        vi.mocked(axios.post).mockReset()
    })

    it('omits permissions by default (private CloudFile)', async () => {
        vi.mocked(axios.post)
            .mockResolvedValueOnce({ data: { id: cloudFileId } })
            .mockResolvedValueOnce({ data: { Success: 'ok' } })

        const file = new File([new Uint8Array([1, 2, 3])], 'secret.bin', {
            type: 'application/octet-stream',
        })
        await addFile({ entityId: folderId, file })(vi.fn(), () => ({}), undefined)

        const addEntityBody = vi.mocked(axios.post).mock.calls[0][1] as Record<string, unknown>
        expect(addEntityBody.permissions).toBeUndefined()
    })

    it('sends owner write + public read when publicRead is true', async () => {
        vi.mocked(axios.post)
            .mockResolvedValueOnce({ data: { id: cloudFileId } })
            .mockResolvedValueOnce({ data: { Success: 'ok' } })

        const file = new File([new Uint8Array([1, 2, 3])], 'avatar.jpg', {
            type: 'image/jpeg',
        })
        await addFile({
            entityId: folderId,
            file,
            publicRead: true,
            ownerUserId: owner,
        })(vi.fn(), () => ({}), undefined)

        const addEntityBody = vi.mocked(axios.post).mock.calls[0][1] as {
            permissions?: Array<{ permissionForId: string; canWrite: boolean }>
        }
        expect(addEntityBody.permissions).toEqual([
            { id: expect.any(String), permissionForId: owner, canWrite: true },
            {
                id: expect.any(String),
                permissionForId: PUBLIC_ENTITY_ID,
                canWrite: false,
            },
        ])
    })
})
