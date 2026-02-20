import { ThemeProvider } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import Layout from '@/components/Layout';
import DataRoom from '@/components/DataRoom';
import DataSource from '@/pages/DataSources';
import DataSourceDetail from '@/pages/DataSourceDetail';
import ManageScenarios from '@/pages/ManageScenarios';
import ManageScenario from '@/pages/ManageScenario';
import EditScenario from '@/pages/EditScenario';
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
