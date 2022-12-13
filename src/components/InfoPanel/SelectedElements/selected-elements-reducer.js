export const SINGLE_ELEMENT = "SINGLE_ELEMENT";
export const LIST_VIEW = "LIST_VIEW";
export const MULTIPLE_ITEMS = "MULTIPLE_ITEMS";
export const RESET_STATE = "RESET STATE";
export const NOTHING_SELECTED = "NOTHING SELECTED";

export const SELECTED_ELEMENTS_INITIAL_STATE = {
  view: NOTHING_SELECTED,
  index: undefined,
  header: {
    title: "Information",
    viewAll: undefined,
    onViewAll: undefined,
  },
};

export const selectedElementsReducer = (state, action) => {
  switch (action.type) {
    case SINGLE_ELEMENT:
      return {
        ...state,
        view: SINGLE_ELEMENT,
        index: 0,
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
        view: SINGLE_ELEMENT,
        header: {
          title: undefined,
          viewAll: "view all selected",
          onViewAll: action.onViewAll,
        },
      };
    case LIST_VIEW:
      return {
        ...state,
        index: -1,
        view: LIST_VIEW,
        header: { title: "Selected Elements", viewAll: undefined, onViewAll: undefined },
      };
    case RESET_STATE:
      return SELECTED_ELEMENTS_INITIAL_STATE;
    default:
      console.error("Unhandled action %s", action.type);
  }
};
