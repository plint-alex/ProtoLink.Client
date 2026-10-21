import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { MemoryRouter } from 'react-router-dom'
import { SearchPalette } from './SearchPalette'
import { SEARCH_NARROW_PX } from '../../constants/searchPage'
import { AVATAR_STYLES } from './searchPaletteStyles'
import { RECENT_ENTITIES_KEY } from '../../services/search/searchHelpers'
import { createTestStore } from '../../test/createTestStore'

const mockNavigate = vi.fn()

vi.mock('../../hooks/useNavigationWithParams', () => ({
    useNavigationWithParams: () => mockNavigate,
}))

vi.mock('../../utility/customAxios', () => ({
    default: {
        post: vi.fn().mockResolvedValue({ status: 200, data: { items: [] } }),
        get: vi.fn(),
    },
}))

function renderPalette() {
    const store = createTestStore()
    return render(
        <Provider store={store}>
            <MemoryRouter>
                <SearchPalette />
            </MemoryRouter>
        </Provider>
    )
}

describe('SearchPalette', () => {
    beforeEach(() => {
        mockNavigate.mockReset()
        Object.defineProperty(window, 'innerWidth', {
            configurable: true,
            writable: true,
            value: 1024,
        })
    })

    afterEach(() => {
        cleanup()
        window.localStorage.removeItem(RECENT_ENTITIES_KEY)
    })

    it('opens overlay on Ctrl+K when wide', async () => {
        renderPalette()
        window.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
        )
        expect(await screen.findByTestId('search-palette')).toBeInTheDocument()
        expect(screen.getByTestId('search-palette-input')).toHaveFocus()
        expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('navigates to /search on Ctrl+K when narrow (no overlay)', async () => {
        Object.defineProperty(window, 'innerWidth', {
            configurable: true,
            writable: true,
            value: SEARCH_NARROW_PX - 1,
        })
        renderPalette()
        window.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
        )
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalled()
        })
        const path = String(mockNavigate.mock.calls[0][0])
        expect(path.startsWith('/search')).toBe(true)
        expect(screen.queryByTestId('search-palette')).not.toBeInTheDocument()
    })

    it('Enter with query ≥ 2 and no active row opens full search page', async () => {
        const user = userEvent.setup()
        renderPalette()
        window.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
        )
        const input = await screen.findByTestId('search-palette-input')
        await user.type(input, 'report')
        await user.keyboard('{Enter}')
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalled()
        })
        const path = String(mockNavigate.mock.calls[0][0])
        expect(path).toContain('/search')
        expect(path).toContain('q=report')
    })

    it('recent entity with contact typeTag uses people avatar (shared classifySection)', async () => {
        window.localStorage.setItem(
            RECENT_ENTITIES_KEY,
            JSON.stringify([
                {
                    id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
                    title: 'Ada Contact',
                    typeTag: 'contact',
                },
            ])
        )
        renderPalette()
        window.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })
        )
        expect(await screen.findByText('Ada Contact')).toBeInTheDocument()
        const people = AVATAR_STYLES.people
        const avatars = document.querySelectorAll('.pl-sp-avatar')
        expect(avatars.length).toBeGreaterThan(0)
        expect(avatars[0]).toHaveStyle({ background: people.bg })
        expect(avatars[0].textContent).toBe(people.glyph)
        window.localStorage.removeItem(RECENT_ENTITIES_KEY)
    })
})
