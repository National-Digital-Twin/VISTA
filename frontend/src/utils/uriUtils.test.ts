// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the UK's Department for Business, Innovation, Science and Trade (BIST) as the governing entity.

import { describe, it, expect } from 'vitest';
import { getURIFragment } from './uriUtils';

describe('uriUtils', () => {
    describe('getURIFragment', () => {
        it.each([
            ['http://example.com/ontology#SomeClass', 'SomeClass'],
            ['http://example.com/ontology', 'http://example.com/ontology'],
            ['http://example.com#first#second', 'first'],
            ['http://example.com/ontology#', ''],
            ['', ''],
            ['#fragment', 'fragment'],
            ['#', ''],
            ['https://example.com/path/to/resource#FragmentName', 'FragmentName'],
            ['http://example.com/path?param=value#Fragment', 'Fragment'],
        ])('extracts "%s" as "%s"', (uri, expected) => {
            expect(getURIFragment(uri)).toBe(expected);
        });
    });
});