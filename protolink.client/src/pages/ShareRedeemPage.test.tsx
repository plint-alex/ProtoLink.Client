import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ShareRedeemPage from './ShareRedeemPage'
import { ROUTES, SYSTEM_PAGE_CODES } from '../resources/routes-constants'
import { textCatalogService } from '../services/textCatalogService'
import * as shareSession from '../services/shareSession'

vi.mock('../services/textCatalogService', () => ({
  textCatalogService: {
    loadPageTexts: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('../services/shareSession', async () => {
  const actual = await vi.importActual<typeof import('../services/shareSession')>(
    '../services/shareSession'
  )
  return {
    ...actual,
    redeemShareToken: vi.fn(),
  }
})

vi.mock('../hooks/useNavigationWithParams', () => ({
  useNavigationWithParams: () => mockNavigate,
}))

const mockNavigate = vi.fn()

const SHARE_RU: Record<string, string> = {
  'share-redeem-title': 'Ссылка больше не работает',
}

function renderShare(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={ROUTES.SHARE_ROUTE} element={<ShareRedeemPage />} />
        <Route path="/:id" element={<div>Entity page</div>} />
        <Route path={ROUTES.LOGIN_ROUTE} element={<div>Login</div>} />
        <Route path={ROUTES.HOMEPAGE_ROUTE} element={<div>Home</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ShareRedeemPage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    mockNavigate.mockReset()
    vi.mocked(shareSession.redeemShareToken).mockReset()
    vi.mocked(textCatalogService.loadPageTexts).mockReset()
    vi.mocked(textCatalogService.loadPageTexts).mockResolvedValue({})
  })

  afterEach(() => {
    shareSession.clearShareSession()
    sessionStorage.clear()
  })

  it('redeems, stores session, and replace-navigates to entity (AT-S3, AT-S4)', async () => {
    const entityId = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'
    vi.mocked(shareSession.redeemShareToken).mockResolvedValueOnce({
      ok: true,
      result: {
        accessToken: 'share-jwt',
        expiresAt: '2026-10-20T12:15:00Z',
        entityId,
        entityName: 'Folder',
        shareLinkId: '11111111-2222-3333-4444-555555555555',
        includeSubtree: true,
      },
    })

    renderShare('/share/secret-token-value')

    await waitFor(() => {
      expect(shareSession.redeemShareToken).toHaveBeenCalledWith('secret-token-value')
    })
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(`/${entityId}`, { replace: true })
    })
    expect(shareSession.getShareRawToken()).toBe('secret-token-value')
    expect(shareSession.getShareAccessToken()).toBe('share-jwt')
    expect(screen.queryByText(/this link no longer works/i)).not.toBeInTheDocument()
    expect(textCatalogService.loadPageTexts).toHaveBeenCalledWith(
      expect.objectContaining({
        systemPageCode: SYSTEM_PAGE_CODES.SHARE_REDEEM,
        pathname: '/share/secret-token-value',
      })
    )
  })

  it('shows product link-unavailable wording without token/HTTP (AT-S27)', async () => {
    vi.mocked(shareSession.redeemShareToken).mockResolvedValueOnce({
      ok: false,
      unavailable: true,
    })

    renderShare('/share/bad-token')

    expect(await screen.findByText(/this link no longer works/i)).toBeInTheDocument()
    expect(
      screen.getByText(/may have expired or been turned off/i)
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /go to protolink/i })).toBeInTheDocument()
    expect(screen.queryByText(/bad-token/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/404/i)).not.toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('shows RU copy from catalog when lang=ru-RU', async () => {
    vi.mocked(shareSession.redeemShareToken).mockResolvedValueOnce({
      ok: false,
      unavailable: true,
    })
    vi.mocked(textCatalogService.loadPageTexts).mockResolvedValue(SHARE_RU)

    renderShare('/share/x?lang=ru-RU')

    expect(await screen.findByText(/ссылка больше не работает/i)).toBeInTheDocument()
    expect(textCatalogService.loadPageTexts).toHaveBeenCalledWith(
      expect.objectContaining({
        lang: 'ru-RU',
        systemPageCode: SYSTEM_PAGE_CODES.SHARE_REDEEM,
      })
    )
  })
})
