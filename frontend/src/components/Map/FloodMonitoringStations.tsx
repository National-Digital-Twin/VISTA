import { useState } from "react";
import { Marker, Popup, Source } from "react-map-gl";
import type { MapboxGeoJSONFeature } from "react-map-gl";

import { FEATURE_COLLECTION, GEOJSON } from "./ParalogMap";

export interface FloodMonitoringStationsProps {
  /** Query result to show */
  query: { data: any }; // TODO: Precise type
  /** Whether to show any stations */
  showStations?: boolean;
}

export default function FloodMonitoringStations({
  query,
  showStations = false,
}: FloodMonitoringStationsProps) {
  const [selectedStation, setSelectedStation] = useState<
    MapboxGeoJSONFeature | undefined
  >(undefined);
  const { data: features } = query;

  if (!features || !showStations) {
    return null;
  }

  const handleOnStationClick = (feature: MapboxGeoJSONFeature) =>
    setSelectedStation(feature);
  const handleOnClosePopup = () => setSelectedStation(undefined);

  return (
    <Source
      id="flood-monitoring-stations"
      type={GEOJSON}
      data={{ type: FEATURE_COLLECTION, features: features }}
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
  features: MapboxGeoJSONFeature[];
  onStationClick: (station: MapboxGeoJSONFeature) => void;
}

function StationIcons({ features, onStationClick }: StationIconsProps) {
  return (
    <>
      {features.map((feature: MapboxGeoJSONFeature) => {
        const [longitude, latitude] = (feature.geometry as any).coordinates;
        return (
          <Marker
            key={feature.properties.id}
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
  selectedStation?: MapboxGeoJSONFeature;
  onClose: () => void;
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
      <p>{selectedStation.properties.label}</p>
      <a
        href={`https://environment.data.gov.uk/flood-monitoring/id/stations/${getId(
          selectedStation.properties.id,
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
