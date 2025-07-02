import { IconProp } from "@fortawesome/fontawesome-svg-core";

export interface LayerControlProps {
  /** Current search query */
  readonly searchQuery: string;
}

/** Independent component of the Paralog map */
export default interface Tool {
  /** User-readable name of the tool */
  TOOL_NAME: string;

  /** Overlay element, drawn on top of the map, if any */
  Overlay?: () => JSX.Element;

  /** Side buttons (the small buttons on the right) */
  SideButtons?: (onClickFunc?: any) => JSX.Element;

  /** Polygon buttons (the small buttons on the top) */
  PolygonButtons?: () => JSX.Element;

  /** Toolbar tools (large elements along the top, such as filters or the search bar) */
  ToolbarTools?: () => JSX.Element;

  /** Map elements (actual elements rendered into the geographical map itself */
  MapElements?: () => JSX.Element;

  /** Detail panel (panel raised from the bottom with details e.g. hydrology) */
  DetailPanel?: () => JSX.Element;

  /** [UINext] Control panel tab contents */
  ControlPanelContent?: () => JSX.Element;

  /** [UINext] Control panel tab title and icon */
  controlPanelTab?: {
    title: string;
    icon: IconProp;
  };

  /** [UINext] Layer control */
  LayerControl?: (props: LayerControlProps) => JSX.Element;

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
