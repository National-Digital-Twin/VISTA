import { render, screen } from '@testing-library/react';
import AuthPrompt from '.';

// Mock the CSS module
jest.mock('./style.module.css', () => ({
    authPromptContainer: 'authPromptContainer',
    authPrompt: 'authPrompt',
    title: 'title',
    authForm: 'authForm',
    error: 'error',
}));

describe('AuthPrompt', () => {
    it('renders title and input', () => {
        render(<AuthPrompt />);
        expect(screen.getByText('Enter authentication key')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('XXXX-XXXX-XXXX-XXXX')).toBeInTheDocument();
    });

    it('shows custom error if provided', () => {
        render(<AuthPrompt error="Invalid key" />);
        expect(screen.getByText('Invalid key')).toBeInTheDocument();
    });

    it('disables submit button if onLogIn is not provided', () => {
        render(<AuthPrompt />);
        const button = screen.getByRole('button');
        expect(button).toBeDisabled();
        expect(button).toHaveTextContent('...');
    });

    it('enables submit button if onLogIn is provided', () => {
        render(<AuthPrompt onLogIn={() => {}} />);
        const button = screen.getByRole('button');
        expect(button).toBeEnabled();
        expect(button).toHaveTextContent('Log In');
    });
});
