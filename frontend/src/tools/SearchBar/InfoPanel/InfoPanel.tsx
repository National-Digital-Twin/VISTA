import { useContext } from "react";

import styles from "./infopanel.module.css";
import SelectedElements from "./SelectedElements/SelectedElements";
import { ElementsContext } from "@/context/ElementContext";

export default function InfoPanel() {
  const { selectedElements } = useContext(ElementsContext);

  return (
    <div className={`${styles.infoPanelContainer} overflow-y-auto`}>
      <SelectedElements selectedElements={selectedElements} />
    </div>
  );
}
