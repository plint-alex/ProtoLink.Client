import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import RegisterPage from './RegisterPage'
import { createTestStore } from '../test/createTestStore'
import { ROUTES } from '../resources/routes-constants'
import axios from '../utility/customAxios'

vi.mock('../services/textCatalogService', () => ({
  textCatalogService: {
    loadPageTexts: vi.fn().mockResolvedValue({}),
  },
}))

vi.mock('../services/urlLanguageService', () => ({
  urlLanguageService: {
    getCurrentLanguage: () => 'en-US',
    getLanguageId: () => undefined,
    loadLanguages: async () => undefined,
  },
}))

vi.mock('../utility/customAxios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

function renderRegister(path = ROUTES.REGISTER_ROUTE) {
  const store = createTestStore()
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={ROUTES.REGISTER_ROUTE} element={<RegisterPage />} />
            <Route path={ROUTES.LOGIN_ROUTE} element={<div>Login screen</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    ),
  }
}

describe('RegisterPage check-email notice', () => {
  beforeEach(() => {
    vi.mocked(axios.post).mockReset()
  })

  async function fillAndSubmit(
    user: ReturnType<typeof userEvent.setup>,
    email: string,
    opts?: { submitName?: RegExp }
  ) {
    await user.type(await screen.findByLabelText(/email/i), email)
    await user.type(document.getElementById('password') as HTMLElement, 'secret1')
    await user.type(document.getElementById('confirmPassword') as HTMLElement, 'secret1')
    await user.click(screen.getByRole('button', { name: opts?.submitName ?? /^register$/i }))
  }

  it('shows check-email panel after successful registration (EN)', async () => {
    const user = userEvent.setup()
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { success: true } })

    renderRegister()
    await fillAndSubmit(user, 'new@example.com')

    expect(await screen.findByRole('heading', { name: /check your email/i })).toBeInTheDocument()
    expect(screen.getByText(/we sent a confirmation link to new@example.com/i)).toBeInTheDocument()
    expect(screen.getByText(/spam or promotions/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^register$/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/login screen/i)).not.toBeInTheDocument()
  })

  it('shows RU check-email copy when lang=ru-RU', async () => {
    const user = userEvent.setup()
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { success: true } })

    renderRegister(`${ROUTES.REGISTER_ROUTE}?lang=ru-RU`)
    await fillAndSubmit(user, 'ru@example.com', { submitName: /зарегистрироваться/i })

    expect(await screen.findByRole('heading', { name: /проверьте почту/i })).toBeInTheDocument()
    expect(screen.getByText(/ru@example.com/)).toBeInTheDocument()
    expect(screen.getByText(/спам/i)).toBeInTheDocument()
  })

  it('keeps emailError path and does not show check-email success', async () => {
    const user = userEvent.setup()
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: { success: true, emailError: 'SMTP down' },
    })

    renderRegister()
    await fillAndSubmit(user, 'fail@example.com')

    expect(await screen.findByText(/could not send email/i)).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /check your email/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^register$/i })).toBeInTheDocument()
  })

  it('navigates to login from check-email back button', async () => {
    const user = userEvent.setup()
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { success: true } })

    renderRegister()
    await fillAndSubmit(user, 'go@example.com')

    await screen.findByRole('heading', { name: /check your email/i })
    await user.click(screen.getByRole('button', { name: /back to sign in/i }))

    await waitFor(() => {
      expect(screen.getByText(/login screen/i)).toBeInTheDocument()
    })
  })
})
