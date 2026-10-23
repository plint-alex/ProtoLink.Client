import { setAuthentication } from '../store/actions/authentication'
import { persistor, store } from '../store/store'

/**
 * Drop signed-in pretence from Redux + redux-persist before any login redirect.
 * Must finish writing persist storage before a full page navigation.
 *
 * Do not statically import this module from customAxios — that recreates
 * store → files/entities thunks → customAxios → clearAuthSession → store
 * and causes prod TDZ (`Cannot access '$a' before initialization`, blank #root).
 * customAxios must lazy-import clearAuthAndRedirectToLogin on 401 only.
 */
export async function clearPersistedAuth(): Promise<void> {
    store.dispatch(setAuthentication(null))
    await persistor.flush()
}

/** Build /login?logout&returnurl=… for the current location (keeps lang on return). */
export function buildLoginRedirectHref(href: string = window.location.href): string {
    const currentUrl = new URL(href)
    const onLogin = currentUrl.pathname === '/login' || currentUrl.pathname.startsWith('/login/')
    if (onLogin) {
        const returnurl = currentUrl.searchParams.get('returnurl')
        const lang = currentUrl.searchParams.get('lang')
        let q = 'logout'
        if (returnurl) q += `&returnurl=${encodeURIComponent(returnurl)}`
        if (lang) q += `&lang=${encodeURIComponent(lang)}`
        return `/login?${q}`
    }
    const lang = currentUrl.searchParams.get('lang') || 'en-US'
    const returnUrl = `${currentUrl.pathname}?lang=${lang}`
    return `/login?logout&returnurl=${encodeURIComponent(returnUrl)}`
}

/**
 * Clear persisted user auth then hard-navigate to login.
 * Used by customAxios 401 and proactive expiry — not for guest-only share sessions.
 */
export async function clearAuthAndRedirectToLogin(): Promise<void> {
    await clearPersistedAuth()
    const target = buildLoginRedirectHref()
    const onLogin =
        window.location.pathname === '/login' || window.location.pathname.startsWith('/login/')
    if (onLogin) {
        const next = new URL(target, window.location.origin)
        const cur = new URL(window.location.href)
        if (cur.search !== next.search) {
            window.location.replace(target)
        }
        return
    }
    window.location.href = target
}

/** True when persisted user JWT expiry is in the past (5s clock-skew grace). */
export function isUserAccessExpired(
    expirationTime: string | undefined | null,
    nowMs: number = Date.now()
): boolean {
    if (!expirationTime) return false
    const exp = Date.parse(expirationTime)
    if (Number.isNaN(exp)) return false
    return exp <= nowMs - 5_000
}
