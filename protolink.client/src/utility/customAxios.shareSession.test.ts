import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  clearShareSession,
  getShareAccessToken,
  persistShareSession,
  reRedeemShareSession,
} from '../services/shareSession'

/**
 * Behaviour contract for AT-S8 (re-redeem) is owned by shareSession;
 * customAxios wires 401 → reRedeemShareSession + retry and must not send guests to /login.
 * This file locks the re-redeem contract the interceptor depends on.
 */
describe('share re-redeem contract used by customAxios (AT-S8)', () => {
  beforeEach(() => {
    sessionStorage.clear()
  })

  afterEach(() => {
    clearShareSession()
    sessionStorage.clear()
    vi.restoreAllMocks()
  })

  it('keeps raw token across JWT refresh so interceptor can retry', async () => {
    persistShareSession('raw-abc', {
      accessToken: 'old',
      expiresAt: '2026-10-20T10:00:00Z',
      entityId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      shareLinkId: '11111111-2222-3333-4444-555555555555',
      includeSubtree: true,
    })

    const axios = await import('axios')
    vi.spyOn(axios.default, 'post').mockResolvedValueOnce({
      status: 200,
      data: {
        accessToken: 'fresh',
        expiresAt: '2026-10-20T12:15:00Z',
        entityId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        shareLinkId: '11111111-2222-3333-4444-555555555555',
        includeSubtree: true,
      },
    })

    const ok = await reRedeemShareSession()
    expect(ok).toBe(true)
    expect(getShareAccessToken()).toBe('fresh')
    expect(sessionStorage.getItem('protolink.share.rawToken')).toBe('raw-abc')
  })
})
