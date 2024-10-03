import SponsorLogos from "./SponsorLogos";
import styles from "./style.module.css";

export const TOOL_NAME = "Sponsor logos";

export function Overlay() {
  return <SponsorLogos className={styles.logoPosition} />;
}
