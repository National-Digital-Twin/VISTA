import classNames from "classnames";
import { ElementsContext } from "context";
import { isEmpty } from "lodash";
import React, { useContext } from "react";

const ErrorNotification = () => {
  const { errors, dismissErrorNotification } = useContext(ElementsContext);

  return (
    <div
      id="error-notification"
      className={classNames("error-notification", {
        show: !isEmpty(errors),
        hide: isEmpty(errors),
      })}
    >
      {errors.map((error, index) => (
        <li key={`error ${index}`}>
          <p className="text-center">
            {error}
          </p>
          <button
            aria-label="dismiss-error-notification"
            className="ri-close-line !text-base"
            onClick={() => dismissErrorNotification(index)}
          />
        </li>
      ))}
    </div>
  );
};

export default ErrorNotification;
