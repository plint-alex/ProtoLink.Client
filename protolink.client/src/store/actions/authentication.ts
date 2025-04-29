import { createAction } from '@reduxjs/toolkit'

export interface authenticationData {
    userId: string
    login: string
    userName: string
    giveinPlaceId: number
    accessToken: string
    refreshToken: string
    expirationTime: string // ISO string format
    idleTimeout: number
    errorFields: { key: string, value: string }[]
    error: string
}

export const setAuthentication = createAction<authenticationData | null>('authentication/setAuthentication')
