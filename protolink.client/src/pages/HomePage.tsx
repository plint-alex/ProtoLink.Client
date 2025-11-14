import React, { useEffect, useMemo } from 'react';
import { Alert, Box, CircularProgress, Stack, Typography } from '@mui/material';
import { useParams, useSearchParams } from 'react-router-dom';
import { loadViewScript } from '../store/actions/thunkActions/entities';
import { useAppDispatch, useAppSelector } from '../store/store';
import type { EntitiesStatePart } from '../store/entitiesSlice';
import type { EntityViewMapping } from '../types/view';
import ErrorBoundary from '../ErrorBoundary';

const DEFAULT_HOME_ENTITY_ID = '4cca22a8-bf99-4c52-a753-c820969925c3';
const EMPTY_MAPPINGS: EntityViewMapping[] = Object.freeze([] as EntityViewMapping[]);

const HomePage: React.FC = () => {
    const { id: routeEntityId } = useParams<{ id?: string }>();
    const [searchParams] = useSearchParams();
    const dispatch = useAppDispatch();

    const lang = useMemo(() => {
        const value = searchParams.get('lang');
        return value ?? undefined;
    }, [searchParams]);

    const entityId = routeEntityId ?? DEFAULT_HOME_ENTITY_ID;

    const entitiesState = useAppSelector((state) => state.entities as EntitiesStatePart);
    const loading = entitiesState.loading;
    const error = entitiesState.error;
    const mappings = entitiesState.entityViews?.[entityId] ?? EMPTY_MAPPINGS;
    const scripts = entitiesState.viewScripts?.[entityId];

    useEffect(() => {
        if (!entityId) {
            return;
        }

        void dispatch(loadViewScript({ entityId, lang }));
    }, [dispatch, entityId, lang]);

    const viewId = useMemo(() => {
        if (!mappings || mappings.length === 0) {
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
    }, [viewId, mappings]);

    const originalScript = scripts?.original;
    const transpiledScript = scripts?.transpiled;

    const renderCodeBlock = (label: string, code: string) => (
        <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 0.5 }}>
                {label}
            </Typography>
            <Box
                component="pre"
                sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    fontFamily: 'Roboto Mono, Fira Code, Consolas, monospace',
                    fontSize: '0.85rem',
                    p: 2,
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: '#0f172a',
                    color: '#e2e8f0',
                    maxHeight: 400,
                    overflow: 'auto'
                }}
            >
                {code}
            </Box>
        </Box>
    );

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

            {(originalScript || transpiledScript) && (
                <Stack spacing={2}>
                    {originalScript && renderCodeBlock('Original Script', originalScript)}
                    {transpiledScript && renderCodeBlock('Transpiled Script', transpiledScript)}
                </Stack>
            )}
        </Stack>
    );
};

export default HomePage;