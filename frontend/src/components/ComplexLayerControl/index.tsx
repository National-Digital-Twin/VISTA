import type { ReactNode } from "react";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { useBoolean } from "usehooks-ts";
import { Divider, IconButton, Typography } from "@mui/material";
import Box from "@mui/system/Box";

export interface ComplexLayerControlProps {
  /** Icon for the layer */
  readonly icon?: IconProp;
  /** Title of the layer */
  readonly title: string;
  /** Children */
  readonly children: ReactNode;
  /** Automatic show and hide for search */
  readonly autoShowHide?: boolean;
}

export default function ComplexLayerControl({
  icon,
  title,
  children,
  autoShowHide = false,
}: ComplexLayerControlProps) {
  const { value: expanded, toggle } = useBoolean(false);

  return (
    <Box
      sx={{
        borderBottom: 1,
        borderColor: "#e0e0e0",
        overflow: "hidden",
        width: "100%",
      }}
      data-expanded={expanded}
      data-auto-show-hide={autoShowHide}
    >
      <Box
        onClick={toggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            toggle();
          }
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
        }}
        tabIndex={0}
      >
        {icon && <FontAwesomeIcon icon={icon} style={{ marginRight: 8 }} />}
        <Typography variant="body1" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <IconButton size="small">
          <FontAwesomeIcon icon={expanded ? faChevronUp : faChevronDown} />
        </IconButton>
      </Box>
      <Divider />
      <Box
        sx={{
          display: expanded ? "block" : "none",
        }}
        aria-expanded={expanded}
      >
        <div style={{ borderLeft: "5px solid #e0e0e0", padding: "8px" }}>
          {children}
        </div>
      </Box>
    </Box>
  );
}
