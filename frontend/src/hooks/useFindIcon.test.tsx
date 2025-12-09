import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import useFindIcon from './useFindIcon';

const mockUseSuspenseQuery = vi.fn();

vi.mock('@tanstack/react-query', () => ({
    useSuspenseQuery: (...args: unknown[]) => mockUseSuspenseQuery(...args),
}));

describe('useFindIcon', () => {
    beforeEach(() => {
        mockUseSuspenseQuery.mockReset();
    });

    it('returns fallback icon when no data is available', () => {
        mockUseSuspenseQuery.mockReturnValue({ data: undefined, error: null, isLoading: false });

        const { result } = renderHook(() => useFindIcon('http://example.com#MyClass'));

        expect(result.current.color).toBe('#DDDDDD');
        expect(result.current.backgroundColor).toBe('#121212');
        expect(result.current.iconFallbackText).toBe('MC');
        expect(result.current.alt).toBe('MyClass');
    });

    it('returns styles when available', () => {
        mockUseSuspenseQuery.mockReturnValue({
            isLoading: false,
            error: null,
            data: {
                'http://example.com#Styled': {
                    classUri: 'http://example.com#Styled',
                    color: '#000000',
                    backgroundColor: '#ffffff',
                    faIcon: 'fa-test',
                    alt: 'Styled',
                    iconFallbackText: 'S',
                },
            },
        });

        const { result } = renderHook(() => useFindIcon('http://example.com#Styled'));

        expect(result.current.color).toBe('#000000');
        expect(result.current.backgroundColor).toBe('#ffffff');
        expect(result.current.faIcon).toBe('fa-test');
        expect(result.current.iconFallbackText).toBe('S');
    });

    it('falls back when query is still loading', () => {
        mockUseSuspenseQuery.mockReturnValue({ isLoading: true, data: undefined, error: null });

        const { result } = renderHook(() => useFindIcon('http://example.com#Loading'));

        expect(result.current.iconFallbackText).toBe('L');
        expect(result.current.color).toBe('#DDDDDD');
    });
});
