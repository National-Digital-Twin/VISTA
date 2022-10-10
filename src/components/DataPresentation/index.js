import React, { useContext } from "react";

import { AssetContext } from "../../AssetContext";
import { ElementsContext } from "../../ElementsContext";
import Details from "../Details/Details";
import TelicentMap from "../Map/TelicentMap";

const findElement = (elements, criteria) => elements.find((element) => element.uri === criteria);

const DataPresentation = () => {
  const { selected, type } = useContext(AssetContext);
  const { elements } = useContext(ElementsContext);

  const selectedElement =
    type === "asset"
      ? findElement(elements.assets, selected)
      : findElement(elements.connections, selected) ?? {};

  return (
    <div style={{ width: "45%", height: "100%", padding: "16px" }}>
      <Details element={selectedElement} type={type} />
      <TelicentMap selectedElement={selectedElement} />
    </div>
  );
};

export default DataPresentation;
