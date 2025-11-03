import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ReactElement, ReactNode } from 'react';
import { vi } from 'vitest';

export const mockUsers = [
    {
        id: '1',
        name: 'Alice Doe',
        displayName: 'Alice Doe',
        email: 'alice@example.com',
        organisation: 'example.com',
        groups: ['Group A', 'Group B'],
        memberSince: '2023-01-15',
        userType: 'Admin',
    },
    {
        id: '2',
        name: 'Bob Smith',
        displayName: 'Bob Smith',
        email: 'bob@other.org',
        organisation: 'other.org',
        groups: ['Group C'],
        memberSince: '2022-06-01',
        userType: 'General',
    },
];

export const mockInvites = [
    { id: 'i1', email: 'a@example.com', userType: 'Admin', groups: ['G1'], status: 'Pending', daysAgo: 2 },
    { id: 'i2', email: 'b@example.com', userType: 'General', groups: ['G2'], status: 'Expired', daysAgo: 10 },
];

export const mockAssets = [
    { lng: 0.5, lat: 0.5, uri: 'asset1' },
    { lng: 1.5, lat: 1.5, uri: 'asset2' },
];

export const mockDependencies = [{ uri: 'dep1' }, { uri: 'dep2' }];

export const createPolygonFeature = (
    coordinates: number[][][] = [
        [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 1],
            [0, 0],
        ],
    ],
) => ({
    type: 'Feature',
    geometry: {
        type: 'Polygon',
        coordinates,
    },
    properties: {},
});

export const createMockMap = () => ({
    style: {},
    getMap: vi.fn().mockReturnValue({
        queryRenderedFeatures: vi.fn().mockReturnValue([]),
        setFeatureState: vi.fn(),
    }),
    getLayer: vi.fn().mockReturnValue(true),
});

export const renderWithRouter = (ui: ReactElement, { initialEntries = ['/'], route = '/*' }: { initialEntries?: string[]; route?: string } = {}) => {
    const Wrapper = ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={initialEntries}>
            <Routes>
                <Route path={route} element={children} />
            </Routes>
        </MemoryRouter>
    );

    return render(ui, { wrapper: Wrapper });
};

export const renderWithDynamicRoute = (ui: ReactElement, { path, initialEntries }: { path: string; initialEntries: string[] }) => {
    const Wrapper = ({ children }: { children: ReactNode }) => (
        <MemoryRouter initialEntries={initialEntries}>
            <Routes>
                <Route path={path} element={children} />
            </Routes>
        </MemoryRouter>
    );

    return render(ui, { wrapper: Wrapper });
};

export const mockApiResponse = <T,>(data: T, delay = 0) => {
    return new Promise<T>((resolve) => {
        setTimeout(() => resolve(data), delay);
    });
};

export const expectElementToBeVisible = (text: string) => {
    expect(screen.getByText(text)).toBeInTheDocument();
};

export const expectElementNotToBeVisible = (text: string) => {
    expect(screen.queryByText(text)).not.toBeInTheDocument();
};

export const expectMultipleElements = (text: string, count: number) => {
    expect(screen.getAllByText(text)).toHaveLength(count);
};

export const renderAndExpectText = (component: ReactElement, text: string | RegExp) => {
    renderWithRouter(component);
    expect(screen.getByText(text)).toBeInTheDocument();
};

export const renderAndExpectTexts = (component: ReactElement, texts: (string | RegExp)[]) => {
    renderWithRouter(component);
    for (const text of texts) {
        expect(screen.getByText(text)).toBeInTheDocument();
    }
};

export const renderAndExpectAttribute = (component: ReactElement, selector: string, attribute: string, value: string) => {
    const { container } = renderWithRouter(component);
    const element = container.querySelector(selector);
    expect(element).toBeInTheDocument();
    expect(element).toHaveAttribute(attribute, value);
};

export const renderAndExpectElement = (component: ReactElement, selector: string) => {
    const { container } = renderWithRouter(component);
    const element = container.querySelector(selector);
    expect(element).toBeInTheDocument();
    return element;
};

export const createMockUseGroupedAssets = () => ({
    isLoadingAssets: false,
    assets: mockAssets,
});

export const createMockUseProfileData = () => ({
    data: {
        id: '1',
        displayName: 'Test User',
        email: 'test@example.com',
        memberSince: '2023-01-01',
        addedBy: 'admin@example.com',
        userType: 'General',
        organisation: 'example.com',
        groups: ['Group A'],
    },
    isLoading: false,
    error: null,
});

export const createUserData = (overrides = {}) => ({
    id: '1',
    name: 'Test User',
    displayName: 'Test User',
    email: 'test@example.com',
    organisation: 'example.com',
    groups: ['Group A'],
    memberSince: '2023-01-01',
    userType: 'General',
    ...overrides,
});

export const createInviteData = (overrides = {}) => ({
    id: 'invite1',
    email: 'invite@example.com',
    userType: 'General',
    groups: ['Group A'],
    status: 'Pending',
    daysAgo: 1,
    ...overrides,
});
