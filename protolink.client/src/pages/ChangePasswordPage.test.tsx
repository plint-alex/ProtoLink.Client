import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError } from 'axios'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ChangePasswordPage from './ChangePasswordPage'
import { createTestStore } from '../test/createTestStore'
import { ROUTES } from '../resources/routes-constants'
import axios from '../utility/customAxios'

vi.mock('../utility/customAxios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

const AUTHED = {
  authentication: {
    userId: '8f3a0000-0000-4000-8000-000000000001',
    login: 'ivan@example.com',
    userName: 'Ivan Petrov',
    giveinPlaceId: 0,
    accessToken: 'test-jwt',
    refreshToken: 'refresh',
    expirationTime: new Date(Date.now() + 3600_000).toISOString(),
    idleTimeout: 0,
    errorFields: [] as string[],
    error: '',
  },
}

function renderChange(path = ROUTES.CHANGE_PASSWORD_ROUTE, authed = true) {
  const store = createTestStore(authed ? AUTHED : undefined)
  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path={ROUTES.CHANGE_PASSWORD_ROUTE} element={<ChangePasswordPage />} />
            <Route path={ROUTES.LOGIN_ROUTE} element={<div>Login screen</div>} />
            <Route path={ROUTES.HOMEPAGE_ROUTE} element={<div>Home screen</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    ),
  }
}

function axiosBadRequest(error: string) {
  const err = new AxiosError('Bad Request')
  err.response = {
    data: { success: false, error },
    status: 400,
    statusText: 'Bad Request',
    headers: {},
    config: {} as never,
  }
  return err
}

describe('ChangePasswordPage', () => {
  beforeEach(() => {
    vi.mocked(axios.post).mockReset()
  })

  afterEach(() => {
    cleanup()
  })

  it('redirects anonymous users to login', async () => {
    renderChange(ROUTES.CHANGE_PASSWORD_ROUTE, false)
    expect(await screen.findByText('Login screen')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: /change password/i })).not.toBeInTheDocument()
  })

  it('validates confirm mismatch without calling Api', async () => {
    const user = userEvent.setup()
    renderChange()

    await user.type(await screen.findByLabelText(/current password/i), 'old-pass')
    await user.type(document.getElementById('newPassword') as HTMLElement, 'new-pass')
    await user.type(document.getElementById('confirmPassword') as HTMLElement, 'other-pass')
    await user.click(screen.getByRole('button', { name: /save password/i }))

    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('validates new password min length 5', async () => {
    const user = userEvent.setup()
    renderChange()

    await user.type(await screen.findByLabelText(/current password/i), 'old-pass')
    await user.type(document.getElementById('newPassword') as HTMLElement, 'ab')
    await user.type(document.getElementById('confirmPassword') as HTMLElement, 'ab')
    await user.click(screen.getByRole('button', { name: /save password/i }))

    expect(await screen.findByText(/at least 5 characters/i)).toBeInTheDocument()
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('shows wrong-current error and stays signed in', async () => {
    const user = userEvent.setup()
    vi.mocked(axios.post).mockRejectedValueOnce(axiosBadRequest('Current password is incorrect.'))

    const { store } = renderChange()
    await user.type(await screen.findByLabelText(/current password/i), 'wrong')
    await user.type(document.getElementById('newPassword') as HTMLElement, 'new-pass')
    await user.type(document.getElementById('confirmPassword') as HTMLElement, 'new-pass')
    await user.click(screen.getByRole('button', { name: /save password/i }))

    expect(await screen.findByText(/current password is incorrect/i)).toBeInTheDocument()
    expect(store.getState().authentication.accessToken).toBe('test-jwt')
  })

  it('shows success and keeps access token after change', async () => {
    const user = userEvent.setup()
    vi.mocked(axios.post).mockResolvedValueOnce({ data: { success: true } })

    const { store } = renderChange()
    await user.type(await screen.findByLabelText(/current password/i), 'old-pass')
    await user.type(document.getElementById('newPassword') as HTMLElement, 'new-pass')
    await user.type(document.getElementById('confirmPassword') as HTMLElement, 'new-pass')
    await user.click(screen.getByRole('button', { name: /save password/i }))

    expect(await screen.findByText(/password updated/i)).toBeInTheDocument()
    expect(screen.getByText(/other devices may need to sign in again/i)).toBeInTheDocument()
    expect(store.getState().authentication.accessToken).toBe('test-jwt')

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledWith('/api/authentication/changePassword', {
        currentPassword: 'old-pass',
        newPassword: 'new-pass',
      })
    })
  })

  it('shows RU copy when lang=ru-RU', async () => {
    renderChange(`${ROUTES.CHANGE_PASSWORD_ROUTE}?lang=ru-RU`)
    expect(await screen.findByRole('heading', { name: /смена пароля/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /сохранить пароль/i })).toBeInTheDocument()
  })
})
