import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/store'
import {
    connectCommandsHub,
    disconnectCommandsHub,
} from '../services/commandsHub'
import {
    entityIdFromPathname,
    isDataChangedCommand,
    isHomeEntityPath,
    refreshEntitySubtree,
    resolveSubtreeEntityId,
} from '../services/commandsHubRefresh'
import { catchUpEntityUpdates } from '../services/entityUpdatesCatchup'

/**
 * Connects to /hubs/commands while authenticated.
 * - data_changed → subtree refresh (live path)
 * - reconnect / first entity route load → GetEntityUpdates catch-up (no polling)
 */
export function useCommandsHub(): void {
    const dispatch = useAppDispatch()
    const location = useLocation()
    const accessToken = useAppSelector((state) => state.authentication?.accessToken)

    const pathnameRef = useRef(location.pathname)
    const searchRef = useRef(location.search)
    const refreshBusyRef = useRef(false)
    const refreshPendingRef = useRef(false)
    const pendingArgsRef = useRef<{ commandType: string | null; parameters: unknown } | null>(
        null
    )
    const catchUpBusyRef = useRef(false)
    const lastCatchUpKeyRef = useRef<string | null>(null)

    pathnameRef.current = location.pathname
    searchRef.current = location.search

    const runCatchUp = async () => {
        const entityId = entityIdFromPathname(pathnameRef.current)
        if (!entityId) return
        if (catchUpBusyRef.current) return
        catchUpBusyRef.current = true
        try {
            const lang = new URLSearchParams(searchRef.current).get('lang') ?? undefined
            await catchUpEntityUpdates(dispatch, {
                rootEntityId: entityId,
                reloadView: isHomeEntityPath(pathnameRef.current),
                lang,
            })
        } catch {
            /* quiet degrade */
        } finally {
            catchUpBusyRef.current = false
        }
    }

    const runLiveRefresh = async (commandType: string | null, parameters: unknown) => {
        if (!isDataChangedCommand(commandType)) return

        if (refreshBusyRef.current) {
            refreshPendingRef.current = true
            pendingArgsRef.current = { commandType, parameters }
            return
        }

        refreshBusyRef.current = true
        try {
            do {
                refreshPendingRef.current = false
                const args = pendingArgsRef.current ?? { commandType, parameters }
                pendingArgsRef.current = null

                const entityId = resolveSubtreeEntityId(args.parameters, pathnameRef.current)
                if (!entityId) continue

                const lang = new URLSearchParams(searchRef.current).get('lang') ?? undefined

                await refreshEntitySubtree(dispatch, {
                    entityId,
                    reloadView: isHomeEntityPath(pathnameRef.current),
                    lang,
                })
            } while (refreshPendingRef.current)
        } catch {
            /* quiet degrade */
        } finally {
            refreshBusyRef.current = false
        }
    }

    // Hub lifecycle: connect when JWT present; catch-up on reconnect (not blind GetEntities).
    useEffect(() => {
        const token = accessToken?.trim()
        if (!token) {
            void disconnectCommandsHub()
            lastCatchUpKeyRef.current = null
            return
        }

        void connectCommandsHub(
            () => accessToken,
            {
                onCommand: (commandType, parameters) => {
                    void runLiveRefresh(commandType, parameters)
                },
                onReconnected: () => {
                    void runCatchUp()
                },
            }
        )

        return () => {
            void disconnectCommandsHub()
        }
        // runLiveRefresh / runCatchUp close over refs + dispatch; token drives connect.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: reconnect handlers use refs
    }, [accessToken, dispatch])

    // First authenticated load of an entity route: one GetEntityUpdates catch-up.
    useEffect(() => {
        const token = accessToken?.trim()
        if (!token) return

        const entityId = entityIdFromPathname(location.pathname)
        if (!entityId) return

        const key = `${token.slice(0, 8)}:${entityId.toLowerCase()}`
        if (lastCatchUpKeyRef.current === key) return
        lastCatchUpKeyRef.current = key
        void runCatchUp()
        // eslint-disable-next-line react-hooks/exhaustive-deps -- runCatchUp uses refs
    }, [accessToken, location.pathname, dispatch])
}
