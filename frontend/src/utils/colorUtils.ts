// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import ColorScale from 'color-scales';
import { isEmpty } from './isEmpty';

export function getColorScale(min: number, max: number) {
    return new ColorScale(min, max === 0 ? 100 : max, ['#35C035', '#FFB60A', '#FB3737'], 1);
}

export function getHexColor(colorScale: ColorScale | null, value: number) {
    if (isEmpty(colorScale) || colorScale === null) {
        return undefined;
    }
    return colorScale.getColor(value).toHexString();
}
