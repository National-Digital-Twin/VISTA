import { ReactNode, Suspense, lazy, useMemo } from "react";

export interface ChartProps<T> {
  readonly name: string;
  readonly rawData: T[] | undefined;
  readonly isLoading: boolean;
  readonly isError: boolean;
  readonly parameter: string;
  readonly getUnit: (param: string) => string;
  readonly dataTransform: (item: T) => { time: string; value: number };
  readonly className?: string;
  readonly additionalChartElements?: ReactNode;
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
