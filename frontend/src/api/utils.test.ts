import { describe, it, expect, vi } from 'vitest';
import { createParalogEndpoint, createOntologyServiceEndpoint, fetchOptions } from './utils';

vi.mock('@/config/app-config', () => ({
    default: {
        api: {
            url: '/vista-api',
        },
        services: {
            ontology: '/ontology-service',
        },
    },
}));

const testEndpointFunction = (functionName: string, createEndpoint: (path: string) => string, baseUrl: string) => {
    describe(functionName, () => {
        const testCases = [
            { input: 'asset/parts', expected: `${baseUrl}/asset/parts`, description: 'creates endpoint with base URL and path' },
            { input: 'users', expected: `${baseUrl}/users`, description: 'handles path without leading slash' },
            { input: '/assessments', expected: `${baseUrl}//assessments`, description: 'handles path with leading slash' },
            { input: '', expected: `${baseUrl}/`, description: 'handles empty path' },
            { input: 'asset?id=123&type=building', expected: `${baseUrl}/asset?id=123&type=building`, description: 'handles path with query parameters' },
            { input: 'asset/dependents/critical', expected: `${baseUrl}/asset/dependents/critical`, description: 'handles complex nested paths' },
        ];

        testCases.forEach(({ input, expected, description }) => {
            it(description, () => {
                expect(createEndpoint(input)).toBe(expected);
            });
        });

        if (functionName === 'createParalogEndpoint') {
            it('preserves special characters', () => {
                expect(createEndpoint('search?query=test%20value&filter=all')).toBe(`${baseUrl}/search?query=test%20value&filter=all`);
            });
        }
    });
};

describe('API utils', () => {
    testEndpointFunction('createParalogEndpoint', createParalogEndpoint, '/vista-api');
    testEndpointFunction('createOntologyServiceEndpoint', createOntologyServiceEndpoint, '/ontology-service');

    describe('fetchOptions', () => {
        it('exports fetch options object', () => {
            expect(fetchOptions).toBeDefined();
            expect(fetchOptions).toBeTypeOf('object');
        });

        it('includes Content-Type header', () => {
            expect(fetchOptions.headers).toBeDefined();
            expect(fetchOptions.headers['Content-Type']).toBe('application/json');
        });

        it('has correct structure for fetch API', () => {
            expect(fetchOptions).toHaveProperty('headers');
            expect(typeof fetchOptions.headers).toBe('object');
        });

        it('can be spread into fetch calls', () => {
            const requestOptions = {
                ...fetchOptions,
                method: 'POST',
                body: JSON.stringify({ test: 'data' }),
            };

            expect(requestOptions.headers['Content-Type']).toBe('application/json');
            expect(requestOptions.method).toBe('POST');
            expect(requestOptions.body).toBe('{"test":"data"}');
        });

        it('headers can be extended', () => {
            const extendedOptions = {
                ...fetchOptions,
                headers: {
                    ...fetchOptions.headers,
                    Authorization: 'Bearer token123',
                },
            };

            expect(extendedOptions.headers['Content-Type']).toBe('application/json');
            expect(extendedOptions.headers['Authorization']).toBe('Bearer token123');
        });
    });

    describe('endpoint functions consistency', () => {
        it('both functions follow same pattern', () => {
            const paralogResult = createParalogEndpoint('test');
            const ontologyResult = createOntologyServiceEndpoint('test');

            expect(paralogResult).toContain('/test');
            expect(ontologyResult).toContain('/test');
        });

        it('both functions handle special characters similarly', () => {
            const path = 'path?key=value&other=data';
            const paralogResult = createParalogEndpoint(path);
            const ontologyResult = createOntologyServiceEndpoint(path);

            expect(paralogResult).toContain(path);
            expect(ontologyResult).toContain(path);
        });
    });
});
