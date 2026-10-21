import {
    HubConnection,
    HubConnectionBuilder,
    HubConnectionState,
    LogLevel,
} from '@microsoft/signalr'

export type CommandMessageLike = {
    commandType?: string
    CommandType?: string
    parameters?: unknown
    Parameters?: unknown
}

export type CommandsHubHandlers = {
    onCommand: (commandType: string | null, parameters: unknown) => void
    onReconnected: () => void
}

const HUB_PATH = '/hubs/commands'

let connection: HubConnection | null = null
let connectGeneration = 0

function getCommandType(payload: CommandMessageLike | string | null | undefined): string | null {
    if (payload == null) return null
    if (typeof payload === 'string') return payload
    return payload.commandType ?? payload.CommandType ?? null
}

function getParameters(payload: CommandMessageLike | string | null | undefined): unknown {
    if (payload == null || typeof payload === 'string') return null
    return payload.parameters ?? payload.Parameters ?? null
}

/**
 * Same-origin hub (API wwwroot in prod; Vite proxies /hubs in dev).
 * JWT via accessTokenFactory → SignalR sends ?access_token= for WebSockets.
 * Failures are silent: app keeps working without live updates.
 */
export async function connectCommandsHub(
    getAccessToken: () => string | null | undefined,
    handlers: CommandsHubHandlers
): Promise<void> {
    const generation = ++connectGeneration
    await disconnectCommandsHub()

    const token = getAccessToken()?.trim()
    if (!token) return

    const next = new HubConnectionBuilder()
        .withUrl(HUB_PATH, {
            accessTokenFactory: () => getAccessToken()?.trim() ?? '',
        })
        .withAutomaticReconnect()
        .configureLogging(LogLevel.None)
        .build()

    next.on('ReceiveCommand', (payload: CommandMessageLike | string) => {
        handlers.onCommand(getCommandType(payload), getParameters(payload))
    })

    next.onreconnected(() => {
        void (async () => {
            try {
                await next.invoke('SubscribeToCommands')
            } catch {
                /* older servers / transient */
            }
            handlers.onReconnected()
        })()
    })

    connection = next

    try {
        await next.start()
        if (generation !== connectGeneration || connection !== next) {
            await safeStop(next)
            return
        }
        try {
            await next.invoke('SubscribeToCommands')
        } catch {
            /* older servers may not expose the method; group is also joined OnConnected */
        }
    } catch {
        await safeStop(next)
        if (connection === next) connection = null
    }
}

export async function disconnectCommandsHub(): Promise<void> {
    connectGeneration += 1
    const current = connection
    connection = null
    if (!current) return
    await safeStop(current)
}

export function isCommandsHubConnected(): boolean {
    return connection?.state === HubConnectionState.Connected
}

async function safeStop(hub: HubConnection): Promise<void> {
    try {
        await hub.stop()
    } catch {
        /* ignore */
    }
}

/** Test helpers — exported for unit tests only. */
export const __commandsHubTest = {
    getCommandType,
    getParameters,
    HUB_PATH,
}
