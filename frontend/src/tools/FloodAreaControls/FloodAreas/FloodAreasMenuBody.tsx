import { useContext, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useSharedStore from '@/hooks/useSharedStore';
import { ElementsContext } from '@/context/ElementContext';
import { useFloodAreaPolygons } from '@/hooks';
import useFloodWatchAreas from '@/hooks/queries/flood-areas/useFloodWatchAreas';
import MenuItemRow from '@/components/MenuItemRow';

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
    /** Function to update the selected count */
    readonly updateSelectedCount?: (isSelected: boolean) => void;
}

export default function FloodAreasMenuBody({ searchQuery = '', updateSelectedCount }: FloodAreasMenuBodyProps) {
    const { isError: isErrorFloodAreas, data: floodAreaNodes } = useFloodWatchAreas();

    const { selected, showLiveFloods, toggleShowLiveFloods, setSelected } = useFloodAreaSharedStore();

    const floodPolygonUris = floodAreaNodes ? floodAreaNodes.map((node) => node.value) : [];
    const { polygonFeatures, isLoading } = useFloodAreaPolygons(floodPolygonUris);
    const { setClickedFloodAreas } = useContext(ElementsContext);

    useEffect(() => {
        if (isLoading || !polygonFeatures) {
            return;
        }
        setClickedFloodAreas(Object.fromEntries(selected.map((polygonUri) => [polygonUri, polygonFeatures[polygonUri][0]])));
    }, [selected, isLoading, polygonFeatures, setClickedFloodAreas]);

    const onCheck = (value: string) => {
        const isSelected = !selected.includes(value);
        const updatedSelectedAreas = isSelected ? [...selected, value] : selected.filter((area) => area !== value);

        setSelected(updatedSelectedAreas);

        if (updateSelectedCount) {
            updateSelectedCount(updatedSelectedAreas.length > 0); // Notify parent about the new state
        }
    };

    if (isErrorFloodAreas || !floodAreaNodes) {
        return null;
    }

    return (
        <>
            <MenuItemRow
                primaryText="Live Floods"
                checked={showLiveFloods}
                onChange={() => {
                    toggleShowLiveFloods();
                    if (updateSelectedCount) {
                        updateSelectedCount(!showLiveFloods); // Notify parent about the new state
                    }
                }}
                searchQuery={searchQuery}
                terms={['Live Floods']}
            />
            {floodAreaNodes.map((node) => (
                <MenuItemRow
                    primaryText={node.label}
                    searchQuery={searchQuery}
                    terms={[node.label]}
                    key={node.value}
                    checked={selected.includes(node.value)}
                    onChange={() => {
                        onCheck(node.value); // Call the updated onCheck function
                    }}
                />
            ))}
        </>
    );
}
