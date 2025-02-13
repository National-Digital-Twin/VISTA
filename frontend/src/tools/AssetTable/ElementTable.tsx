import type { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
} from "@fortawesome/free-solid-svg-icons";
import usePaginated from "./usePaginated";
import styles from "./ElementTable.module.css";
import type { Table } from "./format-assets";

export interface ElementTableProps<T extends { id?: string }> {
  /** Table definition */
  readonly table: Table<T>;
  /** Elements being displayed */
  readonly elements: T[];
  /** Number of elements per page */
  readonly elementsPerPage: number;
  /** What to display if there are no elements */
  readonly fallback?: ReactNode;
}

export default function ElementTable<T>({
  table,
  elements,
  elementsPerPage,
  fallback,
}: ElementTableProps<T>) {
  const { page, count, goPrev, goNext, current, hasPrev, hasNext } =
    usePaginated(elements, elementsPerPage);

  if (fallback && elements.length === 0) {
    return fallback;
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              {table.titles().map((title) => (
                <th key={title}>{title}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {current.map((asset) => {
              const assetKey = asset?.id ?? JSON.stringify(asset); // Use a unique ID or fallback to a stringified object
              return (
                <tr key={assetKey}>
                  {table.formatNodes(asset).map((value, idx) => {
                    const valueKey = `${assetKey}-${idx}`; // Ensure uniqueness across columns
                    return (
                      <td key={valueKey} className="truncate max-w-xs">
                        {value}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className={styles.paginationControls}>
        <button onClick={goPrev} disabled={!hasPrev} className="btn">
          <FontAwesomeIcon icon={faChevronLeft} />
        </button>
        <span>
          Page {page} of {count}
        </span>
        <button onClick={goNext} disabled={!hasNext} className="btn">
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      </div>
    </>
  );
}
