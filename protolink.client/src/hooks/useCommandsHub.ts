/**
 * Layout calls this while authenticated. The full SignalR implementation
 * (commandsHub + subtree refresh) was left uncommitted on AiGenerated
 * (FE P2-20261017-web-client-signalr-live-updates) and is missing from git.
 * No-op keeps production builds green until FE restores the real hook.
 */
export function useCommandsHub(): void {
  // intentionally empty
}
