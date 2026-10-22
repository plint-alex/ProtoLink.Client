import React from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import RootComponent from './RootComponent'
import { persistor, store } from './store/store'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import * as material from '@mui/material'
import FolderOutlined from '@mui/icons-material/FolderOutlined'
import InsertDriveFileOutlined from '@mui/icons-material/InsertDriveFileOutlined'
import { getEntities, getEntity, type GetEntitiesParams } from './store/actions/thunkActions/entities'
import { pickLocalizedName, type EntityValueLike } from './constants/entityParents'
import { filterByLanguage } from './services/filterByLanguage'
import { urlLanguageService } from './services/urlLanguageService'
import type { UnknownAction } from '@reduxjs/toolkit'
import {
    clearShareSessionIfEntity,
    getShareAccessToken,
    getShareRawToken,
    getShareSessionMeta,
    markShareCredentialUsed,
    wasShareCredentialUsed,
} from './services/shareSession'

// Expose limited globals for dynamic views
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = window as any;
if (!w.react) {
    // Core React exports
    w['react'] = React;
    w['React'] = React;
    
    // React hooks and utilities
    w['useState'] = React.useState;
    w['useEffect'] = React.useEffect;
    w['useMemo'] = React.useMemo;
    w['useCallback'] = React.useCallback;
    w['createElement'] = React.createElement;
    
    // Material-UI components
    w['@mui/material'] = material;
    w['mui'] = material; // Shorter alias
    w['muiIcons'] = {
        FolderOutlined,
        InsertDriveFileOutlined,
    }
    
    // Common Material-UI components for convenience
    w['Box'] = material.Box;
    w['Typography'] = material.Typography;
    w['Button'] = material.Button;
    w['TextField'] = material.TextField;
    w['Paper'] = material.Paper;
    w['Grid'] = material.Grid;
    w['Container'] = material.Container;
    w['Card'] = material.Card;
    w['CardContent'] = material.CardContent;
    w['CardActions'] = material.CardActions;

    // Internal helpers for dynamic views
    const existingInternal = w['internal'] ?? {};
    w['internal'] = {
        ...existingInternal,
        apiRequest: async (path: string, method: string, body?: unknown) => {
            // Prefer user JWT (S4: never reduce privilege); fall back to share JWT for guests.
            const userToken = (store.getState().authentication?.accessToken || '').trim();
            const shareToken = getShareAccessToken();
            let bearer = userToken || shareToken;
            if (!userToken && shareToken) {
                markShareCredentialUsed();
                bearer = shareToken;
            }
            const headers: Record<string, string> = {
                Accept: 'application/json',
                'Content-Type': 'application/json',
            };
            if (bearer) headers.Authorization = `Bearer ${bearer}`;
            const res = await fetch(`/api/${path}`.replace(/\/+/, '/'), {
                method,
                headers,
                body: body !== undefined && body !== null ? JSON.stringify(body) : undefined,
            });
            if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status}`);
            const text = await res.text();
            if (!text) return null;
            try {
                return JSON.parse(text);
            } catch {
                return text;
            }
        },
        store: {
            getState: () => store.getState(),
            dispatch: (action: unknown) => store.dispatch(action as UnknownAction),
        },
        entities: {
            getEntities: (params: GetEntitiesParams) => store.dispatch(getEntities(params)),
            getEntity: (params: { id: string; version?: number; lang?: string; fromCache?: boolean }) =>
                store.dispatch(getEntity(params)),
        },
        localization: {
            getLanguageId: (langCode: string) => urlLanguageService.getLanguageId(langCode),
            pickLocalizedName: (values: unknown[], lang: string | undefined, fallback: string) =>
                pickLocalizedName(values as EntityValueLike[], lang, fallback, (langCode) => urlLanguageService.getLanguageId(langCode)),
            /** Always prefer awaiting this before pickLocalizedName so language parent GUIDs resolve. */
            loadLanguages: () => urlLanguageService.loadLanguages(),
            /** Convenience: load language entities then pick (use from dynamic views). */
            pickLocalizedNameAsync: async (
                values: unknown[],
                lang: string | undefined,
                fallback: string
            ) => {
                await urlLanguageService.loadLanguages();
                return pickLocalizedName(
                    values as EntityValueLike[],
                    lang,
                    fallback,
                    (langCode) => urlLanguageService.getLanguageId(langCode)
                );
            },
            /** L4: hide language-tagged entities for other langs; untagged shown everywhere. */
            filterByLanguage: (entities: unknown[], lang: string) =>
                filterByLanguage(
                    entities as Parameters<typeof filterByLanguage>[0],
                    lang,
                    (langCode) => urlLanguageService.getLanguageId(langCode)
                ),
        },
        /** Guest-link session helpers for cloud-explorer read-only chrome (share-sheet-ux §5 / §7b). */
        shareSession: {
            hasSession: () => Boolean(getShareRawToken()),
            /** True when Authorization used the share JWT (anon guest or signed-in fallback). */
            isGuestMode: () => wasShareCredentialUsed(),
            getRootEntityId: () => getShareSessionMeta()?.entityId ?? null,
            getAccessToken: () => getShareAccessToken(),
            /** UX-LS-3: clear guest session only when it matches the left share root. */
            clearIfEntity: (entityId: string) => clearShareSessionIfEntity(entityId),
        },
    };
    
    // Usage examples for dynamic views:
    // const React = window['react'];
    // const { Box, Typography } = window['mui'];
    // const { useState, useEffect } = window['react'];
}

const theme = createTheme({
    palette: {
        primary: {
            main: '#4285F4', // Google Blue
            light: '#669DF6',
            dark: '#1A73E8',
            contrastText: '#FFFFFF',
        },
        secondary: {
            main: '#34A853', // Google Green
            light: '#66BB6A',
            dark: '#2E7D32',
            contrastText: '#FFFFFF',
        },
        error: {
            main: '#EA4335', // Google Red
            light: '#EF5350',
            dark: '#C62828',
            contrastText: '#FFFFFF',
        },
        warning: {
            main: '#FBBC04', // Google Yellow
            light: '#FFC107',
            dark: '#F57C00',
            contrastText: '#202124',
        },
        info: {
            main: '#4285F4', // Google Blue
            light: '#669DF6',
            dark: '#1A73E8',
            contrastText: '#FFFFFF',
        },
        success: {
            main: '#34A853', // Google Green
            light: '#66BB6A',
            dark: '#2E7D32',
            contrastText: '#FFFFFF',
        },
        background: {
            default: '#FFFFFF',
            paper: '#FFFFFF',
        },
        text: {
            primary: '#202124',
            secondary: '#5F6368',
        },
        divider: '#DADCE0',
    },
    mixins: {
        toolbar: {
            minHeight: 75,
            '@media (min-width:0px) and (orientation: landscape)': {
                minHeight: 75,
            },
            '@media (min-width:600px)': {
                minHeight: 75,
            },
        },
    },
});


const App: React.FC = () => {
    // Minimal debug visibility on page
    if (typeof window !== 'undefined') {
        console.log('[App] mount', {
            location: window.location.href,
        })
    }

    return (
        <ThemeProvider theme={theme}>
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                    <RootComponent />
                </PersistGate>
            </Provider>
        </ThemeProvider>
    )
}

export default App
