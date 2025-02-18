import { useContext, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faTrash,
  faPencilAlt,
} from "@fortawesome/free-solid-svg-icons";
import { useShallow } from "zustand/react/shallow";
import type { Feature } from "geojson";
import useSharedStore from "@/hooks/useSharedStore";
import { ElementsContext } from "@/context/ElementContext";
import { useFloodAreaPolygons } from "@/hooks";
import { useDrawingMode } from "@/context/DrawingMode";
import useFloodWatchAreas from "@/hooks/queries/flood-areas/useFloodWatchAreas";
import SearchConditional from "@/components/SearchConditional";
import { MenuButton } from "@/components/MenuButton";

const useFloodAreaSharedStore = () =>
  useSharedStore(
    useShallow((state) => ({
      features: state.floodAreaFeatures,
      selectedFeatureIds: state.selectedFloodAreaFeatureIds,
      selected: state.selectedFloodAreas,
      setSelected: state.setSelectedFloodAreas,
      toggleFeature: state.toggleFloodAreaFeature,
      setFeatures: state.setFloodAreaFeatures,
      showLiveFloods: state.showLiveFloods,
      toggleShowLiveFloods: state.toggleShowLiveFloods,
      onAddFeatures: state.addFloodAreaFeatures,
      onUpdateFeatures: state.updateFloodAreaFeatures,
      onDeleteFeatures: state.deleteFloodAreaFeatures,
    })),
  );

export interface FloodAreasMenuBodyProps {
  /** Search query */
  searchQuery?: string;
}

export default function FloodAreasMenuBody({
  searchQuery = "",
}: FloodAreasMenuBodyProps) {
  const { isError: isErrorFloodAreas, data: floodAreaNodes } =
    useFloodWatchAreas();

  const {
    setFeatures,
    toggleFeature,
    features,
    selectedFeatureIds,
    selected,
    showLiveFloods,
    toggleShowLiveFloods,
    setSelected,
    ...drawingModeCallbacks
  } = useFloodAreaSharedStore();

  const floodPolygonUris = floodAreaNodes
    ? floodAreaNodes.map((node) => node.value)
    : [];
  const { polygonFeatures, isLoading } = useFloodAreaPolygons(floodPolygonUris);

  const { startDrawing } = useDrawingMode(
    (state) =>
      state.floodAreaFeatures.filter(
        (feature) => state.selectedFloodAreaFeatureIds[feature.id],
      ),
    drawingModeCallbacks,
  );

  const { setClickedFloodAreas } = useContext(ElementsContext);

  const [editingPolygonId, setEditingPolygonId] = useState(null);
  const [editedPolygonName, setEditedPolygonName] = useState("");

  const handleEditPolygonName = (featureId) => {
    const feature = features.find((feature) => feature.id === featureId);
    setEditingPolygonId(featureId);
    setEditedPolygonName(feature.properties.name || "");
  };

  const handleSavePolygonName = (featureId) => {
    const updatedFeatures = features.map((feature) => {
      if (feature.id === featureId) {
        return {
          ...feature,
          properties: {
            ...feature.properties,
            name: editedPolygonName,
          },
        };
      }
      return feature;
    });
    setFeatures(updatedFeatures);
    setEditingPolygonId(null);
    setEditedPolygonName("");
  };

  useEffect(() => {
    if (isLoading || !polygonFeatures) {
      return;
    }
    setClickedFloodAreas(
      Object.fromEntries(
        selected.map((polygonUri) => [
          polygonUri,
          polygonFeatures[polygonUri][0],
        ]),
      ),
    );
  }, [selected, isLoading, polygonFeatures, setClickedFloodAreas]);

  const onCheck = async (value) => {
    const updatedSelectedAreas = selected.includes(value)
      ? selected.filter((area) => area !== value)
      : [...selected, value];
    setSelected(updatedSelectedAreas);
  };

  const handleDrawPolygon = () => {
    startDrawing({ drawingMode: "draw_polygon" });
  };

  const handleDeleteFeature = (featureId: NonNullable<Feature["id"]>) => {
    if (window.confirm("Delete this drawn polygon?")) {
      drawingModeCallbacks.onDeleteFeatures([featureId]);
    }
  };

  if (isErrorFloodAreas || !floodAreaNodes) {
    return null;
  }

  return (
    <>
      <MenuButton
        onClick={handleDrawPolygon}
        selected={false}
        label="Draw Polygon"
        icon={faPlus}
        searchQuery={searchQuery}
      />
      <MenuButton
        onClick={toggleShowLiveFloods}
        selected={showLiveFloods}
        label="Live Floods"
        searchQuery={searchQuery}
      />

      {features.map((feature, index) => (
        <SearchConditional
          key={feature.id}
          searchQuery={searchQuery}
          terms={[editedPolygonName, feature.properties.name, "flood"]}
        >
          <div
            className="menu-item"
            data-selected={selectedFeatureIds[feature.id]}
            onClick={() => toggleFeature(feature.id)}
          >
            {editingPolygonId === feature.id ? (
              <input
                type="text"
                value={editedPolygonName}
                onChange={(e) => setEditedPolygonName(e.target.value)}
                onBlur={() => handleSavePolygonName(feature.id)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSavePolygonName(feature.id);
                  }
                }}
                className="flex-grow bg-black-200 text-white focus:outline-none"
              />
            ) : (
              <>
                <span className="flex-grow">
                  {feature.properties.name || ` area ${index + 1}`}
                </span>
                <button
                  className="ml-2 focus:outline-none hover:text-black-900"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleEditPolygonName(feature.id);
                  }}
                >
                  <FontAwesomeIcon icon={faPencilAlt} />
                </button>
              </>
            )}
            <button
              className="ml-2 focus:outline-none hover:text-black-900"
              onClick={(event) => {
                event.stopPropagation();
                handleDeleteFeature(feature.id);
              }}
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </div>
        </SearchConditional>
      ))}
      {floodAreaNodes.map((node) => (
        <MenuButton
          key={node.value}
          onClick={() => onCheck(node.value)}
          selected={selected.includes(node.value)}
          label={node.label}
          searchQuery={searchQuery}
        />
      ))}
    </>
  );
}
