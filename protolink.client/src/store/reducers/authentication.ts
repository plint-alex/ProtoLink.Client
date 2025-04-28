import { createReducer } from '@reduxjs/toolkit'
import { setAuthentication, authenticationData } from '../actions/authentication'

const initialState: authenticationData = {
    userId: '',
    login: '',
    userName: '',
    giveinPlaceId: 0,
    accessToken: '',
    refreshToken: '',
    expirationTime: new Date(),
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
            state = initialState;
        }
    })
})

export default authenticationReducer
