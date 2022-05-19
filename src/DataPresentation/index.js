import React, { useContext, useEffect, useState } from "react";

import Details from "../Details";
import { AssetContext } from "../AssetContext";
import { ElementsContext } from "../ElementsContext";
import TelicentMemoMap from "../Map/TelicentMap";
const DataPresentation = () => {
  const { selected, type } = useContext(AssetContext);
  const { assetsRef, connectionsRef } = useContext(ElementsContext);
  const [element, setElement] = useState({});

  useEffect(() => {
    let element;
    if (type === "asset") {
      element = assetsRef.current.find((asset) => asset.uri === selected);
    } else if (type === "connection") {
      element = connectionsRef.current.find(
        (connection) => connection.uri === selected
      );
      element.source = assetsRef.current.find(
        (asset) => asset.uri === element.source
      );
      element.target = assetsRef.current.find(
        (asset) => asset.uri === element.target
      );
    }
    setElement(element);
  }, [selected, type, assetsRef, connectionsRef, setElement]);

  return (
    <section style={{ width: "45%", height: "100%", padding: "4px" }}>
      <PresentationSplit>
        <Details element={element} type={type} />
      </PresentationSplit>
      <PresentationSplit>
        <TelicentMemoMap type={type} element={element} />
      </PresentationSplit>
    </section>
  );
};

const PresentationSplit = ({ children }) => (
  <div style={{ height: "50%" }}>{children}</div>
);

export default DataPresentation;
