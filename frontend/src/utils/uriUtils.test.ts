// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { describe, it, expect } from 'vitest';
import { getURIFragment } from './uriUtils';

describe('uriUtils', () => {
    describe('getURIFragment', () => {
        it('extracts fragment from URI with hash', () => {
            const uri = 'http://example.com/ontology#SomeClass';
            const result = getURIFragment(uri);
            expect(result).toBe('SomeClass');
        });

        it('returns original URI when no hash is present', () => {
            const uri = 'http://example.com/ontology';
            const result = getURIFragment(uri);
            expect(result).toBe('http://example.com/ontology');
        });

        it('handles URI with multiple hash symbols', () => {
            const uri = 'http://example.com#first#second';
            const result = getURIFragment(uri);
            expect(result).toBe('first');
        });

        it('handles URI ending with hash', () => {
            const uri = 'http://example.com/ontology#';
            const result = getURIFragment(uri);
            expect(result).toBe('');
        });

        it('handles empty string', () => {
            const uri = '';
            const result = getURIFragment(uri);
            expect(result).toBe('');
        });

        it('handles URI with hash at the beginning', () => {
            const uri = '#fragment';
            const result = getURIFragment(uri);
            expect(result).toBe('fragment');
        });

        it('handles URI with only hash', () => {
            const uri = '#';
            const result = getURIFragment(uri);
            expect(result).toBe('');
        });

        it('handles complex URI with path and fragment', () => {
            const uri = 'https://example.com/path/to/resource#FragmentName';
            const result = getURIFragment(uri);
            expect(result).toBe('FragmentName');
        });

        it('handles URI with query parameters and fragment', () => {
            const uri = 'http://example.com/path?param=value#Fragment';
            const result = getURIFragment(uri);
            expect(result).toBe('Fragment');
        });
    });
});
