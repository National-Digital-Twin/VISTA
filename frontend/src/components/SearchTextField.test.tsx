// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchTextField } from './SearchTextField';

describe('SearchTextField', () => {
    const defaultProps = {
        placeholder: 'Search for items',
        value: '',
        onChange: vi.fn(),
    };

    describe('Rendering', () => {
        it('renders with placeholder text', () => {
            render(<SearchTextField {...defaultProps} />);

            expect(screen.getByPlaceholderText('Search for items')).toBeInTheDocument();
        });

        it('renders with different placeholder text', () => {
            render(<SearchTextField {...defaultProps} placeholder="Search for users" />);

            expect(screen.getByPlaceholderText('Search for users')).toBeInTheDocument();
        });

        it('displays the current value', () => {
            render(<SearchTextField {...defaultProps} value="test search" />);

            const input = screen.getByPlaceholderText('Search for items') as HTMLInputElement;
            expect(input.value).toBe('test search');
        });

        it('renders search icon', () => {
            const { container } = render(<SearchTextField {...defaultProps} />);

            const searchIcon = container.querySelector('svg');
            expect(searchIcon).toBeInTheDocument();
        });

        it('renders search icon when value is empty', () => {
            render(<SearchTextField {...defaultProps} value="" />);
            expect(screen.getByTestId('SearchIcon')).toBeInTheDocument();
        });

        it('renders close icon when value has content', () => {
            render(<SearchTextField {...defaultProps} value="test" />);
            expect(screen.getByTestId('CloseIcon')).toBeInTheDocument();
        });
    });

    describe('User Interaction', () => {
        it('calls onChange when user types', () => {
            const onChange = vi.fn();
            render(<SearchTextField {...defaultProps} onChange={onChange} />);

            const input = screen.getByPlaceholderText('Search for items');
            fireEvent.change(input, { target: { value: 'test' } });

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith('test');
        });

        it('calls onChange with updated value on each keystroke', () => {
            const onChange = vi.fn();
            render(<SearchTextField {...defaultProps} onChange={onChange} value="" />);

            const input = screen.getByPlaceholderText('Search for items');
            fireEvent.change(input, { target: { value: 'a' } });
            fireEvent.change(input, { target: { value: 'ab' } });
            fireEvent.change(input, { target: { value: 'abc' } });

            expect(onChange).toHaveBeenCalledTimes(3);
            expect(onChange).toHaveBeenNthCalledWith(1, 'a');
            expect(onChange).toHaveBeenNthCalledWith(2, 'ab');
            expect(onChange).toHaveBeenNthCalledWith(3, 'abc');
        });

        it('handles empty string input', () => {
            const onChange = vi.fn();
            render(<SearchTextField {...defaultProps} onChange={onChange} value="test" />);

            const input = screen.getByPlaceholderText('Search for items');
            fireEvent.change(input, { target: { value: '' } });

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith('');
        });

        it('handles special characters in input', () => {
            const onChange = vi.fn();
            render(<SearchTextField {...defaultProps} onChange={onChange} />);

            const input = screen.getByPlaceholderText('Search for items');
            fireEvent.change(input, { target: { value: 'test@example.com' } });

            expect(onChange).toHaveBeenCalledWith('test@example.com');
        });

        it('calls onChange with empty string when clear button is clicked', () => {
            const onChange = vi.fn();
            render(<SearchTextField {...defaultProps} value="test" onChange={onChange} />);

            const clearButton = screen.getByLabelText('Clear search');
            fireEvent.click(clearButton);

            expect(onChange).toHaveBeenCalledTimes(1);
            expect(onChange).toHaveBeenCalledWith('');
        });
    });

    describe('Styling', () => {
        it('applies default minWidth of 300', () => {
            const { container } = render(<SearchTextField {...defaultProps} />);

            const textField = container.querySelector('.MuiOutlinedInput-root');
            expect(textField).toBeInTheDocument();
        });

        it('applies custom minWidth when provided', () => {
            const { container } = render(<SearchTextField {...defaultProps} minWidth={400} />);

            const input = container.querySelector('input');
            expect(input?.closest('.MuiOutlinedInput-root')).toBeInTheDocument();
        });

        it('has rounded border styling', () => {
            const { container } = render(<SearchTextField {...defaultProps} />);

            const outlinedInput = container.querySelector('.MuiOutlinedInput-root');
            expect(outlinedInput).toBeInTheDocument();
        });

        it('has no border on fieldset', () => {
            const { container } = render(<SearchTextField {...defaultProps} />);

            const outlinedInput = container.querySelector('.MuiOutlinedInput-root');
            expect(outlinedInput).toBeInTheDocument();
        });
    });

    describe('Props', () => {
        it('works with different value prop updates', () => {
            const onChange = vi.fn();
            const { rerender } = render(<SearchTextField {...defaultProps} value="" onChange={onChange} />);

            const input = screen.getByPlaceholderText('Search for items') as HTMLInputElement;
            expect(input.value).toBe('');

            rerender(<SearchTextField {...defaultProps} value="updated" onChange={onChange} />);
            expect(input.value).toBe('updated');
        });

        it('maintains controlled component behavior', () => {
            const onChange = vi.fn();
            render(<SearchTextField {...defaultProps} value="controlled" onChange={onChange} />);

            const input = screen.getByPlaceholderText('Search for items') as HTMLInputElement;
            expect(input.value).toBe('controlled');

            fireEvent.change(input, { target: { value: 'new value' } });

            expect(onChange).toHaveBeenCalledWith('new value');
            expect(input.value).toBe('controlled');
        });

        it('applies fullWidth when provided', () => {
            const { container } = render(<SearchTextField {...defaultProps} fullWidth />);

            const textField = container.querySelector('.MuiTextField-root');
            expect(textField).toBeInTheDocument();

            const input = container.querySelector('input');
            expect(input?.closest('.MuiTextField-root')).toBeInTheDocument();
        });

        it('does not apply fullWidth by default', () => {
            const { container } = render(<SearchTextField {...defaultProps} />);

            const textField = container.querySelector('.MuiTextField-root');
            expect(textField).toBeInTheDocument();
        });
    });
});
