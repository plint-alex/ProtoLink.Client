import axios from '../../../utility/customAxios'
import { createAsyncThunk } from '@reduxjs/toolkit'
import type { Entity } from '../../../types/entities'
import {
    CLOUD_FILE_CODE,
    MIME_TYPE_ENTITY_ID,
    NAME_TYPE_ENTITY_ID,
    TYPE_OF_VALUE_STRING
} from '../../../constants/cloudEntities'

const entitiesBase = '/api/entities/'

function parentSetFromValue(v: { parents?: unknown }): Set<string> {
    const s = new Set<string>()
    const p = v.parents
    if (!p) return s
    if (Array.isArray(p)) {
        for (const x of p) {
            if (typeof x === 'string') s.add(x.toLowerCase())
            else if (x != null) s.add(String(x).toLowerCase())
        }
    }
    return s
}

function stringFromValueField(value: unknown): string | null {
    if (value == null) return null
    if (typeof value === 'string') return value.trim() || null
    if (typeof value === 'object' && value !== null && 'value' in value) {
        const inner = (value as { value?: unknown }).value
        if (typeof inner === 'string') return inner.trim() || null
    }
    return null
}

function mimeFromEntityValues(entity: Entity): string | null {
    const values = entity.values
    if (!values?.length) return null
    const mimeLower = MIME_TYPE_ENTITY_ID.toLowerCase()
    for (const v of values as Iterable<{ parents?: unknown; value?: unknown; type?: string }>) {
        const parents = parentSetFromValue(v)
        if (!parents.has(mimeLower)) continue
        const s = stringFromValueField(v.value ?? v)
        if (s) return s
    }
    return null
}

export interface AddFileParams {
    /** Folder (parent) entity id — a new CloudFile child is created and uploaded */
    entityId: string
    file: File
}

export interface GetFileParams {
    id: string
    fileName?: string
}

export interface GetFilesParams {
    entityIds?: string[]
    ids?: string[]
    types?: string[]
}

export interface DeleteFileParams {
    /** CloudFile entity id to remove */
    fileId: string
}

export interface FileResult {
    entityId: string
    id: string
    mimeType: string
    type: string
}

export const addFile = createAsyncThunk<{ Success: string }, AddFileParams>(
    'files/addFile',
    async ({ entityId, file }) => {
        const displayName = (file?.name && file.name.trim()) || 'upload'
        const addRes = await axios.post<{ id: string }>(`${entitiesBase}addEntity`, {
            name: displayName,
            description: '',
            code: CLOUD_FILE_CODE,
            codeIsUnique: false,
            order: 0,
            parentIds: [entityId],
            hidden: false,
            values: [
                {
                    type: TYPE_OF_VALUE_STRING,
                    value: displayName,
                    parentIds: [NAME_TYPE_ENTITY_ID]
                }
            ]
        })
        const cloudFileId = addRes.data?.id
        if (!cloudFileId) {
            throw new Error('addEntity did not return an id for CloudFile')
        }

        const formData = new FormData()
        formData.append('EntityId', cloudFileId)
        formData.append('File', file, file.name)

        const response = await axios.post<{ success?: string; Success?: string }>('/api/Files/addFile', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        const success = response.data?.Success ?? response.data?.success ?? 'ok'
        return { Success: success }
    }
)

export const getFile = createAsyncThunk<Blob, GetFileParams>(
    'files/getFile',
    async ({ id, fileName }) => {
        const response = await axios.get(`/api/Files/getFile/${id}${fileName ? `/${encodeURIComponent(fileName)}` : ''}`, {
            responseType: 'blob'
        })
        return response.data
    }
)

export const getFiles = createAsyncThunk<FileResult[], GetFilesParams>(
    'files/getFiles',
    async (params) => {
        const entityIds = params?.entityIds ?? []
        const out: FileResult[] = []
        for (const parentId of entityIds) {
            const response = await axios.post(`${entitiesBase}getEntities`, {
                parentIds: [parentId],
                includeValues: true
            })
            const list = (response.data ?? []) as Entity[]
            for (const e of list) {
                if (e.code !== CLOUD_FILE_CODE) continue
                out.push({
                    id: e.id,
                    entityId: parentId,
                    mimeType: mimeFromEntityValues(e) ?? 'application/octet-stream',
                    type: CLOUD_FILE_CODE
                })
            }
        }
        return out
    }
)

export const deleteFile = createAsyncThunk<{ Success: string }, DeleteFileParams>(
    'files/deleteFile',
    async ({ fileId }) => {
        await axios.post(`${entitiesBase}deleteEntity`, { id: fileId })
        return { Success: 'ok' }
    }
)
