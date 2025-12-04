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
