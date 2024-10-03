export interface PointerCoordinatesProps {
  /** Whether the coördinates should be shown */
  show: boolean;

  /** Decimal latitude */
  lat: number;
  /** Decimal longitude */
  lng: number;
}

export default function PointerCoordinates({
  show,
  lat,
  lng,
}: PointerCoordinatesProps) {
  if (!show || (!lat && !lng)) {
    return null;
  }
  return (
    <div className="flex items-center gap-x-2">
      <div className="uppercase border w-fit px-2">lat, lng</div>
      <p className="text-xs">
        {lat}, {lng}
      </p>
    </div>
  );
}
