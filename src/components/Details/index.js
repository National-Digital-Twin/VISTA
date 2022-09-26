import React, { useEffect, useState } from "react";
import { IsEmpty } from "../../utils";
import { AssetElement, ConnectionElement } from "./ConnectionElement";
import "./Details.css";

const Details = ({ element, type }) => {
  const [item, setItem] = useState({});
  useEffect(() => {
    if (IsEmpty(element)) return;
    setItem(mapToItem(element));
  }, [setItem, element, type]);

  const mapToItem = (element) => {
    if (element.category === "connection") {
      return new ConnectionElement(element);
    } else {
      return new AssetElement(element);
    }
  };

  const {
    title,
    titleStyle,
    titleClassName,
    sub,
    subStyle,
    asset,
    connPrefix,
    connSourceName,
    connSourceStyle,
    connLink,
    connTargetName,
    connTargetStyle,
    desc,
  } = item;

  return (
    <div>
      {title && (
        <h2 style={titleStyle} className={`heading-style-1 ${titleClassName}`}>
          {title}
        </h2>
      )}
      {sub && (
        <h3 className="heading-style-2" style={subStyle}>
          {sub}
        </h3>
      )}
      <span style={{ color: "white" }}>
        {!asset && "Click on an asset or connection to view details"}
      </span>
      {connPrefix && <span style={{ color: "white" }}>{connPrefix}</span>}
      {connSourceName && <span style={connSourceStyle}>{connSourceName}</span>}
      {connLink && <span style={{ color: "white" }}>{connLink}</span>}
      {connTargetName && <span style={connTargetStyle}>{connTargetName}</span>}
      {desc && <span>{desc}</span>}
    </div>
  );
};

export default Details;
