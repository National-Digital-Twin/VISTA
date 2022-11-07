import classNames from "classnames";
import { ElementsContext } from "context";
import { isEmpty } from "lodash";
import React, { useContext } from "react";

const ErrorNotification = () => {
  const { errors, dismissErrorNotification } = useContext(ElementsContext);

  return (
    <div
      id="error-notification"
      className={classNames("absolute top-0 w-full z-20", {
        visible: !isEmpty(errors),
        hidden: isEmpty(errors),
      })}
    >
      <ul className="grid gap-y-1">
        {errors.map((error, index) => (
          <li key={`error ${index}`} className="error-notification">
            <p className="text-center">{error}</p>
            <button
              aria-label="dismiss-error-notification"
              className="ri-close-line !text-base"
              onClick={() => dismissErrorNotification(error)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ErrorNotification;
