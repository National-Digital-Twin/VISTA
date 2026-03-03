import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import DataRoom from '@/components/DataRoom';
import Layout from '@/components/Layout';
import DataSourceDetail from '@/pages/DataSourceDetail';
import DataSource from '@/pages/DataSources';
import EditScenario from '@/pages/EditScenario';
import ManageScenario from '@/pages/ManageScenario';
import ManageScenarios from '@/pages/ManageScenarios';
import theme from '@/theme';

export const renderWithAppProviders = (initialEntries = ['/data-room']) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
        },
    });

    const router = createMemoryRouter(
        [
            {
                element: <Layout />,
                children: [
                    {
                        path: 'data-room',
                        element: <DataRoom />,
                        children: [
                            { index: true, element: <DataSource /> },
                            { path: 'data-source/:id', element: <DataSourceDetail /> },
                            { path: 'scenarios', element: <ManageScenarios /> },
                            { path: 'scenarios/:id', element: <ManageScenario /> },
                            { path: 'scenarios/:id/edit', element: <EditScenario /> },
                        ],
                    },
                ],
            },
        ],
        { initialEntries },
    );

    return render(
        <ThemeProvider theme={theme}>
            <QueryClientProvider client={queryClient}>
                <RouterProvider router={router} />
            </QueryClientProvider>
        </ThemeProvider>,
    );
};
