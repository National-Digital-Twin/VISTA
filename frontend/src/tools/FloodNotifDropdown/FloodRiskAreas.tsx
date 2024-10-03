import styles from "./style.module.css";

interface FloodRiskAreasProps {
  atRiskAreas: any[];
}

export default function FloodRiskAreas({ atRiskAreas }: FloodRiskAreasProps) {
  if (!atRiskAreas.length) {
    return <p>No current flood warnings</p>;
  }

  return (
    <div>
      <h1 className="mt-0 text-base mb-2 text-fg">Flood Risk Areas</h1>
      {atRiskAreas.map((area) => {
        const {
          name,
          value: currentLevel,
          trend,
          percentile_5,
          percentile_95,
          river,
          value_date,
          direction,
          river_name,
        } = area.properties;

        return (
          <div key={area.id} className={styles.warningAlert}>
            <h2 className="text-fg mt-0 mb-2">{name || "Unnamed Area"}</h2>
            <p className="text-fg-secondary my-1">
              River: {river || river_name || "Unknown"}
            </p>
            <p className="text-fg-secondary my-1">
              Current Level:{" "}
              {currentLevel !== null ? currentLevel.toFixed(2) : "Unknown"}
            </p>
            <p className="text-fg-secondary my-1">
              Trend: {trend || "Unknown"} (
              {direction === "u" ? "Upstream" : "Downstream"})
            </p>
            <p className="text-fg-secondary my-1">
              Last Updated:{" "}
              {value_date ? new Date(value_date).toLocaleString() : "Unknown"}
            </p>
            {percentile_5 !== null && percentile_95 !== null && (
              <p className="text-fg-secondary my-1">
                Normal Range: {percentile_95.toFixed(2)} -{" "}
                {percentile_5.toFixed(2)} m
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
