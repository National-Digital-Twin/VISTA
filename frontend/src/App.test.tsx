// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const { createBrowserRouterMock, RouterProviderMock, mockedConfig } = vi.hoisted(() => ({
    createBrowserRouterMock: vi.fn(() => ({ mockedRouter: true })),
    RouterProviderMock: vi.fn(() => <div data-testid="router-provider" />),
    mockedConfig: {
        configErrors: [] as string[],
    },
}));

vi.mock('@fortawesome/fontawesome-svg-core', () => ({
    library: {
        add: vi.fn(),
    },
}));

vi.mock('@fortawesome/free-solid-svg-icons', () => ({
    fas: {},
}));

vi.mock('react-router-dom', () => ({
    createBrowserRouter: createBrowserRouterMock,
    RouterProvider: RouterProviderMock,
}));

vi.mock('@/config/app-config', () => ({
    default: mockedConfig,
}));

vi.mock('@/components/Layout', () => ({ default: () => <div>Layout</div> }));
vi.mock('@/components/DataRoom', () => ({ default: () => <div>DataRoom</div> }));
vi.mock('@/pages/AdminSettings', () => ({ default: () => <div>AdminSettings</div> }));
vi.mock('@/pages/DataSourceDetail', () => ({ default: () => <div>DataSourceDetail</div> }));
vi.mock('@/pages/DataSources', () => ({ default: () => <div>DataSources</div> }));
vi.mock('@/pages/EditScenario', () => ({ default: () => <div>EditScenario</div> }));
vi.mock('@/pages/InviteNewUser', () => ({ default: () => <div>InviteNewUser</div> }));
vi.mock('@/pages/ManageScenario', () => ({ default: () => <div>ManageScenario</div> }));
vi.mock('@/pages/ManageScenarios', () => ({ default: () => <div>ManageScenarios</div> }));
vi.mock('@/pages/Notifications', () => ({ default: () => <div>Notifications</div> }));
vi.mock('@/pages/PrivacyNotice', () => ({ default: () => <div>PrivacyNotice</div> }));
vi.mock('@/pages/Profile', () => ({ default: () => <div>Profile</div> }));
vi.mock('@/pages/ScenarioMap', () => ({ default: () => <div>ScenarioMap</div> }));

describe('App', () => {
    beforeEach(() => {
        mockedConfig.configErrors = [];
        createBrowserRouterMock.mockClear();
        RouterProviderMock.mockClear();
    });

    it('renders config errors when present', () => {
        mockedConfig.configErrors = ['Missing config'];

        render(<App />);

        expect(screen.getByText('Errors encountered on boot:')).toBeInTheDocument();
        expect(screen.getByText(/Missing config/)).toBeInTheDocument();
        expect(screen.queryByTestId('router-provider')).not.toBeInTheDocument();
    });

    it('renders app router when config is valid', () => {
        render(<App />);

        expect(createBrowserRouterMock).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('router-provider')).toBeInTheDocument();
    });
});
