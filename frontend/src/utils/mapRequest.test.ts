import { describe, expect, it } from 'vitest';
import { transformMapRequest } from './mapRequest';

describe('transformMapRequest', () => {
    it('returns unchanged URL for non OS requests', () => {
        const url = 'https://example.com/tiles?foo=bar';

        const result = transformMapRequest(url);

        expect(result).toEqual({
            url,
            headers: {},
        });
    });

    it('rewrites OS URL through transparent proxy and strips key', () => {
        const result = transformMapRequest('https://api.os.uk/maps/raster/v1/zxy/Light_3857/0/0/0.png?key=abc123&foo=bar');

        expect(result.headers).toEqual({});
        expect(result.url).toBe(`${globalThis.location.origin}/transparent-proxy/os/maps/raster/v1/zxy/Light_3857/0/0/0.png?foo=bar`);
    });

    it('rewrites OS font URL and appends encoded fonts parameter', () => {
        const result = transformMapRequest('https://api.os.uk/maps/vector/v1/vts/resources/fonts/Open Sans Regular/0-255.pbf?key=xyz&v=1');

        expect(result.url).toBe(
            `${globalThis.location.origin}/transparent-proxy/os/maps/vector/v1/vts/resources/fonts/0-255.pbf?v=1&fonts=Open%20Sans%20Regular`,
        );
    });
});
