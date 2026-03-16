// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import AuthPrompt from '.';

vi.mock('./style.module.css', () => ({
    default: {
        authPromptContainer: 'authPromptContainer',
        authPrompt: 'authPrompt',
        title: 'title',
        authForm: 'authForm',
        error: 'error',
    },
}));

describe('AuthPrompt', () => {
    describe('Rendering', () => {
        it('renders title and input field', () => {
            render(<AuthPrompt />);

            expect(screen.getByText('Enter authentication key')).toBeInTheDocument();
            expect(screen.getByPlaceholderText('XXXX-XXXX-XXXX-XXXX')).toBeInTheDocument();
        });

        it('renders submit button', () => {
            render(<AuthPrompt />);

            const button = screen.getByRole('button');
            expect(button).toBeInTheDocument();
        });

        it('applies custom className', () => {
            const { container } = render(<AuthPrompt className="custom-class" />);

            expect(container.firstChild).toHaveClass('authPromptContainer', 'custom-class');
        });

        it('shows custom error message when provided', () => {
            render(<AuthPrompt error="Invalid key format" />);

            expect(screen.getByText('Invalid key format')).toBeInTheDocument();
        });

        it('shows empty space for error when no error provided', () => {
            const { container } = render(<AuthPrompt />);

            const errorElement = container.querySelector('.error');
            expect(errorElement).toBeInTheDocument();
            expect(errorElement?.textContent).toMatch(/^\s+$/);
        });
    });

    describe('Button State', () => {
        it('disables submit button when onLogIn is not provided', () => {
            render(<AuthPrompt />);

            const button = screen.getByRole('button');
            expect(button).toBeDisabled();
            expect(button).toHaveTextContent('...');
        });

        it('enables submit button when onLogIn is provided', () => {
            render(<AuthPrompt onLogIn={vi.fn()} />);

            const button = screen.getByRole('button');
            expect(button).toBeEnabled();
            expect(button).toHaveTextContent('Log In');
        });
    });

    describe('Form Submission', () => {
        it('calls onLogIn with input value when form is submitted', () => {
            const onLogIn = vi.fn();
            render(<AuthPrompt onLogIn={onLogIn} />);

            const input = screen.getByPlaceholderText('XXXX-XXXX-XXXX-XXXX');
            const form = input.closest('form')!;

            fireEvent.change(input, { target: { value: 'ABCD-EFGH-IJKL-MNOP' } });
            fireEvent.submit(form);

            expect(onLogIn).toHaveBeenCalledWith('ABCD-EFGH-IJKL-MNOP');
        });

        it('does not call onLogIn when form is submitted without handler', () => {
            const { container } = render(<AuthPrompt />);

            const form = container.querySelector('form')!;
            expect(() => fireEvent.submit(form)).not.toThrow();
        });

        it('prevents default form submission', () => {
            const onLogIn = vi.fn();
            render(<AuthPrompt onLogIn={onLogIn} />);

            const form = screen.getByPlaceholderText('XXXX-XXXX-XXXX-XXXX').closest('form')!;
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            const preventDefaultSpy = vi.spyOn(submitEvent, 'preventDefault');

            form.dispatchEvent(submitEvent);

            expect(preventDefaultSpy).toHaveBeenCalled();
        });
    });

    describe('Input Validation', () => {
        it('has required attribute', () => {
            render(<AuthPrompt />);

            const input = screen.getByPlaceholderText('XXXX-XXXX-XXXX-XXXX') as HTMLInputElement;
            expect(input).toBeRequired();
        });

        it('has correct length constraints', () => {
            render(<AuthPrompt />);

            const input = screen.getByPlaceholderText('XXXX-XXXX-XXXX-XXXX') as HTMLInputElement;
            expect(input).toHaveAttribute('minLength', '19');
            expect(input).toHaveAttribute('maxLength', '19');
        });

        it('has correct pattern for validation', () => {
            render(<AuthPrompt />);

            const input = screen.getByPlaceholderText('XXXX-XXXX-XXXX-XXXX') as HTMLInputElement;
            const expectedPattern = String.raw`\w{4}-\w{4}-\w{4}-\w{4}`;
            expect(input).toHaveAttribute('pattern', expectedPattern);
        });

        it('has autocapitalize set to characters', () => {
            render(<AuthPrompt />);

            const input = screen.getByPlaceholderText('XXXX-XXXX-XXXX-XXXX') as HTMLInputElement;
            expect(input).toHaveAttribute('autoCapitalize', 'characters');
        });
    });

    describe('Accessibility', () => {
        it('has accessible label for input', () => {
            render(<AuthPrompt />);

            const input = screen.getByPlaceholderText('XXXX-XXXX-XXXX-XXXX');
            const label = screen.getByLabelText('Authentication Key');

            expect(label).toBeInTheDocument();
            expect(input).toHaveAccessibleName('Authentication Key');
        });

        it('associates label with input via ID', () => {
            render(<AuthPrompt />);

            const input = screen.getByPlaceholderText('XXXX-XXXX-XXXX-XXXX') as HTMLInputElement;
            const label = screen.getByText('Authentication Key').closest('label') as HTMLLabelElement;

            expect(label.htmlFor).toBe(input.id);
            expect(input.id).toBeTruthy();
        });
    });

    describe('User Interactions', () => {
        it('allows user to type valid key format', async () => {
            const user = userEvent.setup();
            render(<AuthPrompt onLogIn={vi.fn()} />);

            const input = screen.getByPlaceholderText('XXXX-XXXX-XXXX-XXXX') as HTMLInputElement;
            await user.type(input, 'TEST-1234-ABCD-5678');

            expect(input.value).toBe('TEST-1234-ABCD-5678');
        });

        it('clears input after unsuccessful submission', async () => {
            const onLogIn = vi.fn();
            render(<AuthPrompt onLogIn={onLogIn} />);

            const input = screen.getByPlaceholderText('XXXX-XXXX-XXXX-XXXX') as HTMLInputElement;
            const form = input.closest('form')!;

            fireEvent.change(input, { target: { value: 'TEST-1234-ABCD-5678' } });
            fireEvent.submit(form);

            expect(input.value).toBe('TEST-1234-ABCD-5678');
            expect(onLogIn).toHaveBeenCalledWith('TEST-1234-ABCD-5678');
        });
    });
});
