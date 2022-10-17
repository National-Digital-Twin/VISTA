import React, { useState, useContext, useEffect } from "react";
import { ReactComponent as GoogleMapIcon } from "./assets/google-map-icon.svg";
import { ElementsContext } from "../../ElementsContext";
import { IsEmpty } from "../../utils";
import ElementDetails from "./ElementDetails";

const SelectedElements = () => {
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { selectedDetails } = useContext(ElementsContext);

  useEffect(() => {
    if (selectedDetails.length === 1) {
      setSelectedIndex(0);
      return;
    }
    setSelectedIndex(-1);
  }, [selectedDetails]);

  const handleViewSelected = (index) => {
    setSelectedIndex(index);
  };

  if (IsEmpty(selectedDetails)) return <p>Click on an asset or connection to view details</p>;

  if (selectedIndex >= 0) {
    const selectedElement = selectedDetails[selectedIndex];
    return (
      <>
        <Toolbar
          selectedElements={selectedDetails}
          element={selectedElement}
          onViewAll={handleViewSelected}
        />
        <ElementDetails element={selectedElement} expand />
      </>
    );
  }

  return (
    <>
      <h2 className="text-lg">{selectedDetails.length} Selected Elements</h2>
      <ul className="flex flex-col gap-y-3">
        {selectedDetails.map((selectedElement, index) => (
          <ElementDetails
            key={selectedElement.uri}
            element={selectedElement}
            onViewDetails={() => {
              handleViewSelected(index);
            }}
          />
        ))}
      </ul>
    </>
  );
};

const Toolbar = ({ selectedElements, element, onViewAll }) => {
  if (selectedElements.length === 1 && !element.lat && !element.lng) return null;
  return (
    <div className="flex items-center border-b border-whiteSmoke-800 pb-1">
      {selectedElements.length > 1 && (
        <button onClick={() => onViewAll(-1)} className="flex items-center gap-x-1 mr-auto">
          <span role="img" className="ri-arrow-left-s-line" />
          view all selected
        </button>
      )}
      <StreetView latitude={element.lat} longitude={element.lng} />
    </div>
  );
};

const StreetView = ({ latitude, longitude }) => {
  if (!latitude && !longitude) return null;

  const params = {
    api: 1,
    map_action: "pano",
    viewpoint: `${latitude},${longitude}`,
  };

  return (
    <div className="w-fit flex items-center justify-center gap-x-1 ml-auto">
      <GoogleMapIcon />
      <div>
        <a
          href={`https://www.google.com/maps/@?${new URLSearchParams(params).toString()}`}
          target="_blank"
          rel="noreferrer"
          className="link"
        >
          open street view
        </a>
        <div className="linkBorder" />
      </div>
    </div>
  );
};

export default SelectedElements;
