import { ElementsContext } from "context";
import React, { useContext, useState, useEffect } from "react";

const ErrorNotification = ({ msg }) => {
  let [show, setShow] = useState(true);
  const { error } = useContext(ElementsContext);

  useEffect(() => {
    console.log('show has changed, reset component state here or pass input to change the value of show?!', show)
   }, [show]);

  const handleOnClose = () => {
    setShow(!show);
  };

  return (
    <div className={[ show && error ? "error-notification visible" : "error-notification hidden"]} >
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