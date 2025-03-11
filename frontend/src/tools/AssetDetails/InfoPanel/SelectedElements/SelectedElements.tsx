import { useMemo } from "react";

import InfoHeader, { InfoTitle } from "../InfoHeader";
import ElementDetails from "./ElementDetails";
import type { Element } from "@/models";

export interface SelectedElementsProps {
  /** Elements which are selected */
  readonly selectedElements: Element[];
  readonly showConnectedAssets: () => void;
  readonly setConnectedAssetData: (data: any) => void;
}

export default function SelectedElements({
  selectedElements,
  showConnectedAssets,
  setConnectedAssetData,
}: SelectedElementsProps) {
  const totalSelected = useMemo(
    () => selectedElements?.length || 0,
    [selectedElements],
  );

  if (!Array.isArray(selectedElements)) {
    return null;
  }

  if (totalSelected > 0) {
    return (
      <ElementsList
        selectedElements={selectedElements}
        totalSelected={totalSelected}
        showConnectedAssets={showConnectedAssets}
        setConnectedAssetData={setConnectedAssetData}
      />
    );
  }

  return (
    <InfoHeader className="justify-between">
      <InfoTitle>Click on an asset or connection to view details</InfoTitle>
    </InfoHeader>
  );
}

interface ElementsListProps {
  readonly selectedElements: Element[];
  readonly totalSelected: number;
  readonly showConnectedAssets: () => void;
  readonly setConnectedAssetData: (data: any) => void;
}

function ElementsList({
  selectedElements,
  totalSelected,
  showConnectedAssets,
  setConnectedAssetData,
}: ElementsListProps) {
  return (
    <>
      <InfoHeader className="justify-between">
        {totalSelected} selected
      </InfoHeader>
      <ul className="flex flex-col gap-y-3 grow min-h-0 overflow-y-auto">
        {selectedElements.map((selectedElement) => (
          <ElementDetails
            key={selectedElement.id}
            element={selectedElement}
            expand={false}
            showConnectedAssets={showConnectedAssets}
            setConnectedAssetData={setConnectedAssetData}
          />
        ))}
      </ul>
    </>
  );
}
