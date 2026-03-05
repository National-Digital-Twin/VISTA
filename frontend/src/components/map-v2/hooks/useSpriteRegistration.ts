// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { useEffect, useRef } from 'react';
import { useMap } from 'react-map-gl/maplibre';

function useSpriteRegistration<TStyle>(
    mapReady: boolean | undefined,
    styles: Map<string, TStyle>,
    generateSprite: (style: TStyle) => Promise<HTMLCanvasElement>,
    onGeneratingChange?: (isGenerating: boolean) => void,
): void {
    const mapContext = useMap();
    const mapInstance = mapContext?.['map-v2'] || mapContext?.default || null;
    const addedIconsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!mapInstance || !mapReady) {
            return;
        }

        const map = mapInstance.getMap();

        const generate = async () => {
            const pending: { markerId: string; style: TStyle }[] = [];

            styles.forEach((style, markerId) => {
                if (addedIconsRef.current.has(markerId) || map.hasImage(markerId)) {
                    return;
                }
                pending.push({ markerId, style });
            });

            if (pending.length === 0) {
                return;
            }

            onGeneratingChange?.(true);

            await Promise.all(
                pending.map(async ({ markerId, style }) => {
                    try {
                        const canvas = await generateSprite(style);
                        const ctx = canvas.getContext('2d');
                        if (!ctx) {
                            return;
                        }

                        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                        if (!map.hasImage(markerId)) {
                            map.addImage(markerId, { width: canvas.width, height: canvas.height, data: imageData.data }, { pixelRatio: 1 });
                            addedIconsRef.current.add(markerId);
                        }
                    } catch (error) {
                        console.error(`Failed to generate sprite for ${markerId}:`, error);
                    }
                }),
            );

            onGeneratingChange?.(false);
        };

        generate();
    }, [mapInstance, mapReady, styles, generateSprite, onGeneratingChange]);
}

export default useSpriteRegistration;
