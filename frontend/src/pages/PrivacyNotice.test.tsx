import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithRouter, renderAndExpectText, renderAndExpectTexts } from '../test-utils/test-helpers';
import PrivacyNotice from './PrivacyNotice';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('PrivacyNotice', () => {
    describe('Rendering', () => {
        it('renders the privacy notice title', () => {
            renderAndExpectText(<PrivacyNotice />, 'Privacy Notice - VISTA');
        });

        it('renders the main privacy notice paragraph', () => {
            renderAndExpectText(<PrivacyNotice />, /This privacy notice explains how the Department for Business and Trade/i);
        });

        it('renders DBT logo', () => {
            renderWithRouter(<PrivacyNotice />);
            const logo = screen.getByAltText('Department for Business & Trade');
            expect(logo).toBeInTheDocument();
            expect(logo).toHaveAttribute('src', '/DBT_logo_black.svg');
        });
    });

    describe('Back Navigation', () => {
        it('renders back button', () => {
            renderWithRouter(<PrivacyNotice />);

            const backButton = screen.getByLabelText('Back');
            expect(backButton).toBeInTheDocument();
        });

        it('calls navigate(-1) when back button is clicked', () => {
            renderWithRouter(<PrivacyNotice />);

            const backButton = screen.getByLabelText('Back');
            fireEvent.click(backButton);

            expect(mockNavigate).toHaveBeenCalledWith(-1);
        });
    });

    describe('Content Sections', () => {
        it('renders all content sections', () => {
            renderAndExpectTexts(<PrivacyNotice />, [
                'Personal data DBT will collect as part of the Pilot',
                'Why DBT asks for this information',
                'The legal basis for processing your personal data',
                'How DBT processes personal data it receives',
                'Third Party Processors',
                'Information sharing',
                'How long will DBT hold your data for',
                'Your rights',
            ]);
        });
    });

    describe('Lists', () => {
        it('renders list content', () => {
            renderAndExpectTexts(<PrivacyNotice />, [/Identifying data:/i, /Contact details:/i, /right to request copies of the personal data/i]);
        });
    });

    describe('Contact Information', () => {
        it('renders contact information', () => {
            renderWithRouter(<PrivacyNotice />);

            const emailLink = screen.getByText('data.protection@businessandtrade.gov.uk');
            expect(emailLink).toBeInTheDocument();
            expect(emailLink).toHaveAttribute('href', 'mailto:data.protection@businessandtrade.gov.uk');

            expect(screen.getAllByText(/Information Commissioner's Office/i).length).toBeGreaterThan(0);
            expect(screen.getByText(/Wycliffe House/i)).toBeInTheDocument();

            const icoLink = screen.getByText('https://ico.org.uk/');
            expect(icoLink).toBeInTheDocument();
            expect(icoLink).toHaveAttribute('href', 'https://ico.org.uk/');
        });
    });

    describe('Styling and Structure', () => {
        it('applies privacy notice specific styling and structure', () => {
            const { container } = renderWithRouter(<PrivacyNotice />);

            const privacyContainer = container.querySelector('#vista-privacy');
            expect(privacyContainer).toBeInTheDocument();

            const headings = container.querySelectorAll('h1, h2');
            expect(headings.length).toBeGreaterThan(0);
        });
    });
});
