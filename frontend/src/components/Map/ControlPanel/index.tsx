import classNames from "classnames";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "react-tabs/style/react-tabs.css";

import { Suspense } from "react";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import styles from "./style.module.css";
import { useTools } from "@/tools/useTools";

export interface ControlPanelProps {
  /** Additional class name to attach to the top-level element */
  className?: string;
  /** Action to close the control panel */
  onClose?: () => void;
}

/** Main control panel, for controlling layers and simulation */
export default function ControlPanel({
  className,
  onClose,
}: ControlPanelProps) {
  const tools = useTools();

  const entries = tools("control-panel-order")
    .map((tool) => {
      if (!tool.controlPanelTab) {
        return null;
      }
      return {
        name: tool.controlPanelTab.title,
        icon: tool.controlPanelTab.icon,
        Content: tool.ControlPanelContent!,
      };
    })
    .filter((item) => item !== null);

  return (
    <Tabs
      className={classNames(
        styles.controlPanel,
        "relative",
        "menu",
        "menu-lg",
        className,
      )}
    >
      <TabList>
        {entries.map((entry) => (
          <Tab key={entry.name}>
            {entry.icon && (
              <FontAwesomeIcon className="inline mr-2" icon={entry.icon} />
            )}
            {entry.name}
          </Tab>
        ))}
      </TabList>

      {entries.map((entry) => (
        <TabPanel key={entry.name}>
          <Suspense fallback="Loading...">
            <entry.Content />
          </Suspense>
        </TabPanel>
      ))}

      {onClose && <ControlPanelCloseButton onClose={onClose} />}
    </Tabs>
  );
}

interface ControlPanelCloseButtonProps {
  onClose: () => void;
}

function ControlPanelCloseButton({ onClose }: ControlPanelCloseButtonProps) {
  return (
    <button
      onClick={onClose}
      title="Close control panel"
      className={styles.controlPanelCloseButton}
    >
      <FontAwesomeIcon icon={faClose} />
    </button>
  );
}
