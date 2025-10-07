import { library } from '@fortawesome/fontawesome-svg-core';
import { fas } from '@fortawesome/free-solid-svg-icons';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

import PrivacyNotice from './components/PrivacyNotice/PrivacyNotice';
import AppBody from '@/components/AppBody';
import Layout from '@/components/Layout';
import config from '@/config/app-config';
import AdminSettings from '@/pages/AdminSettings';
import DataRoom from '@/pages/DataRoom';
import Notifications from '@/pages/Notifications';
import Profile from '@/pages/Profile';

library.add(fas);

const AppWrapper = () => {
    const router = createBrowserRouter([
        {
            element: <Layout />,
            children: [
                { path: '', element: <AppBody /> },
                { path: 'data-room', element: <DataRoom /> },
                { path: 'profile', element: <Profile /> },
                { path: 'admin-settings', element: <AdminSettings /> },
                { path: 'notifications', element: <Notifications /> },
                { path: 'privacy', element: <PrivacyNotice /> },
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
