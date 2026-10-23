import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ForgotPasswordPage from './ForgotPasswordPage'
import { createTestStore } from '../test/createTestStore'
import { ROUTES } from '../resources/routes-constants'
import axios from '../utility/customAxios'

vi.mock('../utility/customAxios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

function renderForgot(path = ROUTES.FORGOT_PASSWORD_ROUTE) {
  const store = createTestStore()
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={ROUTES.FORGOT_PASSWORD_ROUTE} element={<ForgotPasswordPage />} />
            <Route path={ROUTES.LOGIN_ROUTE} element={<div>Login screen</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    ),
  }
}

describe('ForgotPasswordPage', () => {
  beforeEach(() => {
    vi.mocked(axios.post).mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('shows anti-enum check-email UX after submit (EN)', async () => {
    const user = userEvent.setup()
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { success: true } })

    renderForgot()
    await user.type(await screen.findByLabelText(/email/i), 'known@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(await screen.findByRole('heading', { name: /check your email/i })).toBeInTheDocument()
    expect(screen.getByText(/if an account exists for known@example.com/i)).toBeInTheDocument()
    expect(screen.getByText(/spam or promotions/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /send reset link/i })).not.toBeInTheDocument()

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('/api/authentication/forgotPassword'),
        { email: 'known@example.com' }
      )
    })
  })

  it('shows same success UX for any email (anti-enumeration)', async () => {
    const user = userEvent.setup()
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { success: true } })

    renderForgot()
    await user.type(await screen.findByLabelText(/email/i), 'nobody@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(await screen.findByRole('heading', { name: /check your email/i })).toBeInTheDocument()
    expect(screen.getByText(/nobody@example.com/)).toBeInTheDocument()
    expect(screen.queryByText(/not found/i)).not.toBeInTheDocument()
  })

  it('shows RU check-email copy when lang=ru-RU', async () => {
    const user = userEvent.setup()
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { success: true } })

    renderForgot(`${ROUTES.FORGOT_PASSWORD_ROUTE}?lang=ru-RU`)
    await user.type(await screen.findByLabelText(/email/i), 'ru@example.com')
    await user.click(screen.getByRole('button', { name: /отправить ссылку/i }))

    expect(await screen.findByRole('heading', { name: /проверьте почту/i })).toBeInTheDocument()
    expect(screen.getByText(/ru@example.com/)).toBeInTheDocument()
    expect(screen.getByText(/спам/i)).toBeInTheDocument()
  })

  it('navigates to login from check-email back button', async () => {
    const user = userEvent.setup()
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { success: true } })

    renderForgot()
    await user.type(await screen.findByLabelText(/email/i), 'go@example.com')
    await user.click(screen.getByRole('button', { name: /send reset link/i }))
    await screen.findByRole('heading', { name: /check your email/i })
    await user.click(screen.getByRole('button', { name: /back to sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/login screen/i)).toBeInTheDocument()
    })
  })
})
