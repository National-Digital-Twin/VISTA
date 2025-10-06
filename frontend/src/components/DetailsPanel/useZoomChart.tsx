import dayjs from 'dayjs';
import { CSSProperties, useEffect, useMemo, useState } from 'react';
import { RectangleProps, ReferenceArea } from 'recharts';
import { CategoricalChartState } from 'recharts/types/chart/types';

const lineChartStyle: CSSProperties = {
    userSelect: 'none',
};

const rootElementStyle: CSSProperties = {
    position: 'relative',
};

type Domain = ['dataMin' | `dataMin + ${number}` | `dataMin - ${number}` | number, 'dataMax' | `dataMax + ${number}` | `dataMax - ${number}` | number];

const defaultDomain: Domain = ['dataMin', 'dataMax'];

const yAxisBuffer = 0.01;

interface UseZoomChartOptions<Data extends { time: string; value: number }> {
    data: Data[];
    referenceAreaProps?: RectangleProps;
    enabled?: boolean;
}

export const useZoomChart = <Data extends { time: string; value: number }>({ data, referenceAreaProps, enabled = true }: UseZoomChartOptions<Data>) => {
    const [zoomAreaStart, setZoomAreaStart] = useState<number | null>(null);
    const [zoomAreaEnd, setZoomAreaEnd] = useState<number | null>(null);
    const [domain, setDomain] = useState(defaultDomain);

    /**
     * We need to create this on every render in order for the zoom animation
     * to work properly.
     */
    const zoomableData = data.map((item) => ({
        ...item,
        milliseconds: new Date(item.time).getTime(),
    }));

    const legacyTicks = useMemo(() => {
        const ticks = [];
        zoomableData.forEach((item) => {
            if (item.time && typeof item.time === 'string') {
                const date = item.time.split('T')[0];
                if (date && !ticks.some((existingItem) => existingItem.time.split('T')[0] === date)) {
                    ticks.push(item);
                }
            }
        });

        return ticks.map((item) => item.milliseconds);
    }, [zoomableData]);

    const resetDomain = () => {
        setDomain(defaultDomain);
    };

    const handleMouseDown = ({ activeLabel }: CategoricalChartState) => {
        setZoomAreaStart(Number(activeLabel));
    };

    const handleMouseMove = ({ activeLabel }: CategoricalChartState) => {
        if (!zoomAreaStart) {
            return;
        }

        setZoomAreaEnd(Number(activeLabel));
    };

    const handleMouseLeave = () => {
        setZoomAreaStart(null);
        setZoomAreaEnd(null);
    };

    const zoomIn = () => {
        if (!zoomAreaStart) {
            return;
        }
        if (!zoomAreaEnd) {
            setZoomAreaStart(null);
            return;
        }
        if (zoomAreaStart === zoomAreaEnd) {
            setZoomAreaStart(null);
            setZoomAreaEnd(null);
            return;
        }

        const earliestDate = Math.min(zoomAreaStart, zoomAreaEnd);
        const latestDate = Math.max(zoomAreaStart, zoomAreaEnd);

        setZoomAreaStart(null);
        setZoomAreaEnd(null);

        setDomain([earliestDate, latestDate]);
    };

    useEffect(() => {
        resetDomain();
    }, [data]);

    return {
        zoomableData,
        rootElementProps: enabled
            ? {
                  style: rootElementStyle,
              }
            : undefined,
        lineChartProps: enabled
            ? {
                  onMouseDown: handleMouseDown,
                  onMouseMove: handleMouseMove,
                  onMouseUp: zoomIn,
                  onMouseLeave: handleMouseLeave,
                  style: {
                      ...lineChartStyle,
                      cursor: zoomAreaStart && zoomAreaEnd ? 'crosshair' : 'default',
                  },
              }
            : undefined,
        xAxisProps: enabled
            ? {
                  domain,
                  allowDataOverflow: true,
                  tickFormatter: (milliseconds: number) => dayjs(milliseconds).format('D MMM YY, HH:mm'),
                  tickCount: 10,
              }
            : {
                  domain,
                  tickFormatter: (milliseconds: number) => dayjs(milliseconds).format('D MMM YY'),
                  ticks: legacyTicks,
              },
        yAxisProps: enabled
            ? {
                  domain: [`dataMin - ${yAxisBuffer}`, `dataMax + ${yAxisBuffer}`],
                  allowDataOverflow: true,
                  tickFormatter: (tick: number) => tick.toFixed(3),
              }
            : undefined,
        ZoomAreaElement:
            zoomAreaStart && zoomAreaEnd && enabled ? (
                <ReferenceArea strokeOpacity={0.5} strokeDasharray="3 3" {...referenceAreaProps} x1={zoomAreaStart} x2={zoomAreaEnd} />
            ) : null,
        ZoomOutButtonElement:
            domain !== defaultDomain && enabled ? (
                <button className="absolute right-25 z-10" onClick={resetDomain}>
                    Zoom Out
                </button>
            ) : null,
    } as const;
};
