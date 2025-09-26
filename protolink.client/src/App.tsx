import React from 'react'
import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import RootComponent from './RootComponent'
import { persistor, store } from './store/store'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import { Container, Button, InputAdornment, IconButton } from '@mui/material'
import { LanguageProvider } from './contexts/LanguageContext'

// Expose limited globals for dynamic views
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w = window as any;
if (!w.react) {
    w['react'] = React;
    // Map commonly used MUI components to legacy-like keys
    w['@material-ui/core/Container'] = Container;
    w['@material-ui/core/Button'] = Button;
    w['@material-ui/core/InputAdornment'] = InputAdornment;
    w['@material-ui/core/IconButton'] = IconButton;

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
                    <LanguageProvider>
                        <RootComponent />
                    </LanguageProvider>
                </PersistGate>
            </Provider>
        </ThemeProvider>
    )
}

export default App






//import { useEffect, useState, Suspense } from 'react';
//import Component1 from './components/Component1.tsx';
//import Component2 from './components/Component2.tsx';
//import './App.css';

////const Component1 = React.lazy(() => import('./Component1.tsx'));
////const Component2 = React.lazy(() => import('./Component2.tsx'));

//interface Forecast {
//    date: string;
//    temperatureC: number;
//    temperatureF: number;
//    summary: string;
//}

//function App() {
//    const [forecasts, setForecasts] = useState<Forecast[]>();

//    const [expanded, setExpanded] = useState(false);

//    const handleChange = () => {
//        setExpanded(!expanded);
//    };


//    useEffect(() => {
//        populateWeatherData();
//    }, []);

//    const contents = forecasts === undefined
//        ? <p><em>Loading... Please refresh once the ASP.NET backend has started. See <a href="https://aka.ms/jspsintegrationreact">https://aka.ms/jspsintegrationreact</a> for more details.</em></p>
//        : <table className="table table-striped" aria-labelledby="tableLabel">
//            <thead>
//                <tr>
//                    <th>Date</th>
//                    <th>Temp. (C)</th>
//                    <th>Temp. (F)</th>
//                    <th>Summary</th>
//                </tr>
//            </thead>
//            <tbody>
//                {forecasts.map(forecast =>
//                    <tr key={forecast.date}>
//                        <td>{forecast.date}</td>
//                        <td>{forecast.temperatureC}</td>
//                        <td>{forecast.temperatureF}</td>
//                        <td>{forecast.summary}</td>
//                    </tr>
//                )}
//            </tbody>
//        </table>;

//    return (
//        <div>
//            <div>
//                <button onClick={handleChange}>toggle</button>

//                <Suspense fallback={<div>Loading...</div>}>
//                    {expanded ? <Component1 /> : <Component2/>}
//                </Suspense>

//            </div>
//            <h1 id="tableLabel">Weather forecast</h1>
//            <p>This component demonstrates fetching data from the server.</p>
//            {contents}
//        </div>
//    );

//    async function populateWeatherData() {
//        const response = await fetch('weatherforecast');
//        if (response.ok) {
//            const data = await response.json();
//            setForecasts(data);
//        }
//    }
//}

//export default App;