export const SELECTED_ELEMENTS_INITIAL_STATE = {
  view: "singleElement",
  index: 0,
  header: {
    title: "Information",
    viewAll: undefined,
    panelActions: [],
  },
};
export const SINGLE_ELEMENT = "SINGLE_ELEMENT";
export const LIST_VIEW = "LIST_VIEW";
export const MULTIPLE_ITEMS = "MULTIPLE_ITEMS";

export const selectedElementsReducer = (state, action) => {
  console.log({ action: action.type })
  switch (action.type) {
    case SINGLE_ELEMENT: {
      return {
        ...state,
        index: action.index,
        header: {
          ...state.header,
          title: undefined,
          viewAll: undefined,
          panelActions: action.panelActions,
        },
      };
    }
    case MULTIPLE_ITEMS:
      return {
        ...state,
        index: action.index,
        header: {
          ...state.header,
          title: undefined,
          viewAll: "view all selected",
          panelActions: action.panelActions,
          onViewAll: action.onViewAll,
        },
      };
    case LIST_VIEW:
      return { ...state, index: -1 };
    default:
      console.error("Unhandled action %s", action.type);
  }
};