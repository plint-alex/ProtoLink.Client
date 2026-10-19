import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { UserMenu } from './UserMenu'
import * as copyTextModule from '../../services/copyText'

vi.mock('../../hooks/useNavigationWithParams', () => ({
    useNavigationWithParams: () => vi.fn(),
}))

const text = {
    login: 'Log in',
    logout: 'Log out',
    userDefault: 'User',
    copyMyId: 'Copy my ID',
    copyMyIdHint: 'Share this with people who want to give you access',
    copied: 'Copied',
}

describe('UserMenu Copy my ID', () => {
    afterEach(() => {
        vi.restoreAllMocks()
    })

    it('copies the user id when Copy my ID is chosen', async () => {
        const user = userEvent.setup()
        const copySpy = vi.spyOn(copyTextModule, 'copyText').mockResolvedValue(undefined)

        render(
            <MemoryRouter>
                <UserMenu
                    userName="Ivan Petrov"
                    login="ivan@example.com"
                    userId="8f3a0000-0000-4000-8000-000000000001"
                    onLogout={() => undefined}
                    text={text}
                />
            </MemoryRouter>
        )

        await user.click(screen.getByText('IP'))
        await user.click(screen.getByLabelText('CopyMyId'))

        await waitFor(() => {
            expect(copySpy).toHaveBeenCalledWith('8f3a0000-0000-4000-8000-000000000001')
        })
        expect(await screen.findByText('Copied')).toBeInTheDocument()
    })

    it('hides Copy my ID when userId is missing', async () => {
        const user = userEvent.setup()

        render(
            <MemoryRouter>
                <UserMenu userName="Ivan Petrov" onLogout={() => undefined} text={text} />
            </MemoryRouter>
        )

        await user.click(screen.getByText('IP'))
        expect(screen.queryByLabelText('CopyMyId')).not.toBeInTheDocument()
    })
})
