import { createSlice } from '@reduxjs/toolkit';
import { Entity } from '../types/entities';
import {
    getEntity,
    getEntities
} from './actions/thunkActions/entities';

interface EntitiesState {
    currentEntity: Entity | null;
    entities: Entity[];
    loading: boolean;
    error: string | null;
}

const initialState: EntitiesState = {
    currentEntity: null,
    entities: [],
    loading: false,
    error: null
};

const entitiesSlice = createSlice({
    name: 'entities',
    initialState,
    reducers: {
        addValue: (state, action) => {
            if (state.currentEntity) {
                const { id, value } = action.payload;
                if (state.currentEntity.id === id) {
                    state.currentEntity.values.push(value);
                }
            }
        },
        deleteValue: (state, action) => {
            if (state.currentEntity) {
                const { id, index } = action.payload;
                if (state.currentEntity.id === id) {
                    state.currentEntity.values.splice(index, 1);
                }
            }
        },
        addView: (state, action) => {
            if (state.currentEntity) {
                const { id, viewId } = action.payload;
                if (state.currentEntity.id === id) {
                    state.currentEntity.viewIds.push(viewId);
                }
            }
        },
        deleteView: (state, action) => {
            if (state.currentEntity) {
                const { id, viewId } = action.payload;
                if (state.currentEntity.id === id) {
                    state.currentEntity.viewIds = state.currentEntity.viewIds.filter(v => v !== viewId);
                }
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(getEntity.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getEntity.fulfilled, (state, action) => {
                state.loading = false;
                state.currentEntity = action.payload;
            })
            .addCase(getEntity.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch entity';
            })
            .addCase(getEntities.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(getEntities.fulfilled, (state, action) => {
                state.loading = false;
                state.entities = action.payload;
            })
            .addCase(getEntities.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch entities';
            });
    }
});

export const { addValue, deleteValue, addView, deleteView } = entitiesSlice.actions;
export default entitiesSlice.reducer; 