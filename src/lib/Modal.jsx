import classNames from "classnames";
import PropTypes from "prop-types";
import React from "react";
import ReactModal from "react-modal";

const Modal = ({
  appElement,
  aria,
  contentLabel,
  isOpen,
  onRequestClose,
  overlayClassName,
  className: modalClassName,
  children,
}) => (
  <ReactModal
    aria={aria}
    appElement={document.getElementById(appElement)}
    className={classNames(
      "absolute inset-x-0 mx-auto top-1/2 -translate-y-1/2 bg-black-300 w-fit font-body",
      modalClassName
    )}
    contentLabel={contentLabel}
    isOpen={isOpen}
    onRequestClose={onRequestClose}
    overlayClassName={classNames("fixed inset-0 bg-black-100/80 z-10", overlayClassName)}
  >
    {children}
  </ReactModal>
);

export default Modal;

Modal.propTypes = {
  appElement: PropTypes.string.isRequired,
  aria: PropTypes.object,
  contentLabel: PropTypes.string,
  isOpen: PropTypes.bool.isRequired,
  onRequestClose: PropTypes.func,
  overlayClassName: PropTypes.string,
  classNames: PropTypes.string,
  children: PropTypes.node,
};

Modal.defaultProps = {
  aria: {},
  contentLabel: "",
  overlayClassName: "",
  classNames: "",
};