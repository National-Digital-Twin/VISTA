// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

export function transformMapRequest(url: string): { url: string; headers: Record<string, string> } {
    let transformedUrl = url;
    const headers: Record<string, string> = {};

    if (transformedUrl.includes('api.os.uk')) {
        const urlParts = transformedUrl.split('api.os.uk');
        const routeParams = urlParts.at(-1) ?? '';

        if (routeParams.startsWith('/')) {
            transformedUrl = `${globalThis.location.origin}/transparent-proxy/os/${routeParams.substring(1)}`;
        } else {
            transformedUrl = `${globalThis.location.origin}/transparent-proxy/os/${routeParams}`;
        }

        const fontMatch = /fonts\/(.*?)\//.exec(routeParams);
        if (fontMatch) {
            const requestedFont = fontMatch[1];
            const encodedRequestedFont = encodeURIComponent(requestedFont);

            transformedUrl += `&fonts=${encodedRequestedFont}`;
            transformedUrl = transformedUrl.replace(`/${requestedFont}/`, '/');
        }

        transformedUrl = transformedUrl.replace(/\?key=[^&]+&/, '?');
    }

    return { url: transformedUrl, headers };
}
