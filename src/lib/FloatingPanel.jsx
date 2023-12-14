import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

const FloatingPanel = ({
  show,
  collapsedComponent,
  position,
  transparent,
  id,
  className: wrapperClassName,
  children,
  style,
}) => {
  return (
    <div
      id={id}
      className={classNames("p-2", {
        [`absolute ${position} z-10`]: position,
        "bg-transparent": transparent,
        "bg-black-200": !transparent,
        [wrapperClassName]: wrapperClassName,
      })}
      style={style}
    >
      {children}
    </div>
  );
};

export default FloatingPanel;

FloatingPanel.defaultProps = {
  show: true,
};
FloatingPanel.propTypes = {
  show: PropTypes.bool,
  position: PropTypes.string,
  transparent: PropTypes.string,
  id: PropTypes.string,
  className: PropTypes.string,
  collapsedComponent: PropTypes.node,
  children: PropTypes.node.isRequired,
};
