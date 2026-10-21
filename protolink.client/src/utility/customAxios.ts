import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { getStoredState } from 'redux-persist'
import { persistConfig } from '../store/persistConfig';
import type { RootState } from '../store/store';
import {
    getShareAccessToken,
    getShareRawToken,
    markShareCredentialUsed,
    markShareSessionEnded,
    clearShareSession,
    reRedeemShareSession,
} from '../services/shareSession'

const CustomAxios = axios.create()

type ShareAxiosConfig = InternalAxiosRequestConfig & {
    /** Request already retried after share re-redeem — avoid loops. */
    _shareRetried?: boolean
    /** Request already retried with share JWT after user 403 — avoid loops. */
    _shareFallbackRetried?: boolean
}

const isTextRequest = (config?: { headers?: Record<string, unknown> }): boolean => {
    const headers = config?.headers
    const headerValue =
        headers?.['X-ProtoLink-Text-Request'] ??
        headers?.['x-protolink-text-request']
    return headerValue === '1' || headerValue === 1 || headerValue === true
}

function redirectToLogin(): void {
    const currentUrl = new URL(window.location.href)
    const lang = currentUrl.searchParams.get('lang') || 'en-US'
    const returnPath = currentUrl.pathname
    const returnUrl = lang ? `${returnPath}?lang=${lang}` : returnPath
    window.location.href = `/login?logout&returnurl=${encodeURIComponent(returnUrl)}`
}

/**
 * S4 credential choice: prefer user JWT (never reduce privilege). Share JWT is the
 * anonymous credential, or a one-shot fallback after user 403 (signed-in without personal grant).
 */
function pickBearer(userAccessToken: string | undefined, preferShare: boolean): string | null {
    const shareJwt = getShareAccessToken()
    const user = (userAccessToken || '').trim()
    if (preferShare && shareJwt) {
        markShareCredentialUsed()
        return shareJwt
    }
    if (user) return user
    if (shareJwt) {
        markShareCredentialUsed()
        return shareJwt
    }
    return null
}

CustomAxios.interceptors.response.use(
    (response) => {
        if (isTextRequest(response.config)) {
            const endpoint = response.config.url || 'unknown-url'
            const payload = response.config.data || {}
            const responseData = response.data
            const count = Array.isArray(responseData) ? responseData.length : 1
            console.log('[TextRequest][Response]', JSON.stringify({
                endpoint,
                status: response.status,
                request: payload,
                resultCount: count,
            }))
        }

        if (response.config.url && response.config.url.includes('getEntity')) {
            const requestUrl = response.request?.responseURL || response.config.url;
            console.log('[Axios Response Interceptor] Final request URL that was sent:', requestUrl);
            console.log('[Axios Response Interceptor] Request config URL:', response.config.url);
            console.log('[Axios Response Interceptor] Request responseURL:', response.request?.responseURL);
        }
        return response
    },
    async (error: AxiosError) => {
        const status = error.response?.status
        const config = error.config as ShareAxiosConfig | undefined

        // AT-S8: share JWT expired → silent re-redeem from sessionStorage; never bounce guest to /login.
        if (status === 401 && config && getShareRawToken()) {
            if (config._shareRetried) {
                clearShareSession()
                markShareSessionEnded()
                return Promise.reject(error)
            }
            const refreshed = await reRedeemShareSession()
            if (!refreshed) {
                return Promise.reject(error)
            }
            const shareJwt = getShareAccessToken()
            if (!shareJwt) {
                return Promise.reject(error)
            }
            config._shareRetried = true
            markShareCredentialUsed()
            config.headers = config.headers ?? {}
            config.headers.Authorization = `Bearer ${shareJwt}`
            return CustomAxios.request(config)
        }

        // Signed-in without personal grant: user JWT → 403, retry once with share JWT (S4 fallback).
        if (status === 403 && config && getShareAccessToken() && !config._shareFallbackRetried) {
            const authHeader = String(config.headers?.Authorization ?? '')
            const shareJwt = getShareAccessToken()!
            if (!authHeader.includes(shareJwt)) {
                config._shareFallbackRetried = true
                markShareCredentialUsed()
                config.headers = config.headers ?? {}
                config.headers.Authorization = `Bearer ${shareJwt}`
                return CustomAxios.request(config)
            }
        }

        if (status === 401) {
            // No share session — existing signed-in behaviour.
            redirectToLogin()
            return
        }

        return Promise.reject(error)
    }
)

CustomAxios.interceptors.request.use(
    async (config) => {
        const state = await getStoredState(persistConfig) as RootState
        const preferShare = Boolean((config as ShareAxiosConfig)._shareFallbackRetried)
        const bearer = pickBearer(state?.authentication?.accessToken, preferShare)
        if (bearer) {
            config.headers.Authorization = 'Bearer ' + bearer
        }

        if (isTextRequest(config)) {
            console.log('[TextRequest][Request]', JSON.stringify({
                endpoint: config.url,
                method: config.method,
                payload: config.data || {},
            }))
        }

        if (config.url && config.url.includes('getEntity')) {
            const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url;
            console.log('[Axios Request Interceptor] Full URL that will be sent:', fullUrl);
            console.log('[Axios Request Interceptor] URL part:', config.url);
            console.log('[Axios Request Interceptor] baseURL:', config.baseURL);
            console.log('[Axios Request Interceptor] Params:', config.params);
            console.log('[Axios Request Interceptor] Full config:', JSON.stringify({
                url: config.url,
                method: config.method,
                params: config.params,
                baseURL: config.baseURL
            }, null, 2));
        }

        return config
    },
    (error) => {
        console.error(error)
        return Promise.reject(error)
    }
)

export default CustomAxios
