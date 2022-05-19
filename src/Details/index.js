import React, { useEffect, useState } from "react";
import "./Details.css";
const Details = ({ element, type }) => {
  const [item, setItem] = useState({});
  useEffect(() => {
    if (!element) return;
    setItem(mapToItem(element));
  }, [setItem, element, type]);

  const mapToItem = (element) => ({
    title: element.category === "connection" ? element.label : element.id,
    titleClassName:
      element.category === "connection"
        ? `link-crit-${element.criticality}`
        : undefined,
    titleStyle:
      element.category === "asset" ? { color: element.scoreColour } : undefined,
    sub: element.name,
    subStyle:
      element.category === "asset" ? { color: element.scoreColour } : undefined,
    asset: element,
    connPrefix: element.category === "connection" ? "connects " : undefined,
    connSourceName:
      element.category === "connection"
        ? element.source
          ? element.source.name
          : undefined
        : undefined,
    connSourceStyle:
      element.category === "connection"
        ? element.source
          ? { color: element.source.scoreColour }
          : undefined
        : undefined,
    connLink: element.category === "connection" ? " and " : undefined,
    connTargetName:
      element.category === "connection"
        ? element.target
          ? element.target.name
          : undefined
        : undefined,
    connTargetStyle:
      element.category === "connection"
        ? element.target
          ? { color: element.target.scoreColour }
          : undefined
        : undefined,
    desc: element.desc,
  });

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
        <h2 style={titleStyle} className={titleClassName}>
          {title}
        </h2>
      )}
      {sub && <h5 style={subStyle}>{sub}</h5>}
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
