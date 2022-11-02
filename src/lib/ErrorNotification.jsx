import classNames from "classnames";
import { ElementsContext } from "context";
import React, { useContext, useState, useEffect } from "react";

const ErrorNotification = () => {
  const [dismiss, setDismiss] = useState(true);
  const { error } = useContext(ElementsContext);

  useEffect(() => {
    if (error) setDismiss(false);
  }, [error])

  const handleOnClose = () => {
    setDismiss(true);
  };

  console.log("notification", error)

  return (
    <div
      className={classNames("error-notification", { "show": !dismiss, "hide": dismiss || !error })}
    >
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
