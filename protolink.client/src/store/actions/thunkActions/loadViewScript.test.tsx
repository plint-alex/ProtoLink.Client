import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import HomePage from '../../../pages/HomePage'
import { createTestStore } from '../../../test/createTestStore'
import axios from '../../../utility/customAxios'

const ENTITY_ID = '11111111-1111-4111-8111-111111111111'
const VIEW_ID = '22222222-2222-4222-8222-222222222222'

vi.mock('../../../services/textCatalogService', () => ({
  textCatalogService: {
    loadPageTexts: vi.fn().mockResolvedValue({}),
  },
  TOP_MENU_DEFAULTS_EN: {
    'home-go-home': 'Go to ProtoLink',
    'home-sign-in': 'Sign in',
    'home-not-found': 'Not found',
    'home-no-access': 'No access',
    'home-no-access-signed-out': 'Sign in to open this item',
    'home-load-failed': 'Failed to load',
    'home-view-unavailable': 'View unavailable',
    'home-details': 'Details',
    'home-link-unavailable': 'Link unavailable',
    'home-link-unavailable-body': 'This link is no longer available',
    'home-go-protolink': 'Go to ProtoLink',
  },
}))

vi.mock('../../../utility/customAxios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

/** jsdom does not run inline <script> text on appendChild — eval so GetView payloads register components. */
function installScriptEvalShim() {
  const original = document.body.appendChild.bind(document.body)
  document.body.appendChild = ((node: Node) => {
    if (node instanceof HTMLScriptElement) {
      const code = node.text || node.textContent || ''
      if (code.trim()) {
        // Dynamic views assign window[viewId] = Component
        ;(0, eval)(code)
      }
    }
    return original(node)
  }) as typeof document.body.appendChild
  return () => {
    document.body.appendChild = original
  }
}

describe('loadViewScript / GetView → HomePage', () => {
  let restoreAppend: (() => void) | undefined

  beforeEach(() => {
    vi.mocked(axios.get).mockReset()
    restoreAppend = installScriptEvalShim()
    ;(window as Window & { __protolinkViews?: unknown }).__protolinkViews = undefined
    delete (window as unknown as Record<string, unknown>)[VIEW_ID]
    ;(window as unknown as { React?: typeof React }).React = React
  })

  afterEach(() => {
    restoreAppend?.()
    cleanup()
    delete (window as unknown as Record<string, unknown>)[VIEW_ID]
    delete (window as unknown as { React?: typeof React }).React
    ;(window as Window & { __protolinkViews?: unknown }).__protolinkViews = undefined
  })

  it('mocked GetView injects script and HomePage renders the dynamic component', async () => {
    const scriptText = [
      `window[${JSON.stringify(VIEW_ID)}] = function DynamicTestView() {`,
      `  return window.React.createElement('div', null, 'Hello from dynamic view');`,
      `};`,
    ].join('\n')

    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {
        scripts: scriptText,
        entityViews: [{ entityId: ENTITY_ID, viewId: VIEW_ID }],
        originalScripts: scriptText,
      },
    })

    const store = createTestStore()
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[`/${ENTITY_ID}?lang=en-US`]}>
          <Routes>
            <Route path="/:id/*" element={<HomePage />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    )

    expect(await screen.findByText('Hello from dynamic view')).toBeInTheDocument()
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(
        `/api/entities/getView/${ENTITY_ID}`,
        expect.objectContaining({ params: { lang: 'en-US' } })
      )
    })
    expect(typeof (window as unknown as Record<string, unknown>)[VIEW_ID]).toBe('function')
  })
})
