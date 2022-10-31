import classNames from "classnames";
import { ElementsContext } from "context";
import React, { useContext, useState } from "react";

const ErrorNotification = ({ msg }) => {
  const { error, setNotificationError } = useContext(ElementsContext);
  // const [show, setShow] = useState(false);

  // if (msg) setShow(true);

  const handleOnClose = () => {
    // console.log("TODO")
    setNotificationError(undefined);
  };

  return (
    <div className={classNames("error-notification", { "hidden": !error, "visible": error })}>
      <p className="text-center">{error}</p>
      <button
        aria-label="dismiss-error-notification"
        className="ri-close-line !text-base"
        onClick={handleOnClose}
      />
    </div>
  );
};

export default ErrorNotification;