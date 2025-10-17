import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import TabsContainer from './TabsContainer';

vi.mock('./style.module.css', () => ({
    default: {
        tabsContainer: 'tabsContainer',
        tabList: 'tabList',
        tabButton: 'tabButton',
        active: 'active',
        tabContent: 'tabContent',
    },
}));

describe('TabsContainer', () => {
    const tabs = [
        { label: 'Tab 1', content: <div>Content for Tab 1</div> },
        { label: 'Tab 2', content: <div>Content for Tab 2</div> },
        { label: 'Tab 3', content: <div>Content for Tab 3</div> },
    ];

    it('renders all tab labels', () => {
        render(<TabsContainer tabs={tabs} />);
        for (const tab of tabs) {
            expect(screen.getByText(tab.label)).toBeInTheDocument();
        }
    });

    it('shows content for the first tab by default', () => {
        render(<TabsContainer tabs={tabs} />);
        expect(screen.getByText('Content for Tab 1')).toBeVisible();
    });

    it('displays correct content when a tab is clicked', async () => {
        render(<TabsContainer tabs={tabs} />);
        const user = userEvent.setup();

        
        await user.click(screen.getByText('Tab 2'));
        expect(screen.getByText('Content for Tab 2')).toBeVisible();

        
        await user.click(screen.getByText('Tab 3'));
        expect(screen.getByText('Content for Tab 3')).toBeVisible();
    });
});
