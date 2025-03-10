import { useContext } from "react";

import Button from "@mui/material/Button";
import styles from "./infopanel.module.css";
import SelectedElements from "./SelectedElements/SelectedElements";
import { ElementsContext } from "@/context/ElementContext";

interface InfoPanelProps {
  showDependantPanel?: () => void;
}
export default function InfoPanel({ showDependantPanel }: InfoPanelProps) {
  const { selectedElements } = useContext(ElementsContext);

  return (
    <div className={`${styles.infoPanelContainer} overflow-y-auto`}>
      <Button onClick={showDependantPanel}>Show connected assets</Button>
      <SelectedElements selectedElements={selectedElements} />
    </div>
  );
}
