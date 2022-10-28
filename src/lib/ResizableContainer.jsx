import { Resizable } from "re-resizable";
import React, { useContext } from "react";
import PropTypes from "prop-types";
import { useMap } from "react-map-gl";

import { CytoscapeContext } from "../context";
import VerticalDivider from "./VerticalDivider";

const ResizableContainer = ({ children }) => {
  const { telicentMap } = useMap();
  const { resize: handleCyResize, runLayout } = useContext(CytoscapeContext);

  const handleResizeStop = () => {
    runLayout();
    telicentMap.resize();
  };

  return (
    <Resizable
      className="relative flex"
      enable={{ right: true }}
      defaultSize={{ width: "50%" }}
      minWidth="20%"
      maxWidth="80%"
      onResize={handleCyResize}
      onResizeStop={handleResizeStop}
    >
      {children}
      <VerticalDivider color="border-whiteSmoke-700" height="h-full" />
    </Resizable>
  );
};

export default ResizableContainer;
ResizableContainer.defaultProps = {
  onResize: () => {},
  onResizeStop: () => {},
  children: null,
};
ResizableContainer.propTypes = {
  onResize: PropTypes.func,
  onResizeStop: PropTypes.func,
  children: PropTypes.node,
};
