import { useContext, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faPencilAlt } from "@fortawesome/free-solid-svg-icons";
import { useShallow } from "zustand/react/shallow";
import type { Feature } from "geojson";
import { Box, IconButton, ListItemText, TextField } from "@mui/material";
import useSharedStore from "@/hooks/useSharedStore";
import { ElementsContext } from "@/context/ElementContext";
import { useFloodAreaPolygons } from "@/hooks";
import { useDrawingMode } from "@/context/DrawingMode";
import useFloodWatchAreas from "@/hooks/queries/flood-areas/useFloodWatchAreas";
import MenuItemRow from "@/components/MenuItemRow";

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
  readonly searchQuery?: string;
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
      <MenuItemRow
        primaryText="Draw Polygon"
        checked={false}
        searchQuery={searchQuery}
        terms={["Draw Polygon"]}
        buttons={[
          {
            iconSvg: (
              <svg
                width="29"
                height="28"
                viewBox="0 0 29 28"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <circle
                  cx="14"
                  cy="4"
                  r="3.25"
                  stroke="#0E142B"
                  strokeWidth="1.5"
                />
                <circle
                  cx="25"
                  cy="7"
                  r="3.25"
                  stroke="#0E142B"
                  strokeWidth="1.5"
                />
                <circle
                  cx="19"
                  cy="24"
                  r="3.25"
                  stroke="#0E142B"
                  strokeWidth="1.5"
                />
                <circle
                  cx="4"
                  cy="13"
                  r="3.25"
                  stroke="#0E142B"
                  strokeWidth="1.5"
                />
                <path
                  d="M6.5 11L11.5 6M17 5.5H22M24 10L20 20.5M6.5 15L16.5 22"
                  stroke="#0E142B"
                  strokeWidth="1.5"
                />
              </svg>
            ),
            name: "Draw Polygon",
            onClick: handleDrawPolygon,
          },
        ]}
      />
      <MenuItemRow
        primaryText="Live Floods"
        checked={showLiveFloods}
        onChange={toggleShowLiveFloods}
        searchQuery={searchQuery}
        terms={["Live Floods"]}
      />
      {features.map((feature, index) => (
        <MenuItemRow
          key={feature.id}
          primaryText=""
          searchQuery={searchQuery}
          terms={[editedPolygonName, feature.properties.name, "flood"]}
          checked={selectedFeatureIds[feature.id]}
          onChange={(event) => {
            event.stopPropagation();
            toggleFeature(feature.id);
          }}
        >
          <Box sx={{ display: "flex", alignItems: "left", flexGrow: 1 }}>
            {editingPolygonId === feature.id ? (
              <TextField
                type="text"
                value={editedPolygonName}
                onChange={(e) => setEditedPolygonName(e.target.value)}
                onBlur={() => handleSavePolygonName(feature.id)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSavePolygonName(feature.id);
                  }
                }}
              />
            ) : (
              <>
                <Box>
                  <ListItemText
                    primary={feature.properties.name || ` area ${index + 1}`}
                  />
                </Box>
                <IconButton
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleEditPolygonName(feature.id);
                  }}
                >
                  <FontAwesomeIcon icon={faPencilAlt} />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteFeature(feature.id);
                  }}
                >
                  <FontAwesomeIcon icon={faTrash} />
                </IconButton>
              </>
            )}
          </Box>
        </MenuItemRow>
      ))}
      {floodAreaNodes.map((node) => (
        <MenuItemRow
          primaryText={node.label}
          searchQuery={searchQuery}
          terms={[node.label]}
          key={node.value}
          checked={selected.includes(node.value)}
          onChange={() => onCheck(node.value)}
        />
      ))}
    </>
  );
}
