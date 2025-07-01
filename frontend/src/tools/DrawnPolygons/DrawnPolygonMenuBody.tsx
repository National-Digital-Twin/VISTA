import { useContext, useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import type { Feature } from "geojson";
import {
  Box,
  IconButton,
  ListItemText,
  SvgIcon,
  TextField,
} from "@mui/material";
import useSharedStore from "@/hooks/useSharedStore";
import { ElementsContext } from "@/context/ElementContext";
import { useFloodAreaPolygons } from "@/hooks";
import useFloodWatchAreas from "@/hooks/queries/flood-areas/useFloodWatchAreas";
import MenuItemRow from "@/components/MenuItemRow";

const useFloodAreaSharedStore = () =>
  useSharedStore(
    useShallow((state) => ({
      features: state.floodAreaFeatures,
      selectedFeatureIds: state.selectedFloodAreaFeatureIds,
      selected: state.selectedFloodAreas,
      toggleFeature: state.toggleFloodAreaFeature,
      setFeatures: state.setFloodAreaFeatures,
      onAddFeatures: state.addFloodAreaFeatures,
      onUpdateFeatures: state.updateFloodAreaFeatures,
      onDeleteFeatures: state.deleteFloodAreaFeatures,
    })),
  );

export interface DrawnPolygonMenuBodyProps {
  /** Search query */
  readonly searchQuery?: string;
  /** Function to update the selected count */
  readonly updateSelectedCount?: (isSelected: boolean) => void;
}

export default function DrawnPolygonMenuBody({
  searchQuery = "",
  updateSelectedCount,
}: DrawnPolygonMenuBodyProps) {
  const { isError: isErrorFloodAreas, data: floodAreaNodes } =
    useFloodWatchAreas();

  const {
    setFeatures,
    toggleFeature,
    features,
    selectedFeatureIds,
    selected,
    ...drawingModeCallbacks
  } = useFloodAreaSharedStore();

  const floodPolygonUris = floodAreaNodes
    ? floodAreaNodes.map((node) => node.value)
    : [];
  const { polygonFeatures, isLoading } = useFloodAreaPolygons(floodPolygonUris);

  const elementsContext = useContext(ElementsContext);
  if (!elementsContext) {
    throw new Error("Component must be used within ElementsProvider");
  }
  const { setClickedFloodAreas } = elementsContext;

  const [editingPolygonId, setEditingPolygonId] = useState<string | null>(null);
  const [editedPolygonName, setEditedPolygonName] = useState("");

  const handleEditPolygonName = (featureId: string) => {
    const feature = features.find((feature) => feature.id === featureId);
    if (!feature) {
      throw new Error(`Feature with id ${featureId} not found`);
    }

    setEditingPolygonId(featureId);
    setEditedPolygonName(feature.properties?.name ?? "");
  };

  const handleSavePolygonName = (featureId: string) => {
    const feature = features.find((feature) => feature.id === featureId);
    if (!feature) {
      throw new Error(`Feature with id ${featureId} not found`);
    }

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
      {features.map((feature, index) => {
        if (!feature.id) {
          return null;
        }

        const featureId = feature.id as string;
        return (
          <MenuItemRow
            key={feature.id}
            primaryText=""
            searchQuery={searchQuery}
            terms={[editedPolygonName, feature.properties?.name, "flood"]}
            checked={selectedFeatureIds[feature.id]}
            onChange={(event) => {
              event.stopPropagation();
              toggleFeature(featureId);
              if (updateSelectedCount) {
                updateSelectedCount(!selectedFeatureIds[featureId]); // Notify parent about the new state
              }
            }}
          >
            <Box sx={{ display: "flex", alignItems: "left", flexGrow: 1 }}>
              {editingPolygonId === feature.id ? (
                <TextField
                  type="text"
                  value={editedPolygonName}
                  onChange={(e) => setEditedPolygonName(e.target.value)}
                  onBlur={() => handleSavePolygonName(featureId)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSavePolygonName(featureId);
                    }
                  }}
                />
              ) : (
                <>
                  <Box>
                    <ListItemText
                      primary={feature.properties?.name ?? ` area ${index + 1}`}
                    />
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleEditPolygonName(featureId);
                    }}
                  >
                    <SvgIcon>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="#000000"
                      >
                        <path d="M200-400v-40h280v40H200Zm0-160v-40h440v40H200Zm0-160v-40h440v40H200Zm329.23 520v-88.38l213.31-212.31q5.92-5.93 12.22-8 6.3-2.08 12.6-2.08 6.87 0 13.5 2.58 6.64 2.57 12.06 7.73l37 37.77q4.93 5.92 7.5 12.31Q840-444 840-437.62q0 6.39-2.46 12.89-2.46 6.5-7.62 12.42L617.62-200h-88.39Zm275.39-237.62-37-37.76 37 37.76Zm-240 202.24h38l138.69-138.93-18.77-19-18.23-19.54-139.69 139.47v38Zm157.92-157.93-18.23-19.54 37 38.54-18.77-19Z" />
                      </svg>
                    </SvgIcon>
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleDeleteFeature(featureId);
                    }}
                  >
                    <SvgIcon>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        height="24px"
                        viewBox="0 -960 960 960"
                        width="24px"
                        fill="#000000"
                      >
                        <path d="M304.62-160q-26.85 0-45.74-18.88Q240-197.77 240-224.62V-720h-40v-40h160v-30.77h240V-760h160v40h-40v495.38q0 27.62-18.5 46.12Q683-160 655.38-160H304.62ZM680-720H280v495.38q0 10.77 6.92 17.7 6.93 6.92 17.7 6.92h350.76q9.24 0 16.93-7.69 7.69-7.69 7.69-16.93V-720ZM392.31-280h40v-360h-40v360Zm135.38 0h40v-360h-40v360ZM280-720v520-520Z" />
                      </svg>
                    </SvgIcon>
                  </IconButton>
                </>
              )}
            </Box>
          </MenuItemRow>
        );
      })}
    </>
  );
}
