import { useEffect, useRef, useMemo } from 'react';
import { icon } from '@fortawesome/fontawesome-svg-core';
import { useSuspenseQuery } from '@tanstack/react-query';
import ontologyService from '@/ontology-service';
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
    const preloadedTypes = useRef<Set<string>>(new Set());

    const { data: styles } = useSuspenseQuery({
        queryKey: ['ontology-styles'],
        queryFn: async () => {
            const iconEntries = await ontologyService.getStyles([]);
            return Object.fromEntries(
                Object.keys(iconEntries).map((classUri) => {
                    const value = iconEntries[classUri];
                    return [
                        classUri,
                        {
                            faIcon: value.defaultIcons.faIcon,
                        },
                    ];
                }),
            );
        },
    });

    const uniqueAssetTypes = useMemo(() => {
        return new Set(assets.map((asset) => asset.type).filter(Boolean));
    }, [assets]);

    useEffect(() => {
        if (!styles || uniqueAssetTypes.size === 0) {
            return;
        }

        uniqueAssetTypes.forEach((assetType) => {
            if (preloadedTypes.current.has(assetType)) {
                return;
            }

            const styleData = styles[assetType];
            if (styleData?.faIcon) {
                const iconName = getIconNameFromFaIcon(styleData.faIcon);
                if (iconName) {
                    preloadIcon(iconName);
                }
            }

            preloadedTypes.current.add(assetType);
        });
    }, [styles, uniqueAssetTypes]);
}

export function isIconPreloaded(iconName: string): boolean {
    return iconCache.get(iconName)?.loaded ?? false;
}
