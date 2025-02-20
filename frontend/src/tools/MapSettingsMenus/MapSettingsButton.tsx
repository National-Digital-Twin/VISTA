import { faGear } from "@fortawesome/free-solid-svg-icons";
import { useRef } from "react";
import { useBoolean, useDarkMode, useOnClickOutside } from "usehooks-ts";
import ToolbarButton from "@/components/Map/SideButtons/ToolbarButton";
import {
  useShowPointerCoords,
  useTogglePointerCoords,
} from "@/context/ShowPointerCoords";
import useSharedStore from "@/hooks/useSharedStore";
import { resetHashStorage } from "@/hooks/createStore";

interface ToggleSwitchControlMenuItem {
  name: string;
  selected: boolean;
  onItemClick: () => void;
}

interface ButtonControlMenuItem {
  readonly name: string;
  readonly onItemClick: () => void;
}

type ControlMenuItem = ToggleSwitchControlMenuItem | ButtonControlMenuItem;

export default function MapSettingsButton() {
  const ref = useRef<HTMLDivElement>();

  const {
    value: showSettingsMenu,
    toggle: toggleSettingsMenu,
    setFalse: hideSettingsMenu,
  } = useBoolean(false);

  useOnClickOutside(ref, hideSettingsMenu);

  const {
    isDarkMode,
    enable: enableDarkMode,
    disable: disableDarkMode,
  } = useDarkMode();

  const showPointerCoords = useShowPointerCoords();
  const togglePointerCoords = useTogglePointerCoords();

  const { showCpsIconsForAssetTypes, toggleShowCpsIconsForAssetTypes } =
    useSharedStore();

  const mapTools: ControlMenuItem[] = [
    {
      name: "Coordinates",
      selected: showPointerCoords,
      type: "toggleSwitch",
      onItemClick: togglePointerCoords,
    },
    {
      name: showCpsIconsForAssetTypes ? "Hide CPS icons" : "Show CPS icons",
      selected: showCpsIconsForAssetTypes,
      type: "toggleSwitch",
      onItemClick: toggleShowCpsIconsForAssetTypes,
    },
    {
      name: "Reset all layers",
      type: "button",
      onItemClick: () => {
        if (window.confirm("Are you sure you want to reset all layers?")) {
          resetHashStorage();
        }
      },
    },
  ];

  return (
    <div ref={ref} className="relative">
      <ToolbarButton
        title="Settings menu"
        onClick={toggleSettingsMenu}
        icon={faGear}
      />
      {showSettingsMenu && (
        <div className="absolute right-12 bottom-0 menu">
          <button
            className="menu-item"
            data-selected={isDarkMode}
            onClick={enableDarkMode}
          >
            Dark Mode
          </button>
          <button
            className="menu-item"
            data-selected={!isDarkMode}
            onClick={disableDarkMode}
          >
            Light Mode
          </button>
          {mapTools.map((tool) => {
            switch (tool.type) {
              case "toggleSwitch":
                return <ToggleSwitchControl key={tool.name} {...tool} />;
              case "button":
                return (
                  <ButtonControl
                    key={tool.name}
                    {...tool}
                    onItemClick={() => {
                      tool.onItemClick();
                      hideSettingsMenu();
                    }}
                  />
                );
              default:
                console.error(`Unhandled mapTool type:`, tool);
                return null;
            }
          })}
        </div>
      )}
    </div>
  );
}

type ToggleSwitchControlProps = ToggleSwitchControlMenuItem;

function ToggleSwitchControl({
  name,
  onItemClick,
  selected,
}: Readonly<ToggleSwitchControlProps>) {
  return (
    <button
      className="menu-item"
      data-selected={selected}
      onClick={onItemClick}
    >
      {name}
    </button>
  );
}

type ButtonControlProps = ButtonControlMenuItem;

function ButtonControl({ name, onItemClick }: ButtonControlProps) {
  return (
    <button className="menu-item" onClick={onItemClick}>
      {name}
    </button>
  );
}
