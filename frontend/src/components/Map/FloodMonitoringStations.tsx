import { useState } from "react";
import { Marker, Popup, Source } from "react-map-gl";
import type { Feature } from "geojson"; // ✅ Use standard GeoJSON Feature

import { FEATURE_COLLECTION, GEOJSON } from "./ParalogMap";

export interface FloodMonitoringStationsProps {
  /** Query result to show */
  readonly query: { data: any };
  /** Whether to show any stations */
  readonly showStations?: boolean;
}

export default function FloodMonitoringStations({
  query,
  showStations = false,
}: FloodMonitoringStationsProps) {
  const [selectedStation, setSelectedStation] = useState<Feature | undefined>(
    undefined,
  );
  const { data: features } = query;

  if (!features || !showStations) {
    return null;
  }

  const handleOnStationClick = (feature: Feature) =>
    setSelectedStation(feature);
  const handleOnClosePopup = () => setSelectedStation(undefined);

  return (
    <Source
      id="flood-monitoring-stations"
      type={GEOJSON}
      data={{ type: FEATURE_COLLECTION, features }}
    >
      <StationIcons features={features} onStationClick={handleOnStationClick} />
      <StationPopup
        selectedStation={selectedStation}
        onClose={handleOnClosePopup}
      />
    </Source>
  );
}

interface StationIconsProps {
  readonly features: Feature[]; // ✅ Updated type
  readonly onStationClick: (station: Feature) => void;
}

function StationIcons({ features, onStationClick }: StationIconsProps) {
  return (
    <>
      {features.map((feature) => {
        const [longitude, latitude] = (feature.geometry as any).coordinates;
        return (
          <Marker
            key={feature.properties?.id} // ✅ Added optional chaining to prevent crashes
            longitude={longitude}
            latitude={latitude}
            onClick={() => onStationClick(feature)}
            style={{ cursor: "pointer" }}
          >
            <i className="fa-solid fa-arrow-up-from-ground-water fa-xl text-whiteSmoke" />
          </Marker>
        );
      })}
    </>
  );
}

interface StationPopupProps {
  readonly selectedStation?: Feature; // ✅ Updated type
  readonly onClose: () => void;
}

function StationPopup({ selectedStation, onClose }: StationPopupProps) {
  if (!selectedStation) {
    return null;
  }

  const getId = (id: string) => {
    const parts = id.split("/");
    return parts.at(-1);
  };

  const [longitude, latitude] = (selectedStation.geometry as any).coordinates;
  const offset: [number, number] = [0, -8];

  return (
    <Popup
      longitude={longitude}
      latitude={latitude}
      anchor="bottom"
      onClose={onClose}
      closeOnClick={false}
      className="font-body text-sm"
      offset={offset}
    >
      <h4 className="mr-6 font-medium">Monitoring Station</h4>
      <p>{selectedStation.properties?.label}</p>
      <a
        href={`https://environment.data.gov.uk/flood-monitoring/id/stations/${getId(
          selectedStation.properties?.id ?? "",
        )}.html`}
        target="_blank"
        rel="noreferrer"
        className="flex items-center gap-x-1"
      >
        <i className="fa-solid fa-arrow-right fa-xs pt-1" />
        <span className="underline underline-offset-4">view details</span>
      </a>
    </Popup>
  );
}
