import React from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import RootComponent from './RootComponent'
import { persistor, store } from './store/store'
import { ThemeProvider, createTheme } from '@mui/material/styles'
// import material from '@mui/material' // Invalid import - removed

// Expose limited globals for dynamic views
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = window as any;
if (!w.react) {
    w['react'] = React;
    // Map commonly used MUI components for dynamic views. Add here used components on the dynamic views.
    // w['@mui/material'] = material; // Removed due to invalid import

    // Minimal internal helpers that dynamic views can use
    w['internal'] = {
        apiRequest: async (path: string, method: string, body?: unknown) => {
            const res = await fetch(`/api/${path}`.replace(/\/+/, '/'), {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined,
            });
            if (!res.ok) throw new Error(`${method} ${path} failed: ${res.status}`);
            return res.json();
        },
    };
    //Use this in the dynamic views. Example:
    //Container = windows['@mui/material'];
}

const theme = createTheme({
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
