import { combineReducers, configureStore } from '@reduxjs/toolkit'
import authentication from '../store/reducers/authentication'
import entities from '../store/entitiesSlice'
import filesReducer from '../store/filesSlice'

/** Non-persisted store for unit tests (avoids redux-persist + sessionStorage noise). */
export function createTestStore(
  preloadedState?: Partial<{
    authentication: ReturnType<typeof authentication>
    entities: ReturnType<typeof entities>
    files: ReturnType<typeof filesReducer>
  }>
) {
  return configureStore({
    reducer: combineReducers({
      authentication,
      entities,
      files: filesReducer,
    }),
    preloadedState: preloadedState as never,
  })
}
