import React from "react";
import { IsEmpty } from "../../../utils";
import ElementDetails from "./ElementDetails";

const RenderElementDetails = ({ selected, handleViewSelected, view }) => {
  if (IsEmpty(selected)) {
    return <p>Click on an asset or connection to view details</p>;
  }
  return (
    <>
      <MultiSelected selected={selected} view={view} handleViewSelected={handleViewSelected} />
      <SingleView selected={selected} view={view} />
    </>
  );
};

const MultiSelected = ({ selected, handleViewSelected, view }) => {
  if (view === "multipleItems") {
    return (
      <ul className="flex flex-col gap-y-3">
        {selected.map((selectedElement, index) => (
          <ElementDetails
            key={selectedElement.uri}
            element={selectedElement}
            onViewDetails={() => {
              handleViewSelected(index);
            }}
          />
        ))}
      </ul>
    );
  }
  return null;
};

const SingleView = ({ selected, view }) => {
  if (view === "singleItem") {
    return <ElementDetails element={selected} expand />;
  }
  return null;
};

export default RenderElementDetails;
