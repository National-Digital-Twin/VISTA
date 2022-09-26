import React, { useContext, useEffect, useState } from "react";

import { AssetContext } from "../../AssetContext";
import { ElementsContext } from "../../ElementsContext";
import Details from "../Details/Details";
import TelicentMemoMap from "../Map/TelicentMap";

const findElement = (elements, criteria) =>
  elements.find((element) => element.uri === criteria);

const DataPresentation = () => {
  const { selected, type } = useContext(AssetContext);
  const { elements } = useContext(ElementsContext);
  const [element, setElement] = useState({});

  useEffect(() => {
    const selectedElement =
      type === "asset"
        ? findElement(elements.assets, selected)
        : findElement(elements.connections, selected);
    setElement(selectedElement);
  }, [selected, type, elements, setElement]);

  return (
    <div style={{ width: "45%", height: "100%", padding: "16px" }}>
      <PresentationSplit>
        <Details element={element} type={type} />
      </PresentationSplit>
      <PresentationSplit>
        <TelicentMemoMap type={type} element={element} />
      </PresentationSplit>
    </div>
  );
};

const PresentationSplit = ({ children }) => (
  <div style={{ height: "50%" }}>{children}</div>
);

export default DataPresentation;
