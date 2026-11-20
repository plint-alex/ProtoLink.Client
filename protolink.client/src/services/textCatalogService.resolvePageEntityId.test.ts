import { describe, expect, it } from 'vitest'
import { textCatalogService } from './textCatalogService'
import { SYSTEM_PAGE_CODES, SYSTEM_PAGE_ID_BY_CODE } from '../resources/routes-constants'

describe('textCatalogService.resolvePageEntityId', () => {
    it('uses sys-page-explorer-root when routeEntityId omitted (Explorer chrome)', async () => {
        const id = await textCatalogService.resolvePageEntityId({
            lang: 'en-US',
            systemPageCode: SYSTEM_PAGE_CODES.EXPLORER_ROOT,
            pathname: '/explorer/ba9266e9-ac45-46f3-9b6d-cdde2f4e2d35',
        })
        expect(id).toBe(SYSTEM_PAGE_ID_BY_CODE[SYSTEM_PAGE_CODES.EXPLORER_ROOT])
    })

    it('infers explorer root from /explorer/:id pathname without routeEntityId', async () => {
        const id = await textCatalogService.resolvePageEntityId({
            lang: 'en-US',
            pathname: '/explorer/ba9266e9-ac45-46f3-9b6d-cdde2f4e2d35',
        })
        expect(id).toBe(SYSTEM_PAGE_ID_BY_CODE[SYSTEM_PAGE_CODES.EXPLORER_ROOT])
    })

    it('still honors explicit routeEntityId when callers pass it', async () => {
        const entityId = 'ba9266e9-ac45-46f3-9b6d-cdde2f4e2d35'
        const id = await textCatalogService.resolvePageEntityId({
            lang: 'en-US',
            routeEntityId: entityId,
            systemPageCode: SYSTEM_PAGE_CODES.EXPLORER_ROOT,
        })
        expect(id).toBe(entityId)
    })
})
