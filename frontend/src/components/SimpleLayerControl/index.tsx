import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { useMemo } from "react";
import styles from "./style.module.css";
import SearchConditional from "@/components/SearchConditional";
import useLayer from "@/hooks/useLayer";

export interface SimpleLayerControlProps {
  /** Layer being controlled */
  readonly layerName: string;
  /** Icon for the layer */
  readonly icon?: IconProp;
  /** Title of the layer */
  readonly title: string;
  /** Current search query */
  readonly searchQuery: string;
  /** Additional terms to match in search, if any */
  readonly terms?: string[];
}

export default function SimpleLayerControl({
  layerName,
  icon,
  title,
  searchQuery,
  terms,
}: SimpleLayerControlProps) {
  const { enabled, toggle } = useLayer(layerName);

  const fullTerms = useMemo(() => {
    if (terms) {
      return [title, layerName, ...terms];
    } else {
      return [title, layerName];
    }
  }, [title, layerName, terms]);

  return (
    <SearchConditional searchQuery={searchQuery} terms={fullTerms}>
      <div
        onClick={toggle}
        className={styles.simpleLayer}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            toggle();
          }
        }}
      >
        {icon && <FontAwesomeIcon icon={icon} className={styles.icon} />}
        <FontAwesomeIcon
          icon={enabled ? faEye : faEyeSlash}
          className={styles.toggle}
        />
        <h3 className={styles.body}>{title}</h3>
      </div>
    </SearchConditional>
  );
}
