import axios from 'axios'
import { getStoredState } from 'redux-persist'
import { persistConfig } from '../store/persistConfig';
import type { RootState } from '../store/store';
const CustomAxios = axios.create()

//const toCamelCase: any = (object: any) => {
//    let transformedObject = object
//    if (typeof object === 'object' && object !== null) {
//        if (object instanceof Array) {
//            transformedObject = object.map(toCamelCase)
//        } else {
//            transformedObject = {}
//            for (const key in object) {
//                if (object[key] !== undefined) {
//                    const newKey = key.replace(/(_\w)|(-\w)/g, (k) => k[1].toUpperCase())
//                    transformedObject[newKey] = toCamelCase(object[key])
//                }
//            }
//        }
//    }
//    return transformedObject
//}

//export const toSnackCase: any = (object: any) => {
//    let transformedObject = object
//    if (typeof object === 'object' && object !== null) {
//        if (object instanceof Array) {
//            transformedObject = object.map(toSnackCase)
//        } else {
//            transformedObject = {}
//            for (const key in object) {
//                if (object[key] !== undefined) {
//                    const newKey = key
//                        .replace(/\.?([A-Z]+)/g, function (_, y) {
//                            return '_' + y.toLowerCase()
//                        })
//                        .replace(/^_/, '')
//                    transformedObject[newKey] = toSnackCase(object[key])
//                }
//            }
//        }
//    }
//    return transformedObject
//}

CustomAxios.interceptors.response.use(
    (response) => {
        //response.data = toCamelCase(response.data)
        // Log the final URL that was actually sent for getEntity requests
        if (response.config.url && response.config.url.includes('getEntity')) {
            const requestUrl = response.request?.responseURL || response.config.url;
            console.log('[Axios Response Interceptor] Final request URL that was sent:', requestUrl);
            console.log('[Axios Response Interceptor] Request config URL:', response.config.url);
            console.log('[Axios Response Interceptor] Request responseURL:', response.request?.responseURL);
        }
        return response
    },
    (error) => {
        if (error.response?.status === 401) {
            // Get current language parameter to preserve it
            const currentUrl = new URL(window.location.href)
            const lang = currentUrl.searchParams.get('lang') || 'en-US'
            // Build clean login URL with only lang parameter, preserving the pathname for returnurl
            const returnPath = currentUrl.pathname
            const returnUrl = lang ? `${returnPath}?lang=${lang}` : returnPath
            window.location.href = `/login?logout&returnurl=${encodeURIComponent(returnUrl)}`
        } else {
            return Promise.reject(error)
        }
    }
)

CustomAxios.interceptors.request.use(
    async (config) => {
        const state = await getStoredState(persistConfig) as RootState
                //config.data = toSnackCase(config.data)
        config.headers.Authorization = 'Bearer ' + state?.authentication?.accessToken
        
        // Log request URL and params for debugging
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
