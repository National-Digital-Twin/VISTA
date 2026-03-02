import { ApolloProvider } from '@apollo/client/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { MapProvider } from 'react-map-gl/maplibre';
import apolloClient from '@/api/apollo-client';
import App from '@/App';
import DevTools from '@/components/DevTools';
import SessionMonitorProvider from '@/providers/SessionMonitorProvider';
import UserStartupProvider from '@/providers/UserStartupProvider';
import theme from '@/theme';
import { handleAuthError } from '@/utils/authErrorHandler';
import './index.css';

const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onError: handleAuthError,
    }),
    mutationCache: new MutationCache({
        onError: handleAuthError,
    }),
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
                    <SessionMonitorProvider>
                        <UserStartupProvider>
                            <DevTools enabled={!import.meta.env.PROD}>
                                <MapProvider>
                                    <App />
                                </MapProvider>
                            </DevTools>
                        </UserStartupProvider>
                    </SessionMonitorProvider>
                </QueryClientProvider>
            </ApolloProvider>
        </ThemeProvider>
    </StrictMode>,
);
