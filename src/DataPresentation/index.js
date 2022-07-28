import React, { useContext, useEffect, useState } from "react";

import Details from "../Details";
import { AssetContext } from "../AssetContext";
import { ElementsContext } from "../ElementsContext";
import TelicentMemoMap from "../Map/TelicentMap";
const DataPresentation = () => {
  const { selected, type } = useContext(AssetContext);
  const { assetsRef, connectionsRef } = useContext(ElementsContext);
  const [element, setElement] = useState({});

  const findElement = (elements, criteria) =>
    elements.find((element) => element.uri === criteria);

  useEffect(() => {
    let element;
    if (type === "asset") {
      element = findElement(assetsRef.current, selected);
    } else if (type === "connection") {
      element = findElement(connectionsRef.current, selected);
      // TODO: check if uri exists on result
      const source = findElement(assetsRef.current, element.source);
      const target = findElement(assetsRef.current, element.target);
      if (!source || !source.uri) {
        console.warn(
          `Source ${element.uri} element has no source or source uri does not exist`
        );
      } else {
        element.source = source.uri;
      }

      if (!target || !target.uri) {
        console.warn(
          `Target ${element.uri} element has no target or target uri does not exist`
        );
      } else {
        element.target = target.uri;
      }
    }
    setElement(element);
  }, [selected, type, assetsRef, connectionsRef, setElement]);

  return (
    <section style={{ width: "45%", height: "100%", padding: "16px" }}>
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
