import { CircleCreationButton } from './CircleCreationButton';
import { FreehandCreationButton } from './FreehandCreationButton';

export const TOOL_NAME = 'Polygon creation menu';

export function PolygonButtons() {
    return (
        <>
            <CircleCreationButton />
            <FreehandCreationButton />
        </>
    );
}

export const POLYGON_BUTTON_ORDER = 0;
