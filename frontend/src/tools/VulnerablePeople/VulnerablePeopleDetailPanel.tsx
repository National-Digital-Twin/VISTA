import { useEffect } from "react";
import { useBoolean } from "usehooks-ts";
import useStore from "./useStore";
import SummaryInfo from "./SummaryInfo";
import DetailsPanel from "@/components/DetailsPanel/DetailsPanel";

export default function VulnerablePeopleDetailPanel() {
  const selected = useStore((state) => state.selectedVulnerablePeopleItem);
  const setSelected = useStore(
    (state) => state.setSelectedVulnerablePeopleItem,
  );

  const {
    value: isOpen,
    setTrue: openPanel,
    setFalse: closePanel,
  } = useBoolean(false);

  useEffect(() => {
    if (selected) {
      openPanel();
    }
  }, [selected, openPanel]);

  const handleClose = () => {
    closePanel();
    setSelected(null);
  };

  if (!selected) {
    return null;
  }

  return (
    <DetailsPanel isOpen={isOpen} onClose={handleClose}>
      <SummaryInfo item={selected} />
    </DetailsPanel>
  );
}
