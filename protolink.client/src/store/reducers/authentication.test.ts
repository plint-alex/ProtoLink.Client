import { describe, it, expect, vi, beforeEach } from 'vitest'
import authenticationReducer from './authentication'
import { setAuthentication, type authenticationData } from '../actions/authentication'
import { login } from '../actions/thunkActions/authentication'
import { createTestStore } from '../../test/createTestStore'
import axios from '../../utility/customAxios'

vi.mock('../../utility/customAxios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

function sampleAuth(overrides: Partial<authenticationData> = {}): authenticationData {
  return {
    userId: 'user-1',
    login: 'alice',
    userName: 'Alice',
    giveinPlaceId: 1,
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expirationTime: '2030-01-01T00:00:00.000Z',
    idleTimeout: 30,
    errorFields: [],
    error: '',
    ...overrides,
  }
}

describe('authentication reducer', () => {
  it('setAuthentication stores tokens', () => {
    const next = authenticationReducer(undefined, setAuthentication(sampleAuth()))
    expect(next.accessToken).toBe('access-token')
    expect(next.refreshToken).toBe('refresh-token')
    expect(next.login).toBe('alice')
  })

  it('setAuthentication(null) clears tokens', () => {
    const loggedIn = authenticationReducer(undefined, setAuthentication(sampleAuth()))
    const cleared = authenticationReducer(loggedIn, setAuthentication(null))
    expect(cleared.accessToken).toBe('')
    expect(cleared.refreshToken).toBe('')
    expect(cleared.login).toBe('')
    expect(cleared.userId).toBe('')
  })
})

describe('login thunk', () => {
  beforeEach(() => {
    vi.mocked(axios.post).mockReset()
  })

  it('dispatches setAuthentication and stores accessToken', async () => {
    vi.mocked(axios.post).mockResolvedValueOnce({
      data: {
        userId: 'user-2',
        login: 'bob',
        userName: 'Bob',
        giveinPlaceId: 0,
        accessToken: 'thunk-access',
        refreshToken: 'thunk-refresh',
        expirationTime: '2031-06-01T12:00:00Z',
        idleTimeout: 15,
        errorFields: [],
        error: '',
      },
    })

    const store = createTestStore()
    await store.dispatch(login({ login: 'bob', password: 'secret' }))

    expect(axios.post).toHaveBeenCalledWith('/api/authentication/login', {
      login: 'bob',
      password: 'secret',
      giveinPlaceId: undefined,
    })
    expect(store.getState().authentication.accessToken).toBe('thunk-access')
    expect(store.getState().authentication.refreshToken).toBe('thunk-refresh')
  })
})
