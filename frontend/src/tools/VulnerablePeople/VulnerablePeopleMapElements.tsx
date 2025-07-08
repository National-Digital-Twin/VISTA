import { Marker } from "react-map-gl/maplibre";
import { useEffect } from "react";
import { bbox } from "@turf/turf";
import { useShallow } from "zustand/react/shallow";
import useStore from "./useStore";
import useLayer from "@/hooks/useLayer";
import { useVulnerablePeopleLazyQuery } from "@/api/paralog-python";
import useSharedStore from "@/hooks/useSharedStore";

export default function VulnerablePeopleMapElements() {
  const { enabled } = useLayer("vulnerable-people");

  const [feature] = useSharedStore(
    useShallow((state) => state.vulnerablePeopleFeatures),
  );
  const selected = useStore((state) => state.selectedVulnerablePeopleItem);
  const setSelected = useStore(
    (state) => state.setSelectedVulnerablePeopleItem,
  );

  const [executeVulnerablePeopleQuery, { data }] =
    useVulnerablePeopleLazyQuery();

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!feature) {
      return;
    }

    setSelected(null);

    const [lonMin, latMin, lonMax, latMax] = bbox(feature);

    executeVulnerablePeopleQuery({
      variables: {
        input: {
          latMin,
          latMax,
          lonMin,
          lonMax,
        },
      },
    });
  }, [feature, executeVulnerablePeopleQuery, setSelected, enabled]);

  if (!enabled) {
    return null;
  }

  return feature ? (
    <>
      {data?.vulnerablePeople.map((item) => (
        <Marker
          key={item.mockIndividualIndex}
          longitude={item.longitude}
          latitude={item.latitude}
          onClick={() => {
            setSelected(selected === item ? null : item);
          }}
          style={{
            cursor: "pointer",
            border:
              selected?.mockIndividualIndex === item.mockIndividualIndex
                ? "1px solid yellow"
                : "",
            borderRadius: "10px",
          }}
        />
      ))}
    </>
  ) : null;
}
