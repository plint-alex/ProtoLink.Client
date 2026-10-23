import { describe, it, expect, vi, afterEach } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import NotFoundPage from './pages/NotFoundPage'
import EntityHomeRoute from './components/EntityHomeRoute'
import { createTestStore } from './test/createTestStore'
import { ROUTES } from './resources/routes-constants'
import { parseEntityIdFromSegment } from './services/search/searchHelpers'

vi.mock('./services/textCatalogService', () => ({
  textCatalogService: {
    loadPageTexts: vi.fn().mockResolvedValue({}),
  },
}))

const ENTITY = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

function EntityProbe() {
  const { id } = useParams<{ id?: string }>()
  const entityId = parseEntityIdFromSegment(id) ?? 'none'
  return <div>Entity home:{entityId}</div>
}

/** Mirrors RootComponent static + entity + catch-all (no Layout / AdminPage / BrowserRouter). */
function renderRouter(path: string) {
  return render(
    <Provider store={createTestStore()}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path={ROUTES.LOGIN_ROUTE} element={<LoginPage />} />
          <Route path={ROUTES.FORGOT_PASSWORD_ROUTE} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.RESET_PASSWORD_ROUTE} element={<ResetPasswordPage />} />
          <Route path={ROUTES.SHARE_ROUTE} element={<div>Share redeem</div>} />
          <Route path="/:id/*" element={<EntityHomeRoute />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  )
}

function renderEntityProbe(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={ROUTES.LOGIN_ROUTE} element={<LoginPage />} />
        <Route path="/:id/*" element={<EntityProbe />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('router smoke', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders Sign in heading on /login', async () => {
    renderRouter('/login')
    expect(await screen.findByRole('heading', { name: /sign in/i })).toBeInTheDocument()
  })

  it('keeps /share/:token off the entity catch-all', async () => {
    renderRouter('/share/sample-token')
    expect(await screen.findByText('Share redeem')).toBeInTheDocument()
  })

  it('keeps /forgot-password and /reset-password off the entity catch-all', async () => {
    renderRouter(ROUTES.FORGOT_PASSWORD_ROUTE)
    expect(await screen.findByRole('heading', { name: /forgot password/i })).toBeInTheDocument()
    cleanup()
    renderRouter(
      `${ROUTES.RESET_PASSWORD_ROUTE}?userId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&token=tok`
    )
    expect(await screen.findByRole('heading', { name: /choose a new password/i })).toBeInTheDocument()
  })

  it('shows Forgot password link on /login', async () => {
    renderRouter('/login')
    expect(await screen.findByRole('button', { name: /forgot password/i })).toBeInTheDocument()
  })

  it('renders Oops 404 for unmatched multi-segment path', async () => {
    renderRouter('/does/not/match')
    expect(await screen.findByRole('heading', { name: /oops 404/i })).toBeInTheDocument()
  })

  it('loads the same entity for /{id}, /{id}/slug, and /{id}-slug', async () => {
    for (const path of [`/${ENTITY}`, `/${ENTITY}/hello-world`, `/${ENTITY}-hello-world`]) {
      cleanup()
      renderEntityProbe(path)
      expect(await screen.findByText(`Entity home:${ENTITY}`)).toBeInTheDocument()
    }
  })
})
