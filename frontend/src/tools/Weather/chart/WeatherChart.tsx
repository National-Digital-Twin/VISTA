import { useQuery } from "@tanstack/react-query";
import { fetchWeatherStation, WeatherStation } from "@/api/weather";
import Chart from "@/components/DetailsPanel/Chart";

export interface WeatherChartProps {
  readonly name: string;
  readonly latitude: string;
  readonly longitude: string;
  readonly className?: string;
}

interface TimeSeriesItem {
  readonly time: string;
  readonly screenTemperature: number;
}

export default function WeatherChart({
  name,
  latitude,
  longitude,
  className,
}: WeatherChartProps) {
  const { data, isLoading, isError } = useQuery<WeatherStation, Error>({
    queryKey: ["weather", name],
    queryFn: () => fetchWeatherStation(latitude, longitude),
    staleTime: 1000 * 60 * 60,
  });

  const timeSeries = data?.data?.features[0]?.properties.timeSeries || [];

  return (
    <Chart
      name={name}
      rawData={timeSeries}
      isLoading={isLoading}
      isError={isError}
      parameter="Screen Temperature"
      getUnit={() => "°C"}
      dataTransform={(item: TimeSeriesItem) => ({
        time: item.time,
        value: item.screenTemperature,
      })}
      className={className}
    />
  );
}
