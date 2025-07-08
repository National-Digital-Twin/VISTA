import { faCloudSun } from "@fortawesome/free-solid-svg-icons";
import ToolbarButton from "@/components/ToolbarButton";
import featureFlags from "@/config/feature-flags";
import useLayer from "@/hooks/useLayer";

export default function WeatherToggle() {
  const { enabled, toggle } = useLayer("weather");

  if (featureFlags.uiNext) {
    return null;
  }

  return (
    <ToolbarButton
      icon={faCloudSun}
      title="Weather Stations"
      onClick={toggle}
      active={enabled}
    />
  );
}
