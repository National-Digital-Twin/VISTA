import { useQuery } from '@tanstack/react-query';
import type Tool from './Tool';

import TOOLS from './tools';

export type ToolOrder =
    | 'definition-order'
    | 'side-button-order'
    | 'polygon-button-order'
    | 'toolbar-order'
    | 'map-element-order'
    | 'control-panel-order'
    | 'layer-control-order';

const ORDER_INDICES: Record<ToolOrder, (tool: Tool) => number> = {
    'definition-order': () => 0,
    'side-button-order': (tool) => tool.SIDE_BUTTON_ORDER ?? 0,
    'polygon-button-order': (tool) => tool.POLYGON_BUTTON_ORDER ?? 0,
    'toolbar-order': (tool) => tool.TOOLBAR_BUTTON_ORDER ?? 0,
    'map-element-order': (tool) => tool.MAP_ELEMENT_ORDER ?? 0,
    'control-panel-order': (tool) => tool.CONTROL_PANEL_TAB_ORDER ?? 0,
    'layer-control-order': (tool) => tool.LAYER_CONTROL_ORDER ?? 0,
};

function sortToolsByOrderIndex(tools: Tool[], orderIndex: (tool: Tool) => number): Tool[] {
    // Consider using `.toSorted` since it's in Baseline 2023
    const sortedTools = [...tools];
    // Array.prototype.sort is stable under ECMAScript 2019, so where we have
    // equal orderIndices this preserves definition order.
    sortedTools.sort((left, right) => (orderIndex(left) || 0) - (orderIndex(right) || 0));
    return sortedTools;
}

function sortToolsInOrder(tools: Tool[], order: ToolOrder): Tool[] {
    const orderIndex: (tool: Tool) => number = ORDER_INDICES[order];
    return sortToolsByOrderIndex(tools, orderIndex);
}

export function useTools(): (order: ToolOrder) => Tool[] {
    const {
        data: tools,
        error,
        isLoading,
    } = useQuery({
        queryKey: ['tools'],
        queryFn: async () => {
            const selectedTools = TOOLS.filter(Boolean) as (() => Promise<Tool>)[];
            return Promise.all(selectedTools.map((fn) => fn()));
        },
    });

    if (isLoading) {
        return () => []; // Return an empty array or handle loading state if needed
    }

    if (error) {
        console.error('Error fetching tools:', error);
        return () => []; // Return an empty array or handle error state if needed
    }

    // Return a function that orders the tools (implementation not shown)
    return (order: ToolOrder) => {
        return sortToolsInOrder(tools ?? [], order);
    };
}
