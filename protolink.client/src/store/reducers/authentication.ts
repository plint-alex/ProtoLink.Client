import { createReducer } from '@reduxjs/toolkit'
import { setAuthentication, authenticationData } from '../actions/authentication'

const initialState: authenticationData = {
    userId: '',
    login: '',
    userName: '',
    giveinPlaceId: 0,
    accessToken: '',
    refreshToken: '',
    expirationTime: new Date().toISOString(),
    idleTimeout: 0,
    errorFields: [],
    error: ''
}

const authenticationReducer = createReducer<authenticationData>(initialState, (builder) => {
    builder.addCase(setAuthentication, (state, action) => {
        if (action.payload) {
            state.userId = action.payload.userId
            state.login = action.payload.login
            state.userName = action.payload.userName
            state.giveinPlaceId = action.payload.giveinPlaceId
            state.accessToken = action.payload.accessToken
            state.refreshToken = action.payload.refreshToken
            state.expirationTime = action.payload.expirationTime
            state.idleTimeout = action.payload.idleTimeout
            state.errorFields = action.payload.errorFields
            state.error = action.payload.error
        } else {
            state.userId = initialState.userId
            state.login = initialState.login
            state.userName = initialState.userName
            state.giveinPlaceId = initialState.giveinPlaceId
            state.accessToken = initialState.accessToken
            state.refreshToken = initialState.refreshToken
            state.expirationTime = initialState.expirationTime
            state.idleTimeout = initialState.idleTimeout
            state.errorFields = initialState.errorFields
            state.error = initialState.error
        }
    })
})

export default authenticationReducer
