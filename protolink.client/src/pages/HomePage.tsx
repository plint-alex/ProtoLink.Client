import React, { useEffect, useMemo, useState } from 'react';
import { Alert, CircularProgress, Stack } from '@mui/material';
import { useParams, useSearchParams } from 'react-router-dom';
import { loadViewScript } from '../store/actions/thunkActions/entities';
import { useAppDispatch, useAppSelector } from '../store/store';
import type { EntitiesStatePart } from '../store/entitiesSlice';
import type { EntityViewMapping } from '../types/view';
import ErrorBoundary from '../ErrorBoundary';
import { useNavigationWithParams } from '../hooks/useNavigationWithParams';
import { DEFAULT_HOME_ENTITY_ID, DEFAULT_HOME_LANG } from '../constants/home';
import { textCatalogService } from '../services/textCatalogService';
import { SYSTEM_PAGE_CODES } from '../resources/routes-constants';

const HOME_DEFAULTS_EN: Record<string, string> = {
    'home-view-unavailable': 'Dynamic view not available yet for this page.',
};

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
    const catalogLang = lang || DEFAULT_HOME_LANG;
    const [shellTexts, setShellTexts] = useState<Record<string, string>>({});

    const entityId = routeEntityId;

    useEffect(() => {
        let cancelled = false;
        void (async () => {
            try {
                const texts = await textCatalogService.loadPageTexts({
                    lang: catalogLang,
                    systemPageCode: SYSTEM_PAGE_CODES.LAYOUT,
                });
                if (!cancelled) {
                    setShellTexts(texts);
                }
            } catch (error) {
                console.error('[HomePage] failed to load shell texts', error);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [catalogLang]);

    const t = (code: string) => shellTexts[code] || HOME_DEFAULTS_EN[code] || code;

    // All hooks must be called before any conditional returns
    const entitiesState = useAppSelector((state) => state.entities as EntitiesStatePart);
    const authentication = useAppSelector((state) => state.authentication);
    const loading = entitiesState.loading;
    const error = entitiesState.error;
    const mappings = entityId ? (entitiesState.entityViews?.[entityId] ?? EMPTY_MAPPINGS) : EMPTY_MAPPINGS;
    const isAuthenticated = Boolean(authentication?.accessToken);
    const userHomeId = authentication?.userId?.trim();

    // Redirect `/`: signed-in users → their home entity; anonymous → public ProtoLink home entity.
    useEffect(() => {
        if (routeEntityId !== undefined) {
            return;
        }
        const langParam = searchParams.get('lang') ?? DEFAULT_HOME_LANG;
        const q = `lang=${encodeURIComponent(langParam)}`;
        if (isAuthenticated && userHomeId) {
            navigateWithParams(`/${userHomeId}?${q}`, { replace: true });
        } else {
            navigateWithParams(`/${DEFAULT_HOME_ENTITY_ID}?${q}`, { replace: true });
        }
    }, [routeEntityId, navigateWithParams, searchParams, isAuthenticated, userHomeId]);

    // When the URL already contains an entity id (e.g. public home id from the logo), never redirect away from it.

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
                <Alert severity="error" sx={{ whiteSpace: 'pre-wrap' }}>
                    {error}
                </Alert>
            )}

            {DynamicComponent && (
                <ErrorBoundary>
                    <DynamicComponent entityId={entityId} lang={lang} />
                </ErrorBoundary>
            )}

            {!loading && !error && !DynamicComponent && (
                <Alert severity="warning">
                    {t('home-view-unavailable')}
                    {entityId ? ` (${entityId})` : ''}
                </Alert>
            )}
        </Stack>
    );
};

export default HomePage;