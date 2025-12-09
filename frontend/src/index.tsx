import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { MapProvider } from 'react-map-gl/maplibre';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ApolloProvider } from '@apollo/client/react';
import apolloClient from '@/api/apollo-client';
import App from '@/App';
import DevTools from '@/components/DevTools';
import theme from '@/theme';
import './index.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: Infinity,
            retry: false,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
            refetchOnReconnect: false,
        },
    },
});

const container = document.getElementById('root');
if (!container) {
    throw new Error('Root container not found');
}

const root = createRoot(container);
root.render(
    <StrictMode>
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <ApolloProvider client={apolloClient}>
                <QueryClientProvider client={queryClient}>
                    <DevTools enabled={!import.meta.env.PROD}>
                        <MapProvider>
                            <App />
                        </MapProvider>
                    </DevTools>
                </QueryClientProvider>
            </ApolloProvider>
        </ThemeProvider>
    </StrictMode>,
);
