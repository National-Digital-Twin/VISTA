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
  style,
  width,
  children,
}) => {
  const wrapperProps = { position, transparent, id, width, className: wrapperClassName, style, show };
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

const Wrapper = ({ position, transparent, id, className, style, width, show, children }) => (
  <div
    id={id}
    className={classNames("p-2", {
      [`absolute ${position} z-10`]: position,
      "bg-transparent": transparent,
      "bg-black-200": !transparent,
      [`w-[${width}]`]: width && show,
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
