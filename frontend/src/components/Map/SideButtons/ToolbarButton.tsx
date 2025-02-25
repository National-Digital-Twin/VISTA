import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { IconProp } from "@fortawesome/fontawesome-svg-core";
import Tooltip from "@mui/material/Tooltip";
import { IconButton } from "@mui/material";
import Badge from "@mui/material/Badge";

export interface ToolbarButtonProps {
  /** The title shown on hover for the button */
  readonly title: string;
  /** The FontAwesome icon to be shown (preferred) */
  readonly icon?: IconProp;
  /** The SVG source to be shown */
  readonly svgSrc?: string;
  /** Action on click */
  readonly onClick: () => void;
  /** Number to be shown as a badge (optional) */
  readonly badgeContent?: number;
}

export default function ToolbarButton({
  title,
  icon,
  svgSrc,
  onClick,
  badgeContent,
}: ToolbarButtonProps) {
  return (
    <Tooltip title={title}>
      <IconButton
        aria-label={title}
        onClick={onClick}
        sx={{
          backgroundColor: "white",
          color: "black",
          borderRadius: "2px",
          boxShadow: "0px 4px 8px 0px rgba(0,0,0,0.2)",
          fontSize: "2.0rem",
          padding: "0.5rem",
          width: "3.5rem",
          height: "3.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          "&:hover": {
            backgroundColor: "#f0f0f0",
          },
        }}
      >
        <Badge badgeContent={badgeContent} color="error">
          {svgSrc ? (
            <img
              src={svgSrc}
              alt={title}
              style={{ width: "100%", height: "100%" }}
            />
          ) : (
            icon && <FontAwesomeIcon icon={icon} />
          )}
        </Badge>
      </IconButton>
    </Tooltip>
  );
}
