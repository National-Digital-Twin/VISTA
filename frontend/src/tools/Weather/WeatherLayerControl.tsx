import { faCloudSun } from "@fortawesome/free-solid-svg-icons";
import type { LayerControlProps } from "../Tool";
import SimpleLayerControl from "@/components/SimpleLayerControl";

export default function WeatherLayerControl({
  searchQuery,
}: LayerControlProps) {
  return (
    <SimpleLayerControl
      layerName="weather"
      icon={faCloudSun}
      title="Live weather"
      searchQuery={searchQuery}
    />
  );
}
