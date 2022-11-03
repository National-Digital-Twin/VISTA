import React, { useContext } from "react";
import classNames from "classnames";
import { kebabCase } from "lodash";
import { ElementsContext } from "../../context";
import VerticalDivider from "../../lib/VerticalDivider";

// export const InfoPanelHeader = ({ selected, title, setExpand, expand, children, leftComponent }) => {
//   return (
//     <div className={classNames("flex items-center justify-between", { "border-b border-black-500": expand })}>
//       {title && expand && title}
//       {leftComponent}
//       <InfoPanelActions expand={expand} selected={selected} setExpand={setExpand}>
//         {children}
//       </InfoPanelActions>
//     </div>
//   );
// };

export const InfoPanelHeader = ({ children, expand }) => {
  return (
    <div className={classNames("flex items-center justify-between", { "border-b border-black-500": expand })}>
      {children}
    </div>
  );
};

export const InfoPanelActions = ({ expand, children, setExpand }) => {
  return (
    <div className="flex ml-auto items-center gap-x-2">
      {expand && (
        <>
          {children}
          <VerticalDivider />
        </>
      )}
      <ExpandButton expand={expand} setExpand={setExpand} />
    </div>
  );
};

const ExpandButton = ({ expand, setExpand }) => {
  const toggleView = () => {
    setExpand(!expand);
  };

  const label = `${!expand ? "open" : "close"} details panel`;

  return (
    <div className="relative flex justify-end">
      <button aria-labelledby={kebabCase(label)} className="relative" onClick={toggleView}>
        <i className="ri-information-line text-[color:var(--app-Colour)] !text-2xl" />
        <SelectedBadge expand={expand} />
      </button>
      <div id={kebabCase(label)} role="tooltip" className="right-0">
        {label}
      </div>
    </div>
  );
};

const SelectedBadge = ({ expand }) => {
  const { selectedDetails } = useContext(ElementsContext);

  if (selectedDetails.length >= 1 && !expand) {
    return (
      <span
        id="selected-badge"
        className="absolute -top-1.5 -right-2 flex items-center justify-center w-5 h-5 rounded-full bg-whiteSmoke-200 text-black-200 text-sm"
      >
        {selectedDetails.length}
      </span>
    );
  }
  return null;
};
