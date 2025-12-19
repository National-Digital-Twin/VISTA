import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';

import { useScoreFilterState, isDefaultFilter, SCORE_VALUES } from './useScoreFilterState';
import type { ScoreFilterValues } from '@/api/asset-score-filters';

describe('useScoreFilterState', () => {
    describe('initial state', () => {
        it('initializes with default values when no initialValues provided', () => {
            const { result } = renderHook(() => useScoreFilterState());

            expect(result.current.criticalityValues).toEqual([0, 1, 2, 3]);
            expect(result.current.exposureValues).toEqual([0, 1, 2, 3]);
            expect(result.current.redundancyValues).toEqual([0, 1, 2, 3]);
            expect(result.current.dependencyMin).toBe('0');
            expect(result.current.dependencyMax).toBe('3');
        });

        it('initializes with provided initialValues', () => {
            const initialValues: ScoreFilterValues = {
                criticalityValues: [1, 2],
                exposureValues: [0, 3],
                redundancyValues: [2],
                dependencyMin: '0.5',
                dependencyMax: '2.5',
            };

            const { result } = renderHook(() => useScoreFilterState({ initialValues }));

            expect(result.current.criticalityValues).toEqual([1, 2]);
            expect(result.current.exposureValues).toEqual([0, 3]);
            expect(result.current.redundancyValues).toEqual([2]);
            expect(result.current.dependencyMin).toBe('0.5');
            expect(result.current.dependencyMax).toBe('2.5');
        });

        it('handles null values in initialValues by using defaults', () => {
            const initialValues: ScoreFilterValues = {
                criticalityValues: null,
                exposureValues: [1, 2],
                redundancyValues: null,
                dependencyMin: null,
                dependencyMax: '2',
            };

            const { result } = renderHook(() => useScoreFilterState({ initialValues }));

            expect(result.current.criticalityValues).toEqual([0, 1, 2, 3]);
            expect(result.current.exposureValues).toEqual([1, 2]);
            expect(result.current.redundancyValues).toEqual([0, 1, 2, 3]);
            expect(result.current.dependencyMin).toBe('0');
            expect(result.current.dependencyMax).toBe('2');
        });
    });

    describe('handleCheckboxChange', () => {
        it('adds value when checked', () => {
            const { result } = renderHook(() => useScoreFilterState());

            act(() => {
                result.current.setCriticalityValues([1, 2]);
            });

            act(() => {
                result.current.handleCheckboxChange(result.current.setCriticalityValues, 3, true);
            });

            expect(result.current.criticalityValues).toEqual([1, 2, 3]);
        });

        it('removes value when unchecked', () => {
            const { result } = renderHook(() => useScoreFilterState());

            act(() => {
                result.current.handleCheckboxChange(result.current.setCriticalityValues, 2, false);
            });

            expect(result.current.criticalityValues).toEqual([0, 1, 3]);
        });

        it('keeps values sorted when adding', () => {
            const { result } = renderHook(() => useScoreFilterState());

            act(() => {
                result.current.setCriticalityValues([1, 3]);
            });

            act(() => {
                result.current.handleCheckboxChange(result.current.setCriticalityValues, 0, true);
            });

            expect(result.current.criticalityValues).toEqual([0, 1, 3]);
        });
    });

    describe('buildFilterPayload', () => {
        it('returns null for values when all are selected (defaults)', () => {
            const { result } = renderHook(() => useScoreFilterState());

            const payload = result.current.buildFilterPayload();

            expect(payload.criticalityValues).toBeNull();
            expect(payload.exposureValues).toBeNull();
            expect(payload.redundancyValues).toBeNull();
            expect(payload.dependencyMin).toBeNull();
            expect(payload.dependencyMax).toBeNull();
        });

        it('returns actual values when not all are selected', () => {
            const { result } = renderHook(() => useScoreFilterState());

            act(() => {
                result.current.setCriticalityValues([1, 2]);
                result.current.setDependencyMin('0.5');
            });

            const payload = result.current.buildFilterPayload();

            expect(payload.criticalityValues).toEqual([1, 2]);
            expect(payload.exposureValues).toBeNull();
            expect(payload.redundancyValues).toBeNull();
            expect(payload.dependencyMin).toBe('0.5');
            expect(payload.dependencyMax).toBe('3');
        });

        it('trims whitespace from dependency values', () => {
            const { result } = renderHook(() => useScoreFilterState());

            act(() => {
                result.current.setDependencyMin('  0.5  ');
                result.current.setDependencyMax('  2.5  ');
            });

            const payload = result.current.buildFilterPayload();

            expect(payload.dependencyMin).toBe('0.5');
            expect(payload.dependencyMax).toBe('2.5');
        });

        it('returns null for empty dependency strings', () => {
            const { result } = renderHook(() => useScoreFilterState());

            act(() => {
                result.current.setDependencyMin('');
                result.current.setDependencyMax('   ');
            });

            const payload = result.current.buildFilterPayload();

            expect(payload.dependencyMin).toBeNull();
            expect(payload.dependencyMax).toBeNull();
        });
    });

    describe('isDefaultFilter (hook method)', () => {
        it('returns true when all values are defaults', () => {
            const { result } = renderHook(() => useScoreFilterState());

            expect(result.current.isDefaultFilter()).toBe(true);
        });

        it('returns false when criticality values are modified', () => {
            const { result } = renderHook(() => useScoreFilterState());

            act(() => {
                result.current.setCriticalityValues([1, 2]);
            });

            expect(result.current.isDefaultFilter()).toBe(false);
        });

        it('returns false when dependency min is modified', () => {
            const { result } = renderHook(() => useScoreFilterState());

            act(() => {
                result.current.setDependencyMin('0.5');
            });

            expect(result.current.isDefaultFilter()).toBe(false);
        });

        it('returns false when dependency max is modified', () => {
            const { result } = renderHook(() => useScoreFilterState());

            act(() => {
                result.current.setDependencyMax('2.5');
            });

            expect(result.current.isDefaultFilter()).toBe(false);
        });
    });

    describe('resetToDefaults', () => {
        it('resets all values to defaults', () => {
            const { result } = renderHook(() => useScoreFilterState());

            act(() => {
                result.current.setCriticalityValues([1, 2]);
                result.current.setExposureValues([0]);
                result.current.setRedundancyValues([3]);
                result.current.setDependencyMin('0.5');
                result.current.setDependencyMax('2.5');
            });

            expect(result.current.isDefaultFilter()).toBe(false);

            act(() => {
                result.current.resetToDefaults();
            });

            expect(result.current.criticalityValues).toEqual([0, 1, 2, 3]);
            expect(result.current.exposureValues).toEqual([0, 1, 2, 3]);
            expect(result.current.redundancyValues).toEqual([0, 1, 2, 3]);
            expect(result.current.dependencyMin).toBe('0');
            expect(result.current.dependencyMax).toBe('3');
            expect(result.current.isDefaultFilter()).toBe(true);
        });
    });
});

