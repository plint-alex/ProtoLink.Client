import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import {
  clearShareSession,
  getShareAccessToken,
  getShareRawToken,
  getShareSessionMeta,
  hasShareSession,
  isShareSessionEnded,
  persistShareSession,
  redeemShareToken,
  reRedeemShareSession,
  shouldShowGuestBanner,
  markShareCredentialUsed,
  wasShareCredentialUsed,
} from './shareSession'

vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}))

describe('shareSession', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.mocked(axios.post).mockReset()
  })

  afterEach(() => {
    clearShareSession()
    sessionStorage.clear()
  })

  it('persists raw token + JWT in sessionStorage only (AT-S4 / AT-S9 tab scope)', () => {
    persistShareSession('raw-token-xyz', {
      accessToken: 'share-jwt',
      expiresAt: '2026-10-20T12:00:00Z',
      entityId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      entityName: 'Contract',
      shareLinkId: '11111111-2222-3333-4444-555555555555',
      includeSubtree: true,
    })

    expect(getShareRawToken()).toBe('raw-token-xyz')
    expect(getShareAccessToken()).toBe('share-jwt')
    expect(getShareSessionMeta()?.entityId).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
    expect(hasShareSession()).toBe(true)
    expect(localStorage.getItem('protolink.share.rawToken')).toBeNull()
  })

  it('redeemShareToken stores nothing on link_unavailable (AT-S23)', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      status: 404,
      data: { code: 'link_unavailable', message: 'This link no longer works' },
    })

    const outcome = await redeemShareToken('dead-token')
    expect(outcome.ok).toBe(false)
    expect(hasShareSession()).toBe(false)
  })

  it('reRedeemShareSession refreshes JWT from raw token (AT-S8)', async () => {
    persistShareSession('raw-token', {
      accessToken: 'old-jwt',
      expiresAt: '2026-10-20T10:00:00Z',
      entityId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      shareLinkId: '11111111-2222-3333-4444-555555555555',
      includeSubtree: false,
    })

    vi.mocked(axios.post).mockResolvedValueOnce({
      status: 200,
      data: {
        accessToken: 'new-jwt',
        expiresAt: '2026-10-20T12:15:00Z',
        entityId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        shareLinkId: '11111111-2222-3333-4444-555555555555',
        includeSubtree: false,
      },
    })

    const ok = await reRedeemShareSession()
    expect(ok).toBe(true)
    expect(getShareAccessToken()).toBe('new-jwt')
    expect(isShareSessionEnded()).toBe(false)
  })

  it('reRedeemShareSession clears session and marks ended when link is gone', async () => {
    persistShareSession('raw-token', {
      accessToken: 'old-jwt',
      expiresAt: '2026-10-20T10:00:00Z',
      entityId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      shareLinkId: '11111111-2222-3333-4444-555555555555',
      includeSubtree: false,
    })

    vi.mocked(axios.post).mockResolvedValueOnce({ status: 404, data: {} })

    const ok = await reRedeemShareSession()
    expect(ok).toBe(false)
    expect(hasShareSession()).toBe(false)
    expect(isShareSessionEnded()).toBe(true)
  })

  it('guest banner: anon with session; signed-in only after share credential used', () => {
    expect(shouldShowGuestBanner(false)).toBe(false)

    persistShareSession('raw', {
      accessToken: 'jwt',
      expiresAt: '2026-10-20T12:00:00Z',
      entityId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      shareLinkId: '11111111-2222-3333-4444-555555555555',
      includeSubtree: true,
    })

    expect(shouldShowGuestBanner(false)).toBe(true)
    expect(shouldShowGuestBanner(true)).toBe(false)

    markShareCredentialUsed()
    expect(wasShareCredentialUsed()).toBe(true)
    expect(shouldShowGuestBanner(true)).toBe(true)
  })
})
