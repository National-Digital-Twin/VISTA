export function getURIFragment(uri: string) {
    if (uri) {
        const uriParts = uri.split('#');
        return uriParts.length > 1 ? uriParts[1] : uri;
    }
    return uri;
}
