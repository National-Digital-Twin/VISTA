import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithDynamicRoute } from '../test-utils/test-helpers';
import GroupDetail from './GroupDetail';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

const renderWithGroupName = (groupName: string) => {
    return renderWithDynamicRoute(<GroupDetail />, {
        path: '/group/:groupName',
        initialEntries: [`/group/${encodeURIComponent(groupName)}`],
    });
};

describe('GroupDetail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockNavigate.mockReset();
    });

    describe('Rendering', () => {
        it('renders all page elements', () => {
            renderWithGroupName('test-group');

            expect(screen.getByText('Group Details')).toBeInTheDocument();
            expect(screen.getByText('Back to Users')).toBeInTheDocument();
            expect(screen.getByText('Coming Soon')).toBeInTheDocument();
            expect(screen.getByText('Group detail information will be available here soon.')).toBeInTheDocument();

            const h1 = screen.getByRole('heading', { level: 1 });
            expect(h1).toHaveTextContent('Group Details');
        });

        it('displays group names correctly', () => {
            renderWithGroupName('Resilience team');
            expect(screen.getByText('Group: Resilience team')).toBeInTheDocument();

            renderWithGroupName('Test%20Group');
            expect(screen.getByText('Group: Test Group')).toBeInTheDocument();
        });
    });

    describe('Navigation', () => {
        it('navigates to admin users tab when back button is clicked', () => {
            renderWithGroupName('test-group');

            const backButton = screen.getByText('Back to Users');
            fireEvent.click(backButton);

            expect(mockNavigate).toHaveBeenCalledWith('/admin?tab=users');
        });
    });
});
