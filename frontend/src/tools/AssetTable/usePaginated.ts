import { useCallback, useState } from "react";

export default function usePaginated<T>(
  elements: T[],
  elementsPerPage: number,
) {
  const [pageNumber, setPageNumber] = useState(1);

  const numPages = Math.max(Math.ceil(elements.length / elementsPerPage), 1);
  const effectivePageNumber = Math.min(pageNumber, numPages);

  const nextPage = useCallback(() => {
    setPageNumber((number) => Math.min(number + 1, numPages));
  }, [numPages]);
  const prevPage = useCallback(() => {
    setPageNumber((number) => Math.max(number - 1, 1));
  }, []);
  const firstPage = useCallback(() => {
    setPageNumber(1);
  }, []);
  const lastPage = useCallback(() => {
    setPageNumber(numPages);
  }, [numPages]);

  const hasNext = effectivePageNumber < numPages;
  const hasPrev = effectivePageNumber > 1;

  const firstIndex = (effectivePageNumber - 1) * elementsPerPage;
  const lastIndex = Math.min(
    effectivePageNumber * elementsPerPage,
    elements.length,
  );

  return {
    page: effectivePageNumber,
    count: numPages,
    hasNext,
    hasPrev,
    goNext: nextPage,
    goPrev: prevPage,
    goFirst: firstPage,
    goLast: lastPage,
    firstIndex,
    lastIndex,
    current: elements.slice(firstIndex, lastIndex),
  };
}
