import React, { useContext } from "react";
import { Timeline as PrimeReactTimeline } from "primereact/timeline";
import { isEmpty } from "lodash";

import { ElementsContext } from "context";
import { useFloodTimeline } from "hooks";

import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

const FloodZoneTimeline = () => {
  const { selectedTimeline, closeTimelinePanel } = useContext(ElementsContext);

  if (isEmpty(selectedTimeline)) return null;

  return (
    <div className="absolute right-0 max-h-full h-full w-72 bg-black-200 z-10">
      <div className="flex items-center">
        <button onClick={closeTimelinePanel}>
          <i className="ri-close-fill hover:bg-black-400 rounded-md mr-2" title="Close Flood Timeline" />
        </button>
        <h6>Flood severity timeline </h6>
      </div>
      <Timeline areaCode={selectedTimeline?.properties?.FWS_TACODE} areaName={selectedTimeline?.properties?.TA_NAME} />
    </div>
  );
};

export default FloodZoneTimeline;

const Timeline = ({ areaCode, areaName }) => {
  const { isLoading, isError, error, data } = useFloodTimeline(areaCode);

  if (isLoading) return <p className="ml-2">fetching timeline...</p>;
  if (isError) return <p className="ml-2">{error.message}</p>;
  if (isEmpty(data)) return <p>No timeline data to display</p>;

  return (
    <>
      <div className="relative right-0 h-fit bg-black-200">
        <p className="ml-2 mb-2">Area: {areaName}</p>
        <div className="grid grid-cols-10 items-center">
          <p className="col-end-3 text-sm ml-3">Date</p>
          <p className="col-start-6 col-end-10 text-sm ml-4">Flood Severity Level</p>
        </div>
      </div>
      <div className="absolute right-0 h-fit max-h-full w-72 overflow-y-scroll">
        <PrimeReactTimeline
          value={data}
          opposite={(item) => <p className="text-sm">{item.period}</p>}
          content={(item) => <p className="text-sm">Level: {item.floodSeverityLevel}</p>}
          className="w-full md:w-20rem mt-3"
        />
      </div>
    </>
  );
};
