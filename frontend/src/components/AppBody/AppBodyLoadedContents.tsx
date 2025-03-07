import { ElementsProvider } from "@/context/ElementContext";
import ParalogMap from "@/components/Map/ParalogMap";

export default function AppBodyLoadedContents() {
  return (
    <ElementsProvider>
      <ParalogMap />
    </ElementsProvider>
  );
}
