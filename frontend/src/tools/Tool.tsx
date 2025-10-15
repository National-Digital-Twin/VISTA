import { IconProp } from '@fortawesome/fontawesome-svg-core';
import type { ReactElement } from 'react';

export interface LayerControlProps {
    /** Current search query */
    readonly searchQuery: string;
}

/** Independent component of the Paralog map */
export default interface Tool {
    /** User-readable name of the tool */
    TOOL_NAME: string;

    /** Overlay element, drawn on top of the map, if any */
    Overlay?: () => ReactElement;

    /** Side buttons (the small buttons on the right) */
    SideButtons?: (onClickFunc?: any) => ReactElement;

    /** Polygon buttons (the small buttons on the top) */
    PolygonButtons?: () => ReactElement;

    /** Toolbar tools (large elements along the top, such as filters or the search bar) */
    ToolbarTools?: () => ReactElement;

    /** Map elements (actual elements rendered into the geographical map itself */
    MapElements?: () => ReactElement;

    /** Detail panel (panel raised from the bottom with details e.g. hydrology) */
    DetailPanel?: () => ReactElement;

    /** [UINext] Control panel tab contents */
    ControlPanelContent?: () => ReactElement;

    /** [UINext] Control panel tab title and icon */
    controlPanelTab?: {
        title: string;
        icon: IconProp;
    };

    /** [UINext] Layer control */
    LayerControl?: (props: LayerControlProps) => ReactElement;

    /** Side button order index */
    SIDE_BUTTON_ORDER?: number;

    /** Polygon button order index */
    POLYGON_BUTTON_ORDER: number;

    /** Toolbar button order index */
    TOOLBAR_BUTTON_ORDER?: number;

    /** Map element order index */
    MAP_ELEMENT_ORDER?: number;

    /** [UINext] Control panel tab order */
    CONTROL_PANEL_TAB_ORDER?: number;

    /** [UINext] Layer control order */
    LAYER_CONTROL_ORDER?: number;
}
