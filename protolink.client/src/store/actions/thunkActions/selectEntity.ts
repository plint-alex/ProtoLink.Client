import { createAsyncThunk } from '@reduxjs/toolkit';

export const selectEntity = createAsyncThunk<void, string>(
    'entities/selectEntity',
    async () => {
        // This is a synchronous action, but we use createAsyncThunk for consistency
        return;
    }
); 