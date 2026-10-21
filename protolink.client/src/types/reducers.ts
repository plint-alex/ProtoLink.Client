export interface ReducerData {
    contents: string[]
}

export type ReduxActionData<T> = {
    type: string
    payload?: T
}

export type ReduxAction<T> = (data: T) => ReduxActionData<T>
