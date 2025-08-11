import { ThunkDispatch, UnknownAction, combineReducers, configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER} from 'redux-persist'
import storage from 'redux-persist/lib/storage' // defaults to localStorage
import authentication from './reducers/authentication'
import entities, { EntitiesState } from './entitiesSlice'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { Dictionary } from '../types/dictionary'
import { Entity } from '../types/entities'
import filesReducer from './filesSlice'
import { createSelector } from 'reselect'



const rootReducer = combineReducers({
    authentication,
    entities,
    files: filesReducer
})

export const persistConfig = {
    key: 'root',
    storage,
    whitelist: ['data', 'authentication']
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: {
                ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER]
            }
        })
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = ThunkDispatch<RootState, string, UnknownAction>


export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

export const persistor = persistStore(store)

export const selectEntity = (state: RootState, selector?: string): Entity | null => {
    return selector ? (state.entities as EntitiesState as Dictionary<Entity>)[selector] : null;
}

export const selectEntities = createSelector(
    [
        (state: RootState) => state.entities,
        (_: RootState, selector: string) => selector
    ],
    (entitiesState, selector) => {
        const result = (entitiesState as EntitiesState as Dictionary<Entity[]>)[selector];
        return Array.isArray(result) ? result : [];
    }
);
