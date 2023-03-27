import { Timeline } from "primereact/timeline";
import React, { useContext } from "react";
import useFetch from "use-http";
import config from "config/app-config";
import { isEmpty } from "lodash";
import { ElementsContext } from "context";

const sortByDate = (a, b) => {
  a = a.period.toString().split("/");
  b = b.period.toString().split("/");
  return b[2] - a[2] || b[1] - a[1] || b[0] - a[0];
};

const FloodZoneTimeline = () => {
  const { selectedTimeline, setTimelineToNull } = useContext(ElementsContext);

  const { data } = useFetch(
    `${config.api.url}/states?parent_uri=http://environment.data.gov.uk/flood-monitoring/id/floodAreas/${selectedTimeline?.properties.FWS_TACODE}`,
    [selectedTimeline]
  );

  if (isEmpty(selectedTimeline)) return null;
  if (data) {
    const array = Object.values(data);
    const timelineData = [];

    array.map((item) => {
      return timelineData.push({
        period: item.period.split("-").reverse().join("/"),
        FloodSeverityLevel: item.representations.map(
          (i) => i["http://ies.data.gov.uk/ontology/ies4#EnvironmentAgencyFloodSeverityLevel"]
        ),
      });
    });

    const sortedData = timelineData.sort(sortByDate);

    return (
      <div className="absolute right-0 max-h-full h-full w-72 bg-black-200">
        <div className="z-50 relative right-0 h-fit bg-black-200">
          <div className="flex items-center ">
            <button onClick={setTimelineToNull}>
              <i className="ri-arrow-right-s-line hover:bg-black-400 rounded-md mr-2" title="Close Flood Timeline" />
            </button>
            <h6>Flood severity timeline </h6>
          </div>
          <p className="ml-2 mb-2">Area: {selectedTimeline.properties.TA_NAME}</p>
          <div className="grid grid-cols-10 items-center">
            <p className="col-end-3 text-sm ml-3">Date</p>
            <p className="col-start-6 col-end-10 text-sm ml-4">Flood Severity Level</p>
          </div>
        </div>
        <div className="absolute right-0 h-fit max-h-full w-72 overflow-y-scroll">
          <Timeline
            value={sortedData}
            opposite={(item) => <p className="text-sm">{item.period}</p>}
            content={(item) => <p className="text-sm">Level: {item.FloodSeverityLevel}</p>}
            className="w-full md:w-20rem mt-3"
          />
        </div>
      </div>
    );
  }
  return null;
};

export default FloodZoneTimeline;
