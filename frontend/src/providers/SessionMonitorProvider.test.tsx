import { render, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SessionMonitorProvider from './SessionMonitorProvider';
import { signout } from '@/api/auth';

vi.mock('@/api/auth', () => ({
    signout: vi.fn(),
}));

vi.mock('@/config/app-config', () => ({
    default: {
        services: {
            apiBaseUrl: '/ndtp-python/api',
        },
    },
}));

const mockedSignout = vi.mocked(signout);

describe('SessionMonitorProvider', () => {
    let fetchMock: ReturnType<typeof vi.fn>;
    let originalOnline: PropertyDescriptor | undefined;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as typeof fetch;
        mockedSignout.mockClear();

        originalOnline = Object.getOwnPropertyDescriptor(navigator, 'onLine');
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: true,
        });

        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
        if (originalOnline) {
            Object.defineProperty(navigator, 'onLine', originalOnline);
        }
    });

    it('renders children', () => {
        const { getByText } = render(
            <SessionMonitorProvider>
                <div>Test Content</div>
            </SessionMonitorProvider>,
        );

        expect(getByText('Test Content')).toBeInTheDocument();
    });

    it('pings server on mount', async () => {
        fetchMock.mockResolvedValue({
            status: 200,
        });

        render(
            <SessionMonitorProvider>
                <div>Test</div>
            </SessionMonitorProvider>,
        );

        await act(async () => {
            await vi.runOnlyPendingTimersAsync();
        });

        expect(fetchMock).toHaveBeenCalledWith('/ndtp-python/ping/', {
            method: 'HEAD',
            cache: 'no-store',
            credentials: 'include',
        });
    });

    it('calls signout when ping returns 401', async () => {
        fetchMock.mockResolvedValue({
            status: 401,
        });

        render(
            <SessionMonitorProvider>
                <div>Test</div>
            </SessionMonitorProvider>,
        );

        await act(async () => {
            await vi.runOnlyPendingTimersAsync();
        });

        expect(mockedSignout).toHaveBeenCalled();
    });

    it('calls signout when ping returns 403', async () => {
        fetchMock.mockResolvedValue({
            status: 403,
        });

        render(
            <SessionMonitorProvider>
                <div>Test</div>
            </SessionMonitorProvider>,
        );

        await act(async () => {
            await vi.runOnlyPendingTimersAsync();
        });

        expect(mockedSignout).toHaveBeenCalled();
    });

    it('does not call signout when ping returns 200', async () => {
        fetchMock.mockResolvedValue({
            status: 200,
        });

        render(
            <SessionMonitorProvider>
                <div>Test</div>
            </SessionMonitorProvider>,
        );

        await act(async () => {
            await vi.runOnlyPendingTimersAsync();
        });

        expect(fetchMock).toHaveBeenCalled();
        expect(mockedSignout).not.toHaveBeenCalled();
    });

    it('pings server periodically', async () => {
        fetchMock.mockResolvedValue({
            status: 200,
        });

        render(
            <SessionMonitorProvider>
                <div>Test</div>
            </SessionMonitorProvider>,
        );

        await act(async () => {
            await vi.runOnlyPendingTimersAsync();
        });

        const initialCallCount = fetchMock.mock.calls.length;
        expect(initialCallCount).toBeGreaterThanOrEqual(1);

        fetchMock.mockClear();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(30000);
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);

        fetchMock.mockClear();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(30000);
        });

        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('does not ping when offline', async () => {
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            configurable: true,
            value: false,
        });

        render(
            <SessionMonitorProvider>
                <div>Test</div>
            </SessionMonitorProvider>,
        );

        await act(async () => {
            await vi.runOnlyPendingTimersAsync();
        });

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('handles network errors gracefully', async () => {
        fetchMock.mockRejectedValue(new Error('Network error'));

        render(
            <SessionMonitorProvider>
                <div>Test</div>
            </SessionMonitorProvider>,
        );

        await act(async () => {
            await vi.runOnlyPendingTimersAsync();
        });

        expect(fetchMock).toHaveBeenCalled();
        expect(mockedSignout).not.toHaveBeenCalled();
    });

    it('does not ping when disabled', async () => {
        fetchMock.mockResolvedValue({
            status: 200,
        });

        render(
            <SessionMonitorProvider enabled={false}>
                <div>Test</div>
            </SessionMonitorProvider>,
        );

        await act(async () => {
            await vi.runOnlyPendingTimersAsync();
        });

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('cleans up interval on unmount', async () => {
        fetchMock.mockResolvedValue({
            status: 200,
        });

        const { unmount } = render(
            <SessionMonitorProvider>
                <div>Test</div>
            </SessionMonitorProvider>,
        );

        await act(async () => {
            await vi.runOnlyPendingTimersAsync();
        });

        expect(fetchMock).toHaveBeenCalled();

        fetchMock.mockClear();

        unmount();

        await act(async () => {
            await vi.advanceTimersByTimeAsync(30000);
        });

        expect(fetchMock).not.toHaveBeenCalled();
    });
});
