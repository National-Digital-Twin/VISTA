import { ReactNode, Suspense, lazy, useMemo } from "react";

export interface ChartProps<T> {
  name: string;
  rawData: T[] | undefined;
  isLoading: boolean;
  isError: boolean;
  parameter: string;
  getUnit: (param: string) => string;
  dataTransform: (item: T) => { time: string; value: number };
  className?: string;
  additionalChartElements?: ReactNode;
}

const ChartBody = lazy(() => import("./ChartBody"));

export default function Chart<T>({
  name,
  rawData,
  isLoading,
  isError,
  parameter,
  getUnit,
  dataTransform,
  className,
  additionalChartElements,
}: ChartProps<T>) {
  const unit = useMemo(() => getUnit(parameter), [getUnit, parameter]);
  const data = useMemo(
    () => rawData?.map(dataTransform) || [],
    [rawData, dataTransform],
  );

  if (isLoading) {
    return (
      <div>
        Loading {parameter} data for {name}
      </div>
    );
  }
  if (isError) {
    return (
      <div>
        Error loading {parameter} data for {name}
      </div>
    );
  }

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <ChartBody
        data={data}
        className={className}
        param={parameter}
        unit={unit}
        additionalChartElements={additionalChartElements}
      />
    </Suspense>
  );
}
