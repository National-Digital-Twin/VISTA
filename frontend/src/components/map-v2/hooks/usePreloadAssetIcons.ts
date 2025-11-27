import { useEffect, useRef, useMemo } from 'react';
import { icon } from '@fortawesome/fontawesome-svg-core';
import type { Asset } from '@/models';

interface PreloadedIcon {
    readonly iconName: string;
    readonly loaded: boolean;
}

const iconCache = new Map<string, PreloadedIcon>();

function preloadIcon(iconName: string): boolean {
    if (iconCache.has(iconName)) {
        return iconCache.get(iconName)!.loaded;
    }

    try {
        const iconDefinition = icon({
            prefix: 'fas',
            iconName: iconName as never,
        });
        const loaded = !!iconDefinition;
        iconCache.set(iconName, { iconName, loaded });
        return loaded;
    } catch {
        iconCache.set(iconName, { iconName, loaded: false });
        return false;
    }
}

function getIconNameFromFaIcon(faIcon?: string): string | null {
    if (!faIcon) {
        return null;
    }
    return faIcon.split(' ').pop()?.replace('fa-', '') || null;
}

export function usePreloadAssetIcons(assets: Asset[]) {
    const preloadedIcons = useRef<Set<string>>(new Set());

    const uniqueIcons = useMemo(() => {
        const iconSet = new Set<string>();
        assets.forEach((asset) => {
            const faIcon = asset.styles?.faIcon;
            if (faIcon) {
                const iconName = getIconNameFromFaIcon(faIcon);
                if (iconName) {
                    iconSet.add(iconName);
                }
            }
        });
        return iconSet;
    }, [assets]);

    useEffect(() => {
        if (uniqueIcons.size === 0) {
            return;
        }

        uniqueIcons.forEach((iconName) => {
            if (preloadedIcons.current.has(iconName)) {
                return;
            }

            preloadIcon(iconName);
            preloadedIcons.current.add(iconName);
        });
    }, [uniqueIcons]);
}

export function isIconPreloaded(iconName: string): boolean {
    return iconCache.get(iconName)?.loaded ?? false;
}
