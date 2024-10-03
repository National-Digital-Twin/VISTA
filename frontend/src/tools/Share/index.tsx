import { faShare } from "@fortawesome/free-solid-svg-icons";
import ToolbarButton from "@/components/Map/SideButtons/ToolbarButton";

export const TOOL_NAME = "Share button";

function handleShare() {
  navigator.clipboard
    .writeText(window.location.href)
    .then(() => {
      // TODO: Toast
      console.log("URL copied to clipboard successfully!");
    })
    .catch((err) => {
      console.error("Failed to copy URL to clipboard", err);
    });
}

export function SideButtons() {
  return <ToolbarButton title="Share" onClick={handleShare} icon={faShare} />;
}
