/** Tiny bus so HomePage can remount/reload after a SignalR / catch-up subtree refresh. */

let version = 0
const listeners = new Set<() => void>()

export function bumpSubtreeRefresh(): void {
    version += 1
    listeners.forEach((listener) => listener())
}

export function subscribeSubtreeRefresh(listener: () => void): () => void {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

export function getSubtreeRefreshVersion(): number {
    return version
}
