import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRoad } from "@fortawesome/free-solid-svg-icons";

const LegendContent: React.FC = () => {
  return (
    <>
      <h3 className="menu-title">Legend</h3>
      <div className="menu-item">
        <div className="flex items-center">
          <FontAwesomeIcon icon={faRoad} className="mr-2" />
          <span className="font-semibold">Road Criticality</span>
        </div>
        <div className="mt-2 flex items-center space-x-4">
          <div className="flex items-center">
            <div className="w-4 h-1 bg-[#35C035] mr-1" />
            <span className="text-sm">Low</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-1 bg-[#FFB60A] mr-1" />
            <span className="text-sm">Medium</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-1 bg-[#FB3737] mr-1" />
            <span className="text-sm">High</span>
          </div>
        </div>
      </div>
    </>
  );
};

export default LegendContent;
