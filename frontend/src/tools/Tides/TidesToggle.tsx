import { faWaveSquare } from "@fortawesome/free-solid-svg-icons";
import useLayer from "@/hooks/useLayer";
import ToolbarButton from "@/components/ToolbarButton";
import featureFlags from "@/config/feature-flags";

export default function Monitoring() {
  const { enabled, toggle } = useLayer("tides");

  if (featureFlags.uiNext) {
    return null;
  }

  return (
    <ToolbarButton
      icon={faWaveSquare}
      title="Tides"
      onClick={toggle}
      active={enabled}
    />
  );
}
