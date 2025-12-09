import { describe, it, expect } from 'vitest';
import { fetchUtilities } from './utilities';

describe('utilities API', () => {
    describe('fetchUtilities', () => {
        it('returns utilities response with road routes group', async () => {
            const result = await fetchUtilities();

            expect(result.featureCollection.type).toBe('FeatureCollection');
            expect(result.featureCollection.features).toHaveLength(0);
            expect(result.groups).toHaveLength(1);
            expect(result.groups[0].id).toBe('road-routes');
            expect(result.groups[0].name).toBe('Road routes');
            expect(result.groups[0].utilities).toHaveLength(1);
            expect(result.groups[0].utilities[0].id).toBe('road-route');
            expect(result.groups[0].utilities[0].name).toBe('Route');
            expect(result.groups[0].utilities[0].geometry.type).toBe('LineString');
            if (result.groups[0].utilities[0].geometry.type === 'LineString') {
                expect(result.groups[0].utilities[0].geometry.coordinates).toEqual([]);
            }
        });

        it('returns consistent structure on multiple calls', async () => {
            const result1 = await fetchUtilities();
            const result2 = await fetchUtilities();

            expect(result1).toEqual(result2);
            expect(result1.groups[0].id).toBe(result2.groups[0].id);
            expect(result1.groups[0].utilities[0].id).toBe(result2.groups[0].utilities[0].id);
        });
    });
});
