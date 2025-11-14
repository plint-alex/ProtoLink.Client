import { createSlice } from '@reduxjs/toolkit';
import { Entity } from '../types/entities';
import type { Dictionary } from '../types/dictionary';
import {
    getEntity,
    getEntities,
    addEntity,
    addEntityAndSelect,
    updateEntity,
    deleteEntity,
    addParent,
    removeParent,
    addPermission,
    loadViewScript
} from './actions/thunkActions/entities';
import { EntityViewMapping } from '../types/view';

export interface EntitiesStatePart {
    currentEntity: Entity | null;
    entities: Dictionary<Entity>;
    entityViews: Dictionary<EntityViewMapping[]>;
    loading: boolean;
    error: string | null;
    viewScripts: Dictionary<{ original?: string; transpiled?: string }>;
}

export type EntitiesState = Dictionary<Entity[]> | Dictionary<Entity> | EntitiesStatePart

const initialState: EntitiesState = {
    currentEntity: null,
    entities: { },
    entityViews: { },
    loading: false,
    error: null,
    viewScripts: {}
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

                (state as EntitiesState as Dictionary<Entity>)[action.payload.id] = { ...(state as EntitiesState as Dictionary<Entity[]>)[action.payload.id], ...action.payload };
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

                if (action.payload.storageVariable) {
                    (state as EntitiesState as Dictionary<Entity[]>)[action.payload.storageVariable] = action.payload.data;
                }

                if (action.payload.data) {
                    for (const entity of action.payload.data) {
                        (state as EntitiesState as Dictionary<Entity>)[entity.id] = { ...(state as EntitiesState as Dictionary<Entity[]>)[entity.id], ...entity };
                    }
                }
            })
            .addCase(getEntities.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to fetch entities';
            })
            .addCase(addEntity.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addEntity.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(addEntity.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to add entity';
            })
            .addCase(addEntityAndSelect.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addEntityAndSelect.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(addEntityAndSelect.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to add and select entity';
            })
            .addCase(updateEntity.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateEntity.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(updateEntity.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to update entity';
            })
            .addCase(deleteEntity.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteEntity.fulfilled, (state) => {
                state.loading = false;
                state.currentEntity = null;
            })
            .addCase(deleteEntity.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to delete entity';
            })
            .addCase(addParent.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addParent.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(addParent.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to add parent';
            })
            .addCase(removeParent.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(removeParent.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(removeParent.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to remove parent';
            })
            .addCase(addPermission.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(addPermission.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(addPermission.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to add permission';
            })
            .addCase(loadViewScript.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(loadViewScript.fulfilled, (state, action) => {
                state.loading = false;
                state.entityViews = {
                    ...state.entityViews,
                    [action.payload.entityId]: action.payload.entityViews
                };
                state.viewScripts = {
                    ...state.viewScripts,
                    [action.payload.entityId]: {
                        original: action.payload.originalScript,
                        transpiled: action.payload.transpiledScript
                    }
                };
            })
            .addCase(loadViewScript.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message || 'Failed to load view script';
            });
    }
});

export const { addValue, deleteValue, addView, deleteView } = entitiesSlice.actions;
export default entitiesSlice.reducer; 