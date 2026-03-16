// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

export function getURIFragment(uri: string) {
    if (uri) {
        const uriParts = uri.split('#');
        return uriParts.length > 1 ? uriParts[1] : uri;
    }
    return uri;
}
