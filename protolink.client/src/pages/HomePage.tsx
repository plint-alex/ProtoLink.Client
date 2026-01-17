import React, { useEffect, useMemo } from 'react';
import { Alert, CircularProgress, Stack } from '@mui/material';
import { useParams, useSearchParams } from 'react-router-dom';
import { loadViewScript } from '../store/actions/thunkActions/entities';
import { useAppDispatch, useAppSelector } from '../store/store';
import type { EntitiesStatePart } from '../store/entitiesSlice';
import type { EntityViewMapping } from '../types/view';
import ErrorBoundary from '../ErrorBoundary';
import { useNavigationWithParams } from '../hooks/useNavigationWithParams';

const DEFAULT_HOME_ENTITY_ID = '4cca22a8-bf99-4c52-a753-c820969925c3';
const EMPTY_MAPPINGS: readonly EntityViewMapping[] = [];

const HomePage: React.FC = () => {
    const { id: routeEntityId } = useParams<{ id?: string }>();
    const [searchParams] = useSearchParams();
    const dispatch = useAppDispatch();
    const navigateWithParams = useNavigationWithParams();
    const authData = useAppSelector((state) => state.authentication);

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
    
    // Check if we've already attempted to load views for this entity
    // (even if the result was empty, we don't want to retry infinitely)
    const hasAttemptedLoad = entityId ? (entitiesState.entityViews?.[entityId] !== undefined) : false;

    // Redirect logic: if no entity ID in URL, redirect to user entity or default home entity
    useEffect(() => {
        if (routeEntityId === undefined) {
            // No entity ID in URL - need to redirect
            if (authData?.userId && authData?.accessToken) {
                // User is logged in - redirect to their entity
                navigateWithParams(`/${authData.userId}`, { replace: true });
            } else {
                // User is not logged in - redirect to default home entity
                navigateWithParams(`/${DEFAULT_HOME_ENTITY_ID}`, { replace: true });
            }
        }
    }, [routeEntityId, authData?.userId, authData?.accessToken, navigateWithParams]);

    useEffect(() => {
        if (!entityId) {
            return;
        }

        // Only dispatch if we haven't already attempted to load the view data for this entity
        // This prevents duplicate requests and infinite loops when entityViews is empty
        if (!hasAttemptedLoad) {
            void dispatch(loadViewScript({ entityId, lang }));
        }
    }, [entityId, lang, hasAttemptedLoad, dispatch]);

    const viewId = useMemo(() => {
        if (!entityId || !mappings || mappings.length === 0) {
            return null;
        }

        const matching = mappings.find((m) => m.entityId === entityId);
        return matching?.viewId ?? mappings[0]?.viewId ?? null;
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