import { createSlice } from '@reduxjs/toolkit';
import { getFiles, addFile, deleteFile } from './actions/thunkActions/files';
import type { FileResult } from './actions/thunkActions/files';
import type { Dictionary } from '../types/dictionary';

export interface FilesState {
    filesByEntity: Dictionary<FileResult[]>;
    loading: boolean;
    error: string | null;
}

const initialState: FilesState = {
    filesByEntity: {},
    loading: false,
    error: null,
};

const filesSlice = createSlice({
    name: 'files',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(getFiles.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getFiles.fulfilled, (state, action) => {
                state.loading = false;
                // Assume action.meta.arg.entityIds is an array of entityIds
                const entityIds = action.meta.arg.entityIds || [];
                if (entityIds.length === 1) {
                    state.filesByEntity[entityIds[0]] = action.payload;
                } else {
                    // If multiple, distribute by entityId
                    action.payload.forEach(file => {
                        if (!state.filesByEntity[file.entityId]) {
                            state.filesByEntity[file.entityId] = [];
                        }
                        state.filesByEntity[file.entityId].push(file);
                    });
                }
            })
            .addCase(getFiles.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch files';
            })
            .addCase(addFile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addFile.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(addFile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to add file';
            })
            .addCase(deleteFile.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteFile.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(deleteFile.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to delete file';
            });
    }
});

export default filesSlice.reducer; 