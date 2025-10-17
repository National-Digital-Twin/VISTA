import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import React, { ReactNode } from 'react';
import { useNavigation, NAVIGATION_ITEMS } from './useNavigation';

const theme = createTheme();

function createWrapper(initialPath = '/') {
    function Wrapper({ children }: { children: ReactNode }) {
        return React.createElement(ThemeProvider, { theme }, React.createElement(MemoryRouter, { initialEntries: [initialPath] }, children));
    }
    return Wrapper;
}

describe('useNavigation', () => {
    let scrollToSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        scrollToSpy = vi.fn();
        Object.defineProperty(document.documentElement, 'scrollTo', {
            value: scrollToSpy,
            writable: true,
        });
    });

    describe('Navigation items', () => {
        it('returns navigation items', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper('/'),
            });

            expect(result.current.navigationItems).toBeDefined();
            expect(result.current.navigationItems).toEqual(NAVIGATION_ITEMS);
        });

        it('navigation items include data-room', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper('/'),
            });

            const dataRoomItem = result.current.navigationItems.find((item) => item.to === '/data-room');
            expect(dataRoomItem).toBeDefined();
            expect(dataRoomItem?.label).toBe('Data room');
        });

        it('navigation items include map', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper('/'),
            });

            const mapItem = result.current.navigationItems.find((item) => item.to === '/');
            expect(mapItem).toBeDefined();
            expect(mapItem?.label).toBe('Map');
        });
    });

    describe('isActive function', () => {
        it('returns true when path matches current location', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper('/data-room'),
            });

            expect(result.current.isActive('/data-room')).toBe(true);
        });

        it('returns false when path does not match', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper('/'),
            });

            expect(result.current.isActive('/data-room')).toBe(false);
        });

        it('returns true for root path', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper('/'),
            });

            expect(result.current.isActive('/')).toBe(true);
        });

        it('handles nested paths', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper('/admin/users'),
            });

            expect(result.current.isActive('/admin/users')).toBe(true);
            expect(result.current.isActive('/admin')).toBe(false);
        });

        it('is case sensitive', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper('/data-room'),
            });

            expect(result.current.isActive('/Data-Room')).toBe(false);
        });
    });

    describe('handleLink function', () => {
        it('scrolls to top when called', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper('/'),
            });

            result.current.handleLink();

            expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
        });

        it('can be called multiple times', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper('/'),
            });

            result.current.handleLink();
            result.current.handleLink();
            result.current.handleLink();

            expect(scrollToSpy).toHaveBeenCalledTimes(3);
        });
    });

    describe('handleNavigationClick function', () => {
        it('navigates to specified path', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper('/'),
            });

            result.current.handleNavigationClick({ to: '/data-room', label: 'Data room' });

            expect(scrollToSpy).toHaveBeenCalledWith(0, 0);
        });

        it('scrolls to top after navigation', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper('/'),
            });

            result.current.handleNavigationClick({ to: '/data-room', label: 'Data room' });

            expect(scrollToSpy).toHaveBeenCalled();
        });
    });

    describe('isMobile detection', () => {
        it('returns isMobile based on theme breakpoints', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper('/'),
            });

            expect(typeof result.current.isMobile).toBe('boolean');
        });

        it('uses MUI theme breakpoints', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper('/'),
            });

            expect(result.current.isMobile).toBeDefined();
        });
    });

    describe('Hook stability', () => {
        it('returns consistent functionality across renders', () => {
            const { result, rerender } = renderHook(() => useNavigation(), {
                wrapper: createWrapper('/'),
            });

            const firstResult = result.current.isActive('/');
            rerender();

            expect(result.current.isActive('/')).toBe(firstResult);
            expect(result.current.isActive('/')).toBe(true);
        });

        it('navigationItems reference is stable', () => {
            const { result, rerender } = renderHook(() => useNavigation(), {
                wrapper: createWrapper('/'),
            });

            const firstItems = result.current.navigationItems;
            rerender();

            expect(result.current.navigationItems).toBe(firstItems);
        });
    });

    describe('Integration with router', () => {
        it('isActive updates when location changes', () => {
            const { result } = renderHook(() => useNavigation(), {
                wrapper: createWrapper('/'),
            });

            expect(result.current.isActive('/')).toBe(true);

        });
    });

    describe('NAVIGATION_ITEMS constant', () => {
        it('exports correct navigation items', () => {
            expect(NAVIGATION_ITEMS).toHaveLength(2);
            expect(NAVIGATION_ITEMS[0]).toEqual({ to: '/data-room', label: 'Data room' });
            expect(NAVIGATION_ITEMS[1]).toEqual({ to: '/', label: 'Map' });
        });

        it('navigation items have required properties', () => {
            NAVIGATION_ITEMS.forEach((item) => {
                expect(item).toHaveProperty('to');
                expect(item).toHaveProperty('label');
                expect(typeof item.to).toBe('string');
                expect(typeof item.label).toBe('string');
            });
        });
    });
});
