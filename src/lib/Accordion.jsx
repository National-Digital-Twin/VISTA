import classNames from "classnames";
import React from "react";

const Accordion = ({ show, title, onToggle, subTitle, className: wrapperClassName, children }) => (
  <section aria-labelledby="title" className={classNames("font-body text-whiteSmoke w-full", wrapperClassName)}>
    <button
      className={classNames("flex items-center justify-between w-full", {
        "cursor-default": !onToggle,
      })}
      type="button"
      onClick={onToggle}
    >
      <div className="flex items-center justify-between w-full">
        <h2 className="font-bold text-xl" id="title">
          {title}
        </h2>
        <p>{subTitle}</p>
      </div>
      {onToggle && (
        <i
          className={classNames({
            "ri-arrow-up-s-fill ": show,
            "ri-arrow-down-s-fill": !show,
          })}
        />
      )}
    </button>

    {show && children}
  </section>
);
export default Accordion;
