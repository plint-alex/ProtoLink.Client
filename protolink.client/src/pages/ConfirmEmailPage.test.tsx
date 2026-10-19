import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ConfirmEmailPage from './ConfirmEmailPage'
import { createTestStore } from '../test/createTestStore'
import { ROUTES } from '../resources/routes-constants'
import axios from '../utility/customAxios'

vi.mock('../utility/customAxios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

function renderConfirm(path: string) {
  const store = createTestStore()
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={ROUTES.CONFIRM_EMAIL_ROUTE} element={<ConfirmEmailPage />} />
            <Route path={ROUTES.LOGIN_ROUTE} element={<div>Login screen</div>} />
            <Route path="/:id" element={<div>Home entity page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    ),
  }
}

describe('ConfirmEmailPage', () => {
  beforeEach(() => {
    vi.mocked(axios.get).mockReset()
  })

  it('confirms via API and shows success (EN)', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { ok: true } })

    renderConfirm(
      `${ROUTES.CONFIRM_EMAIL_ROUTE}?userId=6aa1765a-1111-2222-3333-444444444444&token=871d221c-aaaa-bbbb-cccc-dddddddddddd`
    )

    expect(await screen.findByRole('heading', { name: /confirm email/i })).toBeInTheDocument()
    expect(await screen.findByText(/email confirmed/i)).toBeInTheDocument()
    expect(screen.queryByText(/home entity page/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/don't have access/i)).not.toBeInTheDocument()

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        '/api/authentication/confirmEmail/6aa1765a-1111-2222-3333-444444444444/871d221c-aaaa-bbbb-cccc-dddddddddddd'
      )
    })
  })

  it('shows clear error when API returns ok:false', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { ok: false } })

    renderConfirm(
      `${ROUTES.CONFIRM_EMAIL_ROUTE}?userId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&token=bad-token`
    )

    expect(await screen.findByText(/could not confirm this link/i)).toBeInTheDocument()
  })

  it('shows missing-params warning without calling API', async () => {
    renderConfirm(ROUTES.CONFIRM_EMAIL_ROUTE)

    expect(await screen.findByText(/confirmation link is incomplete/i)).toBeInTheDocument()
    expect(axios.get).not.toHaveBeenCalled()
  })

  it('shows RU copy when lang=ru-RU', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({ data: { ok: true } })

    renderConfirm(
      `${ROUTES.CONFIRM_EMAIL_ROUTE}?userId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&token=tok&lang=ru-RU`
    )

    expect(await screen.findByRole('heading', { name: /подтверждение email/i })).toBeInTheDocument()
    expect(await screen.findByText(/email подтверждён/i)).toBeInTheDocument()
  })
})
