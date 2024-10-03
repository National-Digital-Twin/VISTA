import { useMemo } from "react";
import styles from "./style.module.css";
import { ElementsProvider } from "@/context/ElementContext";
import ParalogMap from "@/components/Map/ParalogMap";
import { useTools } from "@/tools/useTools";

export default function AppBodyLoadedContents() {
  return (
    <ElementsProvider>
      <ParalogMap />
      <DetailPanels />
    </ElementsProvider>
  );
}

function DetailPanels() {
  const tools = useTools();

  const detailPanels = useMemo(() => {
    const panels: {
      component: () => JSX.Element;
      key: string;
    }[] = [];

    tools("definition-order").forEach((tool) => {
      if (tool.DetailPanel) {
        panels.push({
          component: tool.DetailPanel,
          key: tool.TOOL_NAME,
        });
      }
    });

    return panels;
  }, [tools]);

  return (
    <div className={styles.detailPanels}>
      {detailPanels.map((detailPanel) => {
        const Component = detailPanel.component;
        return <Component key={detailPanel.key} />;
      })}
    </div>
  );
}
