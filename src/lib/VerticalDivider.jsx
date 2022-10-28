import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";

const VerticalDivider = ({ color, height }, props) => (
  <div className={classNames("border-r self-center", height, color )} {...props} />
);
export default VerticalDivider;
VerticalDivider.defaultProps = {
  color: "border-whiteSmoke-400",
  height: "h-8",
};
VerticalDivider.propTypes = {
  height: PropTypes.string,
};
