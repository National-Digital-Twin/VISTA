import { useContext } from "react";

import Button from "@mui/material/Button";
import styles from "./infopanel.module.css";
import SelectedElements from "./SelectedElements/SelectedElements";
import { ElementsContext } from "@/context/ElementContext";

interface InfoPanelProps {
  showConnectedAssets: () => void;
  setConnectedAssetData: (data: any) => void;
}
export default function InfoPanel({
  showConnectedAssets,
  setConnectedAssetData,
}: InfoPanelProps) {
  const { selectedElements } = useContext(ElementsContext);

  return (
    <div className={`${styles.infoPanelContainer} overflow-y-auto`}>
      <SelectedElements
        selectedElements={selectedElements}
        showConnectedAssets={showConnectedAssets}
        setConnectedAssetData={setConnectedAssetData}
      />
    </div>
  );
}
