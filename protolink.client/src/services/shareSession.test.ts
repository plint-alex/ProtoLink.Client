import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import {
  addToSharedWithMe,
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

  it('addToSharedWithMe posts raw token with user Bearer (UX-AS / S6)', async () => {
    persistShareSession('guest-raw-token', {
      accessToken: 'share-jwt',
      expiresAt: '2026-10-20T12:00:00Z',
      entityId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      shareLinkId: '11111111-2222-3333-4444-555555555555',
      includeSubtree: true,
    })

    vi.mocked(axios.post).mockResolvedValueOnce({
      status: 200,
      data: {
        entityId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        shareLinkId: '11111111-2222-3333-4444-555555555555',
        canWrite: false,
        includeSubtree: true,
        alreadyHadGrant: false,
      },
    })

    const outcome = await addToSharedWithMe('user-jwt-abc')
    expect(outcome.ok).toBe(true)
    if (outcome.ok) {
      expect(outcome.result.entityId).toBe('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')
      expect(outcome.result.alreadyHadGrant).toBe(false)
    }
    expect(axios.post).toHaveBeenCalledWith(
      '/api/Share/AddToSharedWithMe',
      { token: 'guest-raw-token' },
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer user-jwt-abc',
        }),
      })
    )
  })

  it('addToSharedWithMe treats alreadyHadGrant as success (UX-AS-3)', async () => {
    persistShareSession('guest-raw-token', {
      accessToken: 'share-jwt',
      expiresAt: '2026-10-20T12:00:00Z',
      entityId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      shareLinkId: '11111111-2222-3333-4444-555555555555',
      includeSubtree: false,
    })

    vi.mocked(axios.post).mockResolvedValueOnce({
      status: 200,
      data: {
        entityId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        shareLinkId: '11111111-2222-3333-4444-555555555555',
        canWrite: true,
        includeSubtree: false,
        alreadyHadGrant: true,
      },
    })

    const outcome = await addToSharedWithMe('user-jwt')
    expect(outcome.ok).toBe(true)
    if (outcome.ok) expect(outcome.result.alreadyHadGrant).toBe(true)
  })

  it('addToSharedWithMe maps 404 link_unavailable (UX-AS-4)', async () => {
    persistShareSession('dead-token', {
      accessToken: 'share-jwt',
      expiresAt: '2026-10-20T12:00:00Z',
      entityId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      shareLinkId: '11111111-2222-3333-4444-555555555555',
      includeSubtree: true,
    })

    vi.mocked(axios.post).mockResolvedValueOnce({
      status: 404,
      data: { code: 'link_unavailable', message: 'This link no longer works' },
    })

    const outcome = await addToSharedWithMe('user-jwt')
    expect(outcome).toEqual({ ok: false, unavailable: true })
  })

  it('addToSharedWithMe fails quietly without raw token or user JWT', async () => {
    expect(await addToSharedWithMe('user-jwt')).toEqual({ ok: false, unavailable: false })
    persistShareSession('raw', {
      accessToken: 'share-jwt',
      expiresAt: '2026-10-20T12:00:00Z',
      entityId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      shareLinkId: '11111111-2222-3333-4444-555555555555',
      includeSubtree: true,
    })
    expect(await addToSharedWithMe('')).toEqual({ ok: false, unavailable: false })
    expect(axios.post).not.toHaveBeenCalled()
  })
})
