import { AxiosRequestConfig } from 'axios'
import { RootState } from '../store/store'

export const getCommonAxiosConfig = (getState: () => RootState): AxiosRequestConfig => {

    const { authentication } = getState()
    return {
        headers: { Authorization: 'Bearer ' + authentication.accessToken }
    } as AxiosRequestConfig
}