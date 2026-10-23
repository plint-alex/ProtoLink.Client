import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ResetPasswordPage from './ResetPasswordPage'
import { createTestStore } from '../test/createTestStore'
import { ROUTES } from '../resources/routes-constants'
import axios from '../utility/customAxios'

vi.mock('../utility/customAxios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const VALID =
  `${ROUTES.RESET_PASSWORD_ROUTE}?userId=6aa1765a-1111-2222-3333-444444444444&token=871d221c-aaaa-bbbb-cccc-dddddddddddd`

function renderReset(path: string) {
  const store = createTestStore()
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={ROUTES.RESET_PASSWORD_ROUTE} element={<ResetPasswordPage />} />
            <Route path={ROUTES.LOGIN_ROUTE} element={<div>Login screen</div>} />
            <Route path={ROUTES.FORGOT_PASSWORD_ROUTE} element={<div>Forgot screen</div>} />
            <Route path="/:id" element={<div>Home entity page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    ),
  }
}

describe('ResetPasswordPage', () => {
  beforeEach(() => {
    vi.mocked(axios.post).mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('saves new password and shows success (EN)', async () => {
    const user = userEvent.setup()
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { success: true } })

    renderReset(VALID)
    expect(await screen.findByRole('heading', { name: /choose a new password/i })).toBeInTheDocument()
    expect(screen.queryByText(/home entity page/i)).not.toBeInTheDocument()

    await user.type(document.getElementById('password') as HTMLElement, 'secret1')
    await user.type(document.getElementById('confirmPassword') as HTMLElement, 'secret1')
    await user.click(screen.getByRole('button', { name: /save password/i }))

    expect(await screen.findByText(/password updated/i)).toBeInTheDocument()
    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/authentication/resetPassword', {
        userId: '6aa1765a-1111-2222-3333-444444444444',
        token: '871d221c-aaaa-bbbb-cccc-dddddddddddd',
        newPassword: 'secret1',
      })
    })
  })

  it('shows invalid/expired error and offers forgot again', async () => {
    const user = userEvent.setup()
    vi.mocked(axios.post).mockRejectedValueOnce(new Error('400'))

    renderReset(VALID)
    await user.type(document.getElementById('password') as HTMLElement, 'secret1')
    await user.type(document.getElementById('confirmPassword') as HTMLElement, 'secret1')
    await user.click(screen.getByRole('button', { name: /save password/i }))

    expect(await screen.findByText(/invalid or has expired/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^forgot password$/i }))
    await waitFor(() => {
      expect(screen.getByText(/forgot screen/i)).toBeInTheDocument()
    })
  })

  it('shows missing-params without calling API', async () => {
    renderReset(ROUTES.RESET_PASSWORD_ROUTE)
    expect(await screen.findByText(/reset link is incomplete/i)).toBeInTheDocument()
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('shows RU title when lang=ru-RU', async () => {
    renderReset(`${VALID}&lang=ru-RU`)
    expect(await screen.findByRole('heading', { name: /новый пароль/i })).toBeInTheDocument()
  })

  it('shows mismatch validation', async () => {
    const user = userEvent.setup()
    renderReset(VALID)
    await user.type(document.getElementById('password') as HTMLElement, 'secret1')
    await user.type(document.getElementById('confirmPassword') as HTMLElement, 'other1')
    await user.click(screen.getByRole('button', { name: /save password/i }))
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
    expect(axios.post).not.toHaveBeenCalled()
  })
})
