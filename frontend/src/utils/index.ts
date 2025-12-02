import ColorScale from 'color-scales';
import { noCase } from 'change-case';
import { isEmpty } from './isEmpty';
import { prefixLookup } from '@/config/uri-prefix';

/* This type is limited and internal here */
export type ElementLike = { id: string; elementType: 'dependency' | 'asset' };

export function findElement<T extends ElementLike>(elements: T[], id: string): T | undefined {
    return elements?.find((element) => element.id === id);
}

export function isElementCached<T extends ElementLike>(elements: T[], id: string) {
    return elements?.some((element) => element.id === id);
}

export function isAsset<T extends ElementLike>(element?: T) {
    return element?.elementType === 'asset';
}

export function isDependency<T extends ElementLike>(element?: T) {
    return element?.elementType === 'dependency';
}

export function getShortType(type: string) {
    if (type) {
        const URLFragments = type.split('#');
        if (URLFragments.length === 2) {
            const prefix = prefixLookup[URLFragments[0]];
            const name = noCase(URLFragments[1]);
            return prefix + name;
        }
        return type;
    }
    return type;
}

export function getURIFragment(uri: string) {
    if (uri) {
        const uriParts = uri.split('#');
        return uriParts.length > 1 ? uriParts[1] : uri;
    }
    return uri;
}

export function getColorScale(min: number, max: number) {
    return new ColorScale(min, max === 0 ? 100 : max, ['#35C035', '#FFB60A', '#FB3737'], 1);
}

export function getHexColor(colorScale: ColorScale | null, value: number) {
    if (isEmpty(colorScale)) {
        return undefined;
    }
    return colorScale.getColor(value).toHexString();
}

export function getUniqueElements<T extends ElementLike>(elements: T[]) {
    const uniqueElements = elements.reduce((acc, current) => {
        const isAdded = acc.find((element) => element.id === current.id);
        if (isAdded) {
            return acc;
        } else {
            return acc.concat([current]);
        }
    }, [] as T[]);
    return uniqueElements;
}
