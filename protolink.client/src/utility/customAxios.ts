import axios from 'axios'
import { getStoredState } from 'redux-persist'
import { persistConfig, RootState } from '../store/store';
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
        return response
    },
    (error) => {
        if (error.response.status === 401) {
            window.location.href = `/login?logout&returnurl=${window.location.href}`
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
        return config
    },
    (error) => {
        console.error(error)
        return Promise.reject(error)
    }
)

export default CustomAxios
