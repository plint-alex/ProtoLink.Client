import { createAction } from '@reduxjs/toolkit'

export interface addEntityContract {
    name: string,
    description: string,
    code: string,
    codeIsUnique: boolean,
    order: number,
    parentIds: string,
    hidden: boolean
}

export const setEntities = createAction<addEntityContract>('entities/setEntities')
