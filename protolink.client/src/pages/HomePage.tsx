import React, { useEffect, useMemo } from 'react';
import { Alert, CircularProgress, Stack } from '@mui/material';
import { useParams, useSearchParams } from 'react-router-dom';
import { loadViewScript } from '../store/actions/thunkActions/entities';
import { useAppDispatch, useAppSelector } from '../store/store';
import type { EntitiesStatePart } from '../store/entitiesSlice';
import type { EntityViewMapping } from '../types/view';
import ErrorBoundary from '../ErrorBoundary';
import { useNavigationWithParams } from '../hooks/useNavigationWithParams';
import { DEFAULT_HOME_ENTITY_ID } from '../constants/home';

const EMPTY_MAPPINGS: readonly EntityViewMapping[] = [];

const HomePage: React.FC = () => {
    const { id: routeEntityId } = useParams<{ id?: string }>();
    const [searchParams] = useSearchParams();
    const dispatch = useAppDispatch();
    const navigateWithParams = useNavigationWithParams();

    const lang = useMemo(() => {
        const value = searchParams.get('lang');
        return value ?? undefined;
    }, [searchParams]);

    const entityId = routeEntityId;

    // All hooks must be called before any conditional returns
    const entitiesState = useAppSelector((state) => state.entities as EntitiesStatePart);
    const loading = entitiesState.loading;
    const error = entitiesState.error;
    const mappings = entityId ? (entitiesState.entityViews?.[entityId] ?? EMPTY_MAPPINGS) : EMPTY_MAPPINGS;
    
    // Redirect logic: root path always resolves to the public/home entity.
    // This must stay distinct from a user profile route (/:userId).
    useEffect(() => {
        if (routeEntityId === undefined) {
            navigateWithParams(`/${DEFAULT_HOME_ENTITY_ID}`, { replace: true });
        }
    }, [routeEntityId, navigateWithParams]);

    useEffect(() => {
        if (!entityId) {
            return;
        }

        // Reload on entity/lang change so stale empty mappings can recover
        // after backend/view updates without forcing a hard page refresh.
        void dispatch(loadViewScript({ entityId, lang }));
    }, [entityId, lang, dispatch]);

    const viewId = useMemo(() => {
        if (!entityId || !mappings || mappings.length === 0) {
            return null;
        }

        const norm = (g: string) => g.replace(/-/g, '').toLowerCase();
        const matching = mappings.find((m) => norm(String(m.entityId)) === norm(entityId));
        const pick = matching?.viewId ?? mappings[0]?.viewId;
        return pick ?? null;
    }, [entityId, mappings]);

    const DynamicComponent = useMemo(() => {
        if (!viewId) {
            return null;
        }

        const candidate = (window as unknown as Record<string, unknown>)[viewId];
        return typeof candidate === 'function' ? (candidate as React.ComponentType<any>) : null;
    }, [viewId]);

    // If no entity ID in URL, show loading while redirect happens
    // This check must come AFTER all hooks are called
    if (routeEntityId === undefined) {
        return (
            <Stack spacing={2} sx={{ p: 3 }}>
                <CircularProgress sx={{ alignSelf: 'center' }} />
            </Stack>
        );
    }

    return (
        <Stack spacing={2} sx={{ p: 3 }}>
            {loading && (
                <CircularProgress sx={{ alignSelf: 'center' }} />
            )}

            {error && (
                <Alert severity="error">{error}</Alert>
            )}

            {DynamicComponent && (
                <ErrorBoundary>
                    <DynamicComponent entityId={entityId} lang={lang} />
                </ErrorBoundary>
            )}

            {!loading && !error && !DynamicComponent && (
                <Alert severity="warning">
                    Dynamic view not available yet for entity {entityId}.
                </Alert>
            )}
        </Stack>
    );
};

export default HomePage;