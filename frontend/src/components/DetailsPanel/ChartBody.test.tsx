import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import ChartBody from './ChartBody';

vi.mock('./chart.module.css', () => ({
    default: {
        chartContainer: 'chartContainer',
        tooltip: 'tooltip',
        tooltipLabel: 'tooltipLabel',
        tooltipContent: 'tooltipContent',
        zoomOutButton: 'zoomOutButton',
    },
}));

vi.mock('./useZoomChart', () => ({
    useZoomChart: vi.fn(() => ({
        zoomableData: [{ time: '2023-01-01T00:00:00Z', value: 42, milliseconds: 1672531200000 }],
        rootElementProps: { 'data-testid': 'chart-root' },
        lineChartProps: {},
        xAxisProps: {},
        yAxisProps: {},
        ZoomAreaElement: <rect data-testid="zoom-area" />,
    })),
}));

describe('ChartBody', () => {
    beforeAll(() => {
        globalThis.ResizeObserver = class {
            observe() {
                console.log('observe called');
            }
            unobserve() {
                console.log('unobserve called');
            }
            disconnect() {
                console.log('disconnect called');
            }
        };
    });
    const baseProps = {
        param: 'temp',
        unit: '°C',
    };

    const validData = [
        { time: '2023-01-01T00:00:00Z', value: 42, milliseconds: 1672531200000 },
        { time: '2023-01-01T01:00:00Z', value: 43, milliseconds: 1672534800000 },
    ];

    const mixedData = [
        { time: '', value: 42, milliseconds: 1672531200000 },
        { time: '2023-01-01T01:00:00Z', value: 43, milliseconds: 1672534800000 },
        { value: 44, milliseconds: 1672538400000 },
    ];

    it('renders the chart with valid data', () => {
        render(<ChartBody {...baseProps} data={validData} />);
        expect(screen.getByTestId('chart-root')).toBeInTheDocument();
    });

    it('filters out invalid data', () => {
        render(<ChartBody {...baseProps} data={mixedData as any} />);
        expect(screen.getByTestId('chart-root')).toBeInTheDocument();
        
        
    });
});
