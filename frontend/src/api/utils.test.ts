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

describe('API utils', () => {
    describe('createParalogEndpoint', () => {
        it('creates endpoint with base URL and path', () => {
            const result = createParalogEndpoint('asset/parts');

            expect(result).toBe('/vista-api/asset/parts');
        });

        it('handles path without leading slash', () => {
            const result = createParalogEndpoint('users');

            expect(result).toBe('/vista-api/users');
        });

        it('handles path with leading slash', () => {
            const result = createParalogEndpoint('/assessments');

            expect(result).toBe('/vista-api//assessments');
        });

        it('handles empty path', () => {
            const result = createParalogEndpoint('');

            expect(result).toBe('/vista-api/');
        });

        it('handles path with query parameters', () => {
            const result = createParalogEndpoint('asset?id=123&type=building');

            expect(result).toBe('/vista-api/asset?id=123&type=building');
        });

        it('handles complex nested paths', () => {
            const result = createParalogEndpoint('asset/dependents/critical');

            expect(result).toBe('/vista-api/asset/dependents/critical');
        });

        it('preserves special characters', () => {
            const result = createParalogEndpoint('search?query=test%20value&filter=all');

            expect(result).toBe('/vista-api/search?query=test%20value&filter=all');
        });
    });

    describe('createOntologyServiceEndpoint', () => {
        it('creates endpoint with ontology service URL and path', () => {
            const result = createOntologyServiceEndpoint('class');

            expect(result).toBe('/ontology-service/class');
        });

        it('handles path without leading slash', () => {
            const result = createOntologyServiceEndpoint('types');

            expect(result).toBe('/ontology-service/types');
        });

        it('handles path with leading slash', () => {
            const result = createOntologyServiceEndpoint('/properties');

            expect(result).toBe('/ontology-service//properties');
        });

        it('handles empty path', () => {
            const result = createOntologyServiceEndpoint('');

            expect(result).toBe('/ontology-service/');
        });

        it('handles path with query parameters', () => {
            const result = createOntologyServiceEndpoint('class?uri=http://example.com/type');

            expect(result).toBe('/ontology-service/class?uri=http://example.com/type');
        });

        it('handles complex nested paths', () => {
            const result = createOntologyServiceEndpoint('schema/entities/properties');

            expect(result).toBe('/ontology-service/schema/entities/properties');
        });
    });

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
