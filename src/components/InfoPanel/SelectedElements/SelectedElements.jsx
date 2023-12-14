import React, { useEffect, useMemo, useState } from "react";
import { isEmpty } from "lodash";

import ElementDetails from "./ElementDetails";
import InfoHeader, { InfoTitle, StreetView } from "../InfoHeader";
import classNames from "classnames";

const SelectedElements = ({ selectedElements, onTogglePanel }) => {
  const [index, setIndex] = useState(undefined);

  const totalSelected = useMemo(() => selectedElements?.length || 0, [selectedElements]);

  useEffect(() => {
    if (!Array.isArray(selectedElements)) return;
    if (isEmpty(selectedElements)) {
      setIndex(undefined);
      return;
    }
    if (selectedElements.length === 1) {
      setIndex(0);
      return;
    }
  }, [selectedElements]);

  const handleOnViewDetails = (index) => {
    setIndex(index);
  };

  const viewAllSelected = () => {
    setIndex(-1);
  };

  if (!Array.isArray(selectedElements)) return null;

  if (index >= 0 && totalSelected !== 0) {
    return (
      <SingleElementDetails
        selected={selectedElements[index]}
        totalSelected={totalSelected}
        onTogglePanel={onTogglePanel}
        onViewAll={viewAllSelected}
      />
    );
  }

  if (totalSelected > 1) {
    return (
      <ElementsList
        selectedElements={selectedElements}
        totalSelected={totalSelected}
        onViewDetails={handleOnViewDetails}
        onTogglePanel={onTogglePanel}
      />
    );
  }

  return (
    <>
      <InfoHeader
        isExpanded
        count={totalSelected}
        onToggle={onTogglePanel}
        className="justify-between"
      >
        <InfoTitle>Information</InfoTitle>
      </InfoHeader>
      <p>Click on an asset or connection to view details</p>
    </>
  );
};

export default SelectedElements;

const SingleElementDetails = ({ selected, totalSelected, onTogglePanel, onViewAll }) => {
  const isMoreThanOneSelected = totalSelected > 1;
  return (
    <>
      <InfoHeader
        isExpanded
        count={totalSelected}
        onToggle={onTogglePanel}
        className={classNames({
          "justify-between": isMoreThanOneSelected,
          "justify-end": !isMoreThanOneSelected,
        })}
      >
        {isMoreThanOneSelected && (
          <button onClick={onViewAll} className="flex items-center">
            <span role="img" className="flex place-content-center ri-arrow-left-s-line" />
            view all selected
          </button>
        )}
        <StreetView latitude={selected?.lat} longitude={selected?.lng} className="ml-auto" />
      </InfoHeader>
      <ElementDetails expand element={selected} />
    </>
  );
};

const ElementsList = ({ selectedElements, totalSelected, onViewDetails, onTogglePanel }) => (
  <>
    <InfoHeader
      isExpanded
      count={totalSelected}
      onToggle={onTogglePanel}
      className="justify-between"
    >
      <InfoTitle>Selected Elements</InfoTitle>
    </InfoHeader>
    <ul className="flex flex-col gap-y-3 grow min-h-0 overflow-y-auto">
      {selectedElements.map((selectedElement, index) => (
        <ElementDetails
          key={selectedElement.id}
          element={selectedElement}
          onViewDetails={() => onViewDetails(index)}
        />
      ))}
    </ul>
  </>
);
