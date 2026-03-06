// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import DataRoom from '@/components/DataRoom';
import Layout from '@/components/Layout';
import config from '@/config/app-config';
import AdminSettings from '@/pages/AdminSettings';
import DataSourceDetail from '@/pages/DataSourceDetail';
import DataSource from '@/pages/DataSources';
import EditScenario from '@/pages/EditScenario';
import InviteNewUser from '@/pages/InviteNewUser';
import ManageScenario from '@/pages/ManageScenario';
import ManageScenarios from '@/pages/ManageScenarios';
import Notifications from '@/pages/Notifications';
import PrivacyNotice from '@/pages/PrivacyNotice';
import Profile from '@/pages/Profile';
import ScenarioMap from '@/pages/ScenarioMap';

library.add(fas);

const AppWrapper = () => {
    const router = createBrowserRouter([
        {
            element: <Layout />,
            children: [
                { path: '', element: <ScenarioMap /> },
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
                { path: 'profile', element: <Profile /> },
                { path: 'admin', element: <AdminSettings /> },
                { path: 'admin/invite', element: <InviteNewUser /> },
                { path: 'notifications', element: <Notifications /> },
                { path: 'privacy', element: <PrivacyNotice /> },
                { path: 'user/:userId', element: <Profile /> },
            ],
        },
    ]);

    return <RouterProvider router={router} />;
};

export default function App() {
    if (config.configErrors.length > 0) {
        return (
            <p className="mx-5 my-2">
                Errors encountered on boot:
                <ul>
                    {config.configErrors.map((error) => (
                        <li className="ml-2" key={error}>
                            — {error}
                        </li>
                    ))}
                </ul>
            </p>
        );
    }

    return <AppWrapper />;
}
