import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import Layout from '@/components/Layout';
import config from '@/config/app-config';
import AdminSettings from '@/pages/AdminSettings';
import DataRoom from '@/pages/DataRoom';
import GroupDetail from '@/pages/GroupDetail';
import InviteNewUser from '@/pages/InviteNewUser';
import LegacyMap from '@/pages/LegacyMap';
import ScenarioMap from '@/pages/ScenarioMap';
import Notifications from '@/pages/Notifications';
import PrivacyNotice from '@/pages/PrivacyNotice';
import Profile from '@/pages/Profile';

library.add(fas);

const AppWrapper = () => {
    const router = createBrowserRouter([
        {
            element: <Layout />,
            children: [
                { path: '', element: <ScenarioMap /> },
                { path: 'legacy-map', element: <LegacyMap /> },
                { path: 'data-room', element: <DataRoom /> },
                { path: 'profile', element: <Profile /> },
                { path: 'admin', element: <AdminSettings /> },
                { path: 'admin/invite', element: <InviteNewUser /> },
                { path: 'notifications', element: <Notifications /> },
                { path: 'privacy', element: <PrivacyNotice /> },
                { path: 'user/:userId', element: <Profile /> },
                { path: 'group/:groupName', element: <GroupDetail /> },
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
