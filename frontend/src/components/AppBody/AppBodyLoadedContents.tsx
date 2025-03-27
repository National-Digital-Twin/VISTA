import { ElementsProvider } from "../../context/ElementContext";
import ParalogMap from "../Map/ParalogMap";

export default function AppBodyLoadedContents() {
  return (
    <ElementsProvider>
      <ParalogMap />
    </ElementsProvider>
  );
}
