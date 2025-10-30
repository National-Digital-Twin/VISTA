import { describe, it, expect, vi } from 'vitest';
import { fetchAssetSpecifications } from './fetchAssetSpecifications';

vi.mock('@/data/live-assets.json', () => ({
    default: [
        {
            source: 'os-ngd',
            collection: 'water-network',
            description: ['Waterlink'],
            expectedCount: 150,
        },
        {
            source: 'os-names',
            description: ['School'],
            expectedCount: 50,
        },
        {
            source: 'naptan',
            description: ['Bus Stop'],
            expectedCount: 200,
        },
    ],
}));

describe('fetchAssetSpecifications', () => {
    it('successfully fetches asset specifications', async () => {
        const result = await fetchAssetSpecifications();

        expect(result).toBeDefined();
        expect(Array.isArray(result)).toBe(true);
        expect(result.length).toBeGreaterThan(0);
    });

    it('returns array of AssetSpecification objects', async () => {
        const result = await fetchAssetSpecifications();

        expect(result[0]).toHaveProperty('source');
        expect(result[0]).toHaveProperty('description');
        expect(result[0]).toHaveProperty('expectedCount');
    });

    it('preserves all specification properties', async () => {
        const result = await fetchAssetSpecifications();

        expect(result[0]).toMatchObject({
            source: 'os-ngd',
            collection: 'water-network',
            description: ['Waterlink'],
            expectedCount: 150,
        });
    });

    it('returns multiple specifications', async () => {
        const result = await fetchAssetSpecifications();

        expect(result).toHaveLength(3);
        expect(result[0].source).toBe('os-ngd');
        expect(result[1].source).toBe('os-names');
        expect(result[2].source).toBe('naptan');
    });

    it('handles specifications with different properties', async () => {
        const result = await fetchAssetSpecifications();

        expect(result[0]).toHaveProperty('collection');
        expect(result[1]).not.toHaveProperty('collection');
    });

    it('maintains specification order', async () => {
        const result = await fetchAssetSpecifications();

        const sources = result.map((spec) => spec.source);
        expect(sources).toEqual(['os-ngd', 'os-names', 'naptan']);
    });

    it('returns consistent data on multiple calls', async () => {
        const result1 = await fetchAssetSpecifications();
        const result2 = await fetchAssetSpecifications();

        expect(result1).toEqual(result2);
    });
});