describe('isDefaultFilter (standalone function)', () => {
    it('returns true for filter with all null values', () => {
        const filter: ScoreFilterValues = {
            criticalityValues: null,
            exposureValues: null,
            redundancyValues: null,
            dependencyMin: null,
            dependencyMax: null,
        };

        expect(isDefaultFilter(filter)).toBe(true);
    });

    it('returns true for filter with all score values selected', () => {
        const filter: ScoreFilterValues = {
            criticalityValues: [0, 1, 2, 3],
            exposureValues: [0, 1, 2, 3],
            redundancyValues: [0, 1, 2, 3],
            dependencyMin: '0',
            dependencyMax: '3',
        };

        expect(isDefaultFilter(filter)).toBe(true);
    });

    it('returns true for mixed null and full arrays', () => {
        const filter: ScoreFilterValues = {
            criticalityValues: null,
            exposureValues: [0, 1, 2, 3],
            redundancyValues: null,
            dependencyMin: null,
            dependencyMax: '3',
        };

        expect(isDefaultFilter(filter)).toBe(true);
    });

    it('returns false when criticality is not fully selected', () => {
        const filter: ScoreFilterValues = {
            criticalityValues: [1, 2, 3],
            exposureValues: null,
            redundancyValues: null,
            dependencyMin: null,
            dependencyMax: null,
        };

        expect(isDefaultFilter(filter)).toBe(false);
    });

    it('returns false when exposure is not fully selected', () => {
        const filter: ScoreFilterValues = {
            criticalityValues: null,
            exposureValues: [0, 1],
            redundancyValues: null,
            dependencyMin: null,
            dependencyMax: null,
        };

        expect(isDefaultFilter(filter)).toBe(false);
    });

    it('returns false when redundancy is not fully selected', () => {
        const filter: ScoreFilterValues = {
            criticalityValues: null,
            exposureValues: null,
            redundancyValues: [],
            dependencyMin: null,
            dependencyMax: null,
        };

        expect(isDefaultFilter(filter)).toBe(false);
    });

    it('returns false when dependency min is not default', () => {
        const filter: ScoreFilterValues = {
            criticalityValues: null,
            exposureValues: null,
            redundancyValues: null,
            dependencyMin: '0.5',
            dependencyMax: null,
        };

        expect(isDefaultFilter(filter)).toBe(false);
    });

    it('returns false when dependency max is not default', () => {
        const filter: ScoreFilterValues = {
            criticalityValues: null,
            exposureValues: null,
            redundancyValues: null,
            dependencyMin: null,
            dependencyMax: '2.5',
        };

        expect(isDefaultFilter(filter)).toBe(false);
    });
});

describe('SCORE_VALUES constant', () => {
    it('contains expected values', () => {
        expect(SCORE_VALUES).toEqual([0, 1, 2, 3]);
    });

    it('has length of 4', () => {
        expect(SCORE_VALUES).toHaveLength(4);
    });
});
