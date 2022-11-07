import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

const FloatingPanel = ({
  show,
  collapsedComponent,
  position,
  transparent,
  children,
  className: wrapperClassName,
  style
}) => {
  const wrapperProps = { position, transparent, className: wrapperClassName, style };
  if (show) return <Wrapper {...wrapperProps}>{children}</Wrapper>;
  return <Wrapper {...wrapperProps}>{collapsedComponent}</Wrapper>;
};

export default FloatingPanel;
FloatingPanel.defaultProps = {
  show: true,
};
FloatingPanel.propTypes = {
  show: PropTypes.bool,
  collapsedComponent: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
};

const Wrapper = ({ position, transparent, children, className, style }) => (
  <div
    className={classNames("p-2", {
      [`absolute ${position} z-10`]: position,
      "bg-transparent": transparent,
      "bg-black-200": !transparent,
      [className]: className,
    })}
    style={style}
  >
    {children}
  </div>
);
Wrapper.propTypes = {
  children: PropTypes.node.isRequired,
};