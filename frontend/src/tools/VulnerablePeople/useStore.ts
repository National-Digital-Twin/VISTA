import { VulnerablePeopleItem } from "@/api/paralog-python";
import createStore from "@/hooks/createStore";

export interface VulnerablePeopleState {
  selectedVulnerablePeopleItem: VulnerablePeopleItem | null;

  setSelectedVulnerablePeopleItem: (
    vulnerablePeopleItem: VulnerablePeopleItem | null,
  ) => void;
}

export default createStore<VulnerablePeopleState>(
  "vulnerable-people",
  (set) => ({
    selectedVulnerablePeopleItem: null,
    setSelectedVulnerablePeopleItem(vulnerablePeopleItem) {
      set({ selectedVulnerablePeopleItem: vulnerablePeopleItem });
    },
  }),
);
