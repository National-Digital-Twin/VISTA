import { useMemo } from "react";

import InfoHeader, { InfoTitle } from "../InfoHeader";
import ElementDetails from "./ElementDetails";
import type { Element } from "@/models";

export interface SelectedElementsProps {
  /** Elements which are selected */
  selectedElements: Element[];
}

export default function SelectedElements({
  selectedElements,
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
  selectedElements: Element[];
  totalSelected: number;
}

function ElementsList({ selectedElements, totalSelected }: ElementsListProps) {
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
          />
        ))}
      </ul>
    </>
  );
}
