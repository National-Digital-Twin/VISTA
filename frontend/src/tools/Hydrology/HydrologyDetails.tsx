import { useMemo } from "react";
import styles from "./style.module.css";
import SummaryInfo from "./chart/SummaryInfo";
import RiverLevelChart from "./chart/RiverLevelChart";
import { useLatestHydrologyReading } from "./useHydrologyReadings";
import type { HydrologyStation, HydrologyMeasure } from "@/api/hydrology";
import TabsContainer from "@/components/DetailsPanel/TabsContainer";
import useHydroTidesWeatherStore from "@/components/DetailsPanel/useHydroTidesWeatherStore";

export default function HydrologyDetails() {
  const { selectedStation } = useHydroTidesWeatherStore();

  if (!selectedStation || selectedStation.type !== "hydrology") {
    return null;
  }

  const station = selectedStation.data as HydrologyStation;

  const availableMeasures = station?.measures.filter(
    (measure) => measure.period === 900,
  );
  if (!availableMeasures) {
    return <div>No measures found for a chart</div>;
  }

  const tabs = availableMeasures.map((measure) => ({
    label: measure.parameter,
    content: (
      <HydrologyStationMeasureData
        name={station.name}
        measure={measure}
        RLOIid={station.RLOIid}
      />
    ),
  }));

  return (
    <div className={styles.hydrologyDetails}>
      <TabsContainer tabs={tabs} />
    </div>
  );
}

const subtractDays = (date, numberOfDays) => {
  const past = new Date(date);
  past.setDate(past.getDate() - numberOfDays);
  return past;
};

interface HydrologyStationMeasureDataProps {
  readonly name: string;
  readonly measure: HydrologyMeasure;
  readonly RLOIid: number;
}

function HydrologyStationMeasureData({
  name,
  measure,
  RLOIid,
}: HydrologyStationMeasureDataProps) {
  const {
    data: latestReading,
    isLoading,
    isError,
  } = useLatestHydrologyReading(measure["@id"]);
  const param = useMemo(() => {
    switch (measure.parameter) {
      case "rainfall":
        return "rainfall";
      case "flow":
        return "river flow";
      case "level":
        if (measure["@id"].includes("gw")) {
          return "groundwater";
        } else if (measure["@id"].includes("gw-dipped")) {
          return "groundwater-dipped";
        } else {
          return "river level";
        }
      default:
        return "";
    }
  }, [measure]);

  if (isLoading) {
    return (
      <div>
        Loading {measure.parameter} data for {name}
      </div>
    );
  }
  if (isError) {
    return (
      <div>
        Error loading latest {measure.parameter} reading for {name}
      </div>
    );
  }

  const endDate = new Date(latestReading.dateTime);
  const startDate = subtractDays(endDate, 5);

  return (
    <div className={styles.hydrologyStationMeasureData}>
      <RiverLevelChart
        uri={measure["@id"]}
        name={name}
        parameter={measure.parameter}
        param={param}
        startDate={startDate}
        endDate={endDate}
      />
      <SummaryInfo
        name={name}
        parameter={measure.parameter}
        param={param}
        latestValue={latestReading.value}
        RLOIid={RLOIid}
      />
    </div>
  );
}
