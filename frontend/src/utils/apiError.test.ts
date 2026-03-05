// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { describe, it, expect } from 'vitest';
import { ApiError, checkResponse } from './apiError';

describe('ApiError', () => {
    it('creates error with status and statusText', () => {
        const error = new ApiError('Test error', 401, 'Unauthorized');

        expect(error).toBeInstanceOf(Error);
        expect(error).toBeInstanceOf(ApiError);
        expect(error.message).toBe('Test error');
        expect(error.status).toBe(401);
        expect(error.statusText).toBe('Unauthorized');
        expect(error.name).toBe('ApiError');
    });

    it('preserves status code for error handlers', () => {
        const error = new ApiError('Forbidden', 403, 'Forbidden');

        expect(error.status).toBe(403);
        expect('status' in error).toBe(true);
    });
});

describe('checkResponse', () => {
    it('returns response when ok', async () => {
        const response = new Response('OK', { status: 200 });

        const result = await checkResponse(response);

        expect(result).toBe(response);
    });

    it('throws ApiError when response is not ok', async () => {
        const response = new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' });

        await expect(checkResponse(response)).rejects.toThrow(ApiError);
        await expect(checkResponse(response)).rejects.toThrow('Request failed: Unauthorized');
    });

    it('preserves status code in thrown error', async () => {
        const response = new Response('Forbidden', { status: 403, statusText: 'Forbidden' });

        try {
            await checkResponse(response);
            expect.fail('Should have thrown');
        } catch (error) {
            expect(error).toBeInstanceOf(ApiError);
            if (error instanceof ApiError) {
                expect(error.status).toBe(403);
                expect(error.statusText).toBe('Forbidden');
            }
        }
    });

    it('handles different error status codes', async () => {
        const statuses = [400, 401, 403, 404, 500];

        for (const status of statuses) {
            const response = new Response('Error', { status });

            try {
                await checkResponse(response);
                expect.fail(`Should have thrown for status ${status}`);
            } catch (error) {
                expect(error).toBeInstanceOf(ApiError);
                if (error instanceof ApiError) {
                    expect(error.status).toBe(status);
                }
            }
        }
    });
});
