export const SELECTED_ELEMENTS_INITIAL_STATE = {
  view: "singleElement",
  index: undefined,
  header: {
    title: "Information",
    viewAll: undefined,
    onViewAll: undefined
  },
};
export const SINGLE_ELEMENT = "SINGLE_ELEMENT";
export const LIST_VIEW = "LIST_VIEW";
export const MULTIPLE_ITEMS = "MULTIPLE_ITEMS";
export const RESET_STATE = "RESET_STATE";

export const selectedElementsReducer = (state, action) => {
  switch (action.type) {
    case SINGLE_ELEMENT:
      return {
        ...state,
        index: action.index,
        header: {
          title: undefined,
          viewAll: undefined,
          onViewAll: undefined,
        },
      };
    case MULTIPLE_ITEMS:
      return {
        ...state,
        index: action.index,
        header: {
          title: undefined,
          viewAll: "view all selected",
          onViewAll: action.onViewAll,
        },
      };
    case LIST_VIEW:
      return { ...state, index: -1, header: { title: "Selected Elements", viewAll: undefined, onViewAll: undefined } };
    case RESET_STATE:
      return SELECTED_ELEMENTS_INITIAL_STATE;
    default:
      console.error("Unhandled action %s", action.type);
  }
};
