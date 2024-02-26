import React, { useState } from "react";
import classNames from "classnames";

const FloodWarningWidget = () => {
  const [isOpen, setIsOpen] = useState(false);

  const togglePanel = () => {
    setIsOpen((isOpen) => !isOpen);
  };

  return (
    <div className="absolute bottom-8 right-0 bg-black-100 flex p-1">
      <button className="flex flex-col items-center justify-center gap-y-2" onClick={togglePanel}>
        <i
          className={classNames("fa-solid fa-arrow-left", { "fa-rotate-180": isOpen })}
        />
        <span className="flood-warning-widget__btn">{isOpen ? "Close" : "Flood warnings"}</span>
      </button>
      <iframe
        id="flood-warnings-iframe"
        title="Flood warnings in Isle of Wight"
        width={isOpen ? "355px" : "0px"}
        height="152px"
        src={`https://environment.data.gov.uk/flood-widgets/widgets/widget-IsleofWight-horizontal.html`}
        className={classNames("flood-warning-widget__iframe", {
          "opacity-0": !isOpen,
          "opacity-100": isOpen,
        })}
      />
    </div>
  );
};

export default FloodWarningWidget;
