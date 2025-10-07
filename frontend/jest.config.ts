export default {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-jsdom',
    transform: {
        '^.+\\.([tj]s|[tj]sx)$': ['ts-jest', { tsconfig: 'tsconfig.jest.json' }],
        '^.+\\.svg$': 'jest-transformer-svg',
    },
    transformIgnorePatterns: ['<rootDir>/node_modules/(?!change-case|@mapbox/mapbox-gl-draw|mapbox-gl-draw-geodesic)'],
    moduleNameMapper: {
        '^common/(.*)$': '<rootDir>/../common/$1',
        '^(.*).svg\\?react$': '$1.svg',
        '^@/(.*)$': '<rootDir>/src/$1',
        '^.+\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '\\.(graphql|gql)$': 'jest-transform-stub',
    },
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
};
