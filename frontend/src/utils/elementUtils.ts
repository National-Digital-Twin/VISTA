// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

export type ElementLike = { id: string; elementType: 'asset' };

export function findElement<T extends ElementLike>(elements: T[], id: string): T | undefined {
    return elements?.find((element) => element.id === id);
}

export function isAsset<T extends ElementLike>(element?: T) {
    return element?.elementType === 'asset';
}
