import { memo } from "react";
import classNames from "classnames";

import { useTools } from "@/tools/useTools";

export interface MapToolbarProps {
  /** Additional classes to add to the top-level element */
  readonly className?: string;
}

function ToolSideButtons() {
  const tools = useTools();
  const toolSideButtons = tools("side-button-order").map((tool) => {
    if (!tool.SideButtons) {
      return null;
    }
    const SideButtons = tool.SideButtons;
    return <SideButtons key={tool.TOOL_NAME} />;
  });

  return <>{toolSideButtons}</>;
}

const MToolSideButtons = memo(ToolSideButtons);

export default function MapToolbar({ className }: MapToolbarProps) {
  return (
    <div
      className={classNames(
        "font-body flex flex-col items-end space-y-2",
        className,
      )}
    >
      <MToolSideButtons />
    </div>
  );
}
