import React from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import RootComponent from './RootComponent'
import { persistor, store } from './store/store'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import * as material from '@mui/material'
import { getEntities, getEntity } from './store/actions/thunkActions/entities'
import { pickLocalizedName } from './constants/entityParents'
import { urlLanguageService } from './services/urlLanguageService'

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
            const res = await fetch(`/api/${path}`.replace(/\/+/, '/'), {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined,
            });
            if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status}`);
            return res.json();
        },
        store: {
            getState: () => store.getState(),
            dispatch: (action: unknown) => store.dispatch(action as any),
        },
        entities: {
            getEntities: (params: {
                data: {
                    ids?: string[];
                    idsToFindParents?: string[];
                    parentIds?: string[];
                    skip?: number;
                    take?: number;
                    includeValues?: boolean;
                };
                storageVariable?: string;
                cache?: boolean;
            }) => store.dispatch(getEntities(params as any)),
            getEntity: (params: { id: string; version?: number; lang?: string; fromCache?: boolean }) =>
                store.dispatch(getEntity(params)),
        },
        localization: {
            getLanguageId: (langCode: string) => urlLanguageService.getLanguageId(langCode),
            pickLocalizedName: (values: unknown[], lang: string | undefined, fallback: string) =>
                pickLocalizedName(values as any, lang, fallback, (langCode) => urlLanguageService.getLanguageId(langCode)),
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
        // eslint-disable-next-line no-console
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
