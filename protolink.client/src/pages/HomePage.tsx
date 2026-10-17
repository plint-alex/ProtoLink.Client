import React, { useEffect, useMemo, useState } from 'react';
import { CircularProgress, Skeleton, Stack } from '@mui/material';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import LockOutlined from '@mui/icons-material/LockOutlined';
import SearchOff from '@mui/icons-material/SearchOff';
import { useLocation, useParams, useSearchParams } from 'react-router-dom';
import { loadViewScript, type ViewLoadError } from '../store/actions/thunkActions/entities';
import { useAppDispatch, useAppSelector } from '../store/store';
import type { EntitiesStatePart } from '../store/entitiesSlice';
import type { EntityViewMapping } from '../types/view';
import ErrorBoundary from '../ErrorBoundary';
import EntityState from '../components/EntityState';
import { useDelayedFlag } from '../hooks/useDelayedFlag';
import { useNavigationWithParams } from '../hooks/useNavigationWithParams';
import { DEFAULT_HOME_ENTITY_ID, DEFAULT_HOME_LANG } from '../constants/home';
import { TOP_MENU_DEFAULTS_EN, textCatalogService } from '../services/textCatalogService';
import { ROUTES, SYSTEM_PAGE_CODES } from '../resources/routes-constants';

const EMPTY_MAPPINGS: readonly EntityViewMapping[] = [];
const LOADING_SKELETON_DELAY_MS = 300;

type ViewLoad = {
    entityId: string;
    error?: ViewLoadError;
    done: boolean;
};

const HomePage: React.FC = () => {
    const { id: routeEntityId } = useParams<{ id?: string }>();
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const dispatch = useAppDispatch();
    const navigateWithParams = useNavigationWithParams();

    const lang = useMemo(() => {
        const value = searchParams.get('lang');
        return value ?? undefined;
    }, [searchParams]);
    const catalogLang = lang || DEFAULT_HOME_LANG;
    const [shellTexts, setShellTexts] = useState<Record<string, string>>({});
    const [viewLoad, setViewLoad] = useState<ViewLoad | null>(null);

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

    const t = (code: keyof typeof TOP_MENU_DEFAULTS_EN) => shellTexts[code] || TOP_MENU_DEFAULTS_EN[code];

    // All hooks must be called before any conditional returns
    const entitiesState = useAppSelector((state) => state.entities as EntitiesStatePart);
    const authentication = useAppSelector((state) => state.authentication);
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
        let cancelled = false;
        setViewLoad({ entityId, done: false });
        void dispatch(loadViewScript({ entityId, lang })).then((action) => {
            if (cancelled) {
                return;
            }
            const error = loadViewScript.rejected.match(action)
                ? (action.payload ?? { detail: action.error.message ?? '' })
                : undefined;
            setViewLoad({ entityId, error, done: true });
        });
        return () => {
            cancelled = true;
        };
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
        return typeof candidate === 'function' ? (candidate as React.ComponentType<{ entityId?: string; lang?: string }>) : null;
    }, [viewId]);

    const currentLoad = viewLoad?.entityId === entityId ? viewLoad : null;
    const loadError = currentLoad?.error;
    const viewLoading = !currentLoad?.done;
    const showSkeleton = useDelayedFlag(viewLoading && !DynamicComponent, LOADING_SKELETON_DELAY_MS);

    // If no entity ID in URL, show loading while redirect happens
    // This check must come AFTER all hooks are called
    if (routeEntityId === undefined) {
        return (
            <Stack spacing={2} sx={{ p: 3 }}>
                <CircularProgress sx={{ alignSelf: 'center' }} />
            </Stack>
        );
    }

    const goHome = { label: t('home-go-home'), to: ROUTES.HOMEPAGE_ROUTE };
    const signIn = {
        label: t('home-sign-in'),
        to: `${ROUTES.LOGIN_ROUTE}?returnurl=${encodeURIComponent(`${location.pathname}${location.search}`)}`,
    };

    const renderLoadError = (error: ViewLoadError) => {
        const common = { detailsLabel: t('home-details'), details: error.detail };
        if (error.code === 'not_found') {
            return <EntityState icon={<SearchOff />} title={t('home-not-found')} action={goHome} {...common} />;
        }
        if (error.code === 'no_access') {
            return (
                <EntityState
                    icon={<LockOutlined />}
                    title={t('home-no-access')}
                    subtitle={isAuthenticated ? undefined : t('home-no-access-signed-out')}
                    action={isAuthenticated ? goHome : signIn}
                    {...common}
                />
            );
        }
        return <EntityState icon={<ErrorOutline />} title={t('home-load-failed')} action={goHome} {...common} />;
    };

    return (
        <Stack spacing={2} sx={{ p: 3 }}>
            {loadError && renderLoadError(loadError)}

            {!loadError && DynamicComponent && (
                <ErrorBoundary>
                    <DynamicComponent entityId={entityId} lang={lang} />
                </ErrorBoundary>
            )}

            {!loadError && !DynamicComponent && showSkeleton && (
                <Stack spacing={1.5} aria-busy="true">
                    <Skeleton variant="text" width="40%" height={40} />
                    <Skeleton variant="rounded" height={56} />
                    <Skeleton variant="rounded" height={56} />
                    <Skeleton variant="rounded" height={56} />
                </Stack>
            )}

            {!loadError && !DynamicComponent && !viewLoading && (
                <EntityState
                    icon={<ErrorOutline />}
                    title={t('home-view-unavailable')}
                    action={goHome}
                    detailsLabel={t('home-details')}
                    details={entityId}
                />
            )}
        </Stack>
    );
};

export default HomePage;
