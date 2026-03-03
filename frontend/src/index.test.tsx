import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const renderMock = vi.fn();
const createRootMock = vi.fn(() => ({
    render: renderMock,
}));

vi.mock('react-dom/client', () => ({
    createRoot: createRootMock,
}));

vi.mock('@/App', () => ({
    default: () => <div>App</div>,
}));

vi.mock('@/components/DevTools', () => ({
    default: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('@/providers/SessionMonitorProvider', () => ({
    default: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('@/providers/UserStartupProvider', () => ({
    default: ({ children }: { children: ReactNode }) => children,
}));

vi.mock('@/api/apollo-client', () => ({
    default: {},
}));

vi.mock('@/utils/authErrorHandler', () => ({
    handleAuthError: vi.fn(),
}));

describe('index bootstrap', () => {
    beforeEach(() => {
        vi.resetModules();
        createRootMock.mockClear();
        renderMock.mockClear();
        document.body.innerHTML = '';
    });

    it('creates root and renders app when root container exists', async () => {
        document.body.innerHTML = '<div id="root"></div>';

        await import('./index');

        expect(createRootMock).toHaveBeenCalledTimes(1);
        expect(renderMock).toHaveBeenCalledTimes(1);
    });

    it('throws when root container is missing', async () => {
        await expect(import('./index')).rejects.toThrow('Root container not found');
    });
});
