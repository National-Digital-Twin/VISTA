import React from "react";
import { ListItem, ListItemText, Box, IconButton } from "@mui/material";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import MaterialUISwitch from "../Switch";
import SearchConditional from "../SearchConditional";

interface ButtonConfig {
  icon: IconProp;
  name: string;
  onClick: (
    event: React.MouseEvent<HTMLButtonElement | HTMLDivElement>,
  ) => void;
}

interface MenuItemRowProps {
  terms: string[];
  primaryText: string;
  checked: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  searchQuery: string;
  children?: React.ReactNode;
  buttons?: ButtonConfig[];
}

const MenuItemRow = ({
  terms,
  primaryText,
  checked,
  onChange,
  searchQuery,
  children,
  buttons,
}: MenuItemRowProps) => {
  return (
    <SearchConditional searchQuery={searchQuery} terms={terms}>
      <ListItem
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e0e0e0",
          padding: 0,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "left", flexGrow: 1 }}>
          {children || (
            <>
              <Box
                onClick={
                  buttons && buttons.length === 1
                    ? (event) => {
                        event.stopPropagation();
                        buttons[0].onClick(event);
                      }
                    : undefined
                }
              >
                <ListItemText primary={primaryText} />
              </Box>
              {buttons?.map((button) => (
                <IconButton
                  key={button.name}
                  size="small"
                  onClick={(event) => {
                    event.stopPropagation();
                    button.onClick(event);
                  }}
                  aria-label={button.name}
                >
                  <FontAwesomeIcon icon={button.icon} />
                </IconButton>
              ))}
            </>
          )}
        </Box>
        {onChange && (
          <MaterialUISwitch
            checked={checked}
            onChange={onChange}
            inputProps={{ "aria-label": "controlled" }}
          />
        )}
      </ListItem>
    </SearchConditional>
  );
};

export default MenuItemRow;
