import { useState } from 'react';
import { faComment } from '@fortawesome/free-solid-svg-icons';
import { CannyProvider, CannyFeedback } from 'react-canny';
import ToolbarButton from '@/components/Map/SideButtons/ToolbarButton';
import config from '@/config/app-config';

const { appId, boardToken } = config.canny;

export default function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);

    const toggleFeedback = () => {
        setIsOpen(!isOpen);
    };

    const user = {
        alias: 'Yacht club Gull',
        avatarURL: null,
        companies: [],
        created: '2017-03-20T11:36:08.882Z',
        customFields: {},
        email: 'user@example.com',
        id: '58cfbea875bd7f1af665d290', // # pragma: allowlist secret
        isAdmin: false,
        lastActivity: null,
        name: 'John Doe',
        url: 'https://coefficientsystems.canny.io/admin/users/utkarsh-soni-1',
        userID: '1234567890',
    };

    return (
        <CannyProvider appId={appId} user={user}>
            <div className="relative">
                <ToolbarButton title="Feedback" icon={faComment} onClick={toggleFeedback} />

                {isOpen && (
                    <div className="absolute right-12 bottom-1 p-2 w-80 h-96 bg-white shadow-lg rounded-lg overflow-auto">
                        <CannyFeedback boardToken={boardToken} />
                    </div>
                )}
            </div>
        </CannyProvider>
    );
}
