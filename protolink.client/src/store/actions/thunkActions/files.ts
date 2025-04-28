import axios from 'axios'
import { createAsyncThunk } from '@reduxjs/toolkit'

export interface AddFileParams {
    entityId: string
    fileId: string
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
    async ({ entityId, fileId, file }) => {
        try {
            const formData = new FormData()
            formData.append('entityId', entityId)
            formData.append('fileId', fileId)
            formData.append('file', file)

            const response = await axios.post('/api/files/addFile', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            })
            return response.data
        } catch (e) {
            console.error(e)
            throw e
        }
    }
)

export const getFile = createAsyncThunk<Blob, GetFileParams>(
    'files/getFile',
    async ({ id, fileName }) => {
        try {
            const response = await axios.get(`/api/files/getFile/${id}${fileName ? `/${fileName}` : ''}`, {
                responseType: 'blob'
            })
            return response.data
        } catch (e) {
            console.error(e)
            throw e
        }
    }
)

export const getFiles = createAsyncThunk<FileResult[], GetFilesParams>(
    'files/getFiles',
    async (params) => {
        try {
            const response = await axios.post('/api/files/getFiles', params)
            return response.data
        } catch (e) {
            console.error(e)
            throw e
        }
    }
)

export const deleteFile = createAsyncThunk<{ Success: string }, DeleteFileParams>(
    'files/deleteFile',
    async ({ fileId }) => {
        try {
            const response = await axios.post('/api/files/deleteFile', { fileId })
            return response.data
        } catch (e) {
            console.error(e)
            throw e
        }
    }
) 