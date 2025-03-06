import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import type { IconProp, SizeProp } from "@fortawesome/fontawesome-svg-core";
import Tooltip from "@mui/material/Tooltip";
import { IconButton } from "@mui/material";
import Badge from "@mui/material/Badge";

export interface ToolbarButtonProps {
  /** The title shown on hover for the button */
  readonly title: string;
  readonly width?: number;
  readonly height?: number;

  /** The FontAwesome icon to be shown (preferred) */
  readonly icon?: IconProp;
  /** The FontAwesome icon size to be shown (preferred) */
  readonly iconSize?: SizeProp;

  /** The SVG source to be shown */
  readonly svgSrc?: string;
  /** Action on click */
  readonly onClick: () => void;
  /** Number to be shown as a badge (optional) */
  readonly badgeContent?: number;
}

export default function ToolbarButton({
  title,
  width = 60,
  height = width,
  icon,
  svgSrc,
  onClick,
  badgeContent,
  iconSize,
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
          padding: 1,
          width: width,
          height: height,
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
            icon && <FontAwesomeIcon icon={icon} size={iconSize || "1x"} />
          )}
        </Badge>
      </IconButton>
    </Tooltip>
  );
}
