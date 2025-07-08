import HydrologyDetails from "./HydrologyDetails";
import useHydroTidesWeatherStore from "@/components/DetailsPanel/useHydroTidesWeatherStore";
import DetailsPanel from "@/components/DetailsPanel/DetailsPanel";

export default function HydrologyDetailsPanel() {
  const { selectedStation, deselectStation } = useHydroTidesWeatherStore();

  const handleClose = () => {
    deselectStation();
  };

  if (!selectedStation || selectedStation.type !== "hydrology") {
    return null;
  }

  return (
    <DetailsPanel isOpen={true} onClose={handleClose}>
      <HydrologyDetails />
    </DetailsPanel>
  );
}
