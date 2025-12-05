export type ElementLike = { id: string; elementType: 'asset' };

export function findElement<T extends ElementLike>(elements: T[], id: string): T | undefined {
    return elements?.find((element) => element.id === id);
}

export function isAsset<T extends ElementLike>(element?: T) {
    return element?.elementType === 'asset';
}
