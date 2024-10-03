import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { IconProp } from "@fortawesome/fontawesome-svg-core";

export interface ToolbarButtonProps {
  /** The title shown on hover for the button */
  title: string;
  /** The FontAwesome icon to be shown (preferred) */
  icon: IconProp;
  /** Action on click */
  onClick: () => void;
}

export default function ToolbarButton({
  title,
  icon,
  onClick,
}: ToolbarButtonProps) {
  return (
    <button
      title={title}
      aria-label={title}
      className="bg-button text-white text-lg rounded-full p-2 flex items-center justify-center w-10 h-10"
      onClick={onClick}
    >
      <FontAwesomeIcon icon={icon} />
    </button>
  );
}
