import { createAction } from '@reduxjs/toolkit'

export interface authenticationData {
    userId: string
    login: string
    userName: string
    giveinPlaceId: number
    accessToken: string
    refreshToken: string
    expirationTime: Date
    idleTimeout: number
    errorFields: { key: string, value: string }[]
    error: string
}

export const setAuthentication = createAction<authenticationData>('authentication/setAuthentication')
