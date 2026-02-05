import { describe, it, expect } from 'vitest';
import { fetchUtilities } from './utilities';

describe('utilities API', () => {
    describe('fetchUtilities', () => {
        it('returns utilities response with route planner group', async () => {
            const result = await fetchUtilities();

            expect(result.groups).toHaveLength(1);
            expect(result.groups[0].id).toBe('route-planner');
            expect(result.groups[0].name).toBe('Route Planner');
            expect(result.groups[0].utilities).toHaveLength(1);
            expect(result.groups[0].utilities[0].id).toBe('road-route');
            expect(result.groups[0].utilities[0].name).toBe('Route');
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
