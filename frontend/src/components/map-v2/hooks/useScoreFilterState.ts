import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import type { ScoreFilterValues } from '@/api/asset-score-filters';

export const SCORE_VALUES = [0, 1, 2, 3] as const;

const DEFAULT_DEPENDENCY_MIN = '0';
const DEFAULT_DEPENDENCY_MAX = '3';

const allScoresSelected = (values: number[] | null): boolean => values === null || SCORE_VALUES.every((v) => values.includes(v));

const isDefaultDependencyValues = (min: string | null, max: string | null): boolean =>
    (min ?? DEFAULT_DEPENDENCY_MIN) === DEFAULT_DEPENDENCY_MIN && (max ?? DEFAULT_DEPENDENCY_MAX) === DEFAULT_DEPENDENCY_MAX;

export const isDefaultFilter = (filter: ScoreFilterValues): boolean => {
    return (
        allScoresSelected(filter.criticalityValues) &&
        allScoresSelected(filter.exposureValues) &&
        allScoresSelected(filter.redundancyValues) &&
        isDefaultDependencyValues(filter.dependencyMin, filter.dependencyMax)
    );
};

export type UseScoreFilterStateOptions = {
    initialValues?: ScoreFilterValues;
};

export type UseScoreFilterStateReturn = {
    criticalityValues: number[];
    setCriticalityValues: Dispatch<SetStateAction<number[]>>;
    exposureValues: number[];
    setExposureValues: Dispatch<SetStateAction<number[]>>;
    redundancyValues: number[];
    setRedundancyValues: Dispatch<SetStateAction<number[]>>;
    dependencyMin: string;
    setDependencyMin: Dispatch<SetStateAction<string>>;
    dependencyMax: string;
    setDependencyMax: Dispatch<SetStateAction<string>>;
    handleCheckboxChange: (setter: Dispatch<SetStateAction<number[]>>, value: number, checked: boolean) => void;
    buildFilterPayload: () => ScoreFilterValues;
    resetToDefaults: () => void;
    isDefaultFilter: () => boolean;
    isValidRange: () => boolean;
};

export function useScoreFilterState({ initialValues }: UseScoreFilterStateOptions = {}): UseScoreFilterStateReturn {
    const [criticalityValues, setCriticalityValues] = useState<number[]>(initialValues?.criticalityValues ?? [...SCORE_VALUES]);
    const [exposureValues, setExposureValues] = useState<number[]>(initialValues?.exposureValues ?? [...SCORE_VALUES]);
    const [redundancyValues, setRedundancyValues] = useState<number[]>(initialValues?.redundancyValues ?? [...SCORE_VALUES]);
    const [dependencyMin, setDependencyMin] = useState<string>(initialValues?.dependencyMin ?? DEFAULT_DEPENDENCY_MIN);
    const [dependencyMax, setDependencyMax] = useState<string>(initialValues?.dependencyMax ?? DEFAULT_DEPENDENCY_MAX);

    const handleCheckboxChange = useCallback((setter: Dispatch<SetStateAction<number[]>>, value: number, checked: boolean) => {
        setter((prev) => {
            if (checked) {
                return [...prev, value].sort((a, b) => a - b);
            }
            return prev.filter((v) => v !== value);
        });
    }, []);

    const allSelected = useCallback((values: number[]) => SCORE_VALUES.every((v) => values.includes(v)), []);

    const isDefaultDep = useCallback(() => {
        return dependencyMin.trim() === DEFAULT_DEPENDENCY_MIN && dependencyMax.trim() === DEFAULT_DEPENDENCY_MAX;
    }, [dependencyMin, dependencyMax]);

    const checkIsDefaultFilter = useCallback(() => {
        return allSelected(criticalityValues) && allSelected(exposureValues) && allSelected(redundancyValues) && isDefaultDep();
    }, [criticalityValues, exposureValues, redundancyValues, allSelected, isDefaultDep]);

    const buildFilterPayload = useCallback((): ScoreFilterValues => {
        const defaultDep = isDefaultDep();

        return {
            criticalityValues: allSelected(criticalityValues) ? null : criticalityValues,
            exposureValues: allSelected(exposureValues) ? null : exposureValues,
            redundancyValues: allSelected(redundancyValues) ? null : redundancyValues,
            dependencyMin: defaultDep ? null : dependencyMin.trim() || null,
            dependencyMax: defaultDep ? null : dependencyMax.trim() || null,
        };
    }, [criticalityValues, exposureValues, redundancyValues, dependencyMin, dependencyMax, allSelected, isDefaultDep]);

    const resetToDefaults = useCallback(() => {
        setCriticalityValues([...SCORE_VALUES]);
        setExposureValues([...SCORE_VALUES]);
        setRedundancyValues([...SCORE_VALUES]);
        setDependencyMin(DEFAULT_DEPENDENCY_MIN);
        setDependencyMax(DEFAULT_DEPENDENCY_MAX);
    }, []);

    const isValidRange = useCallback(() => {
        const min = Number.parseFloat(dependencyMin);
        const max = Number.parseFloat(dependencyMax);
        return !Number.isNaN(min) && !Number.isNaN(max) && min <= max;
    }, [dependencyMin, dependencyMax]);

    return {
        criticalityValues,
        setCriticalityValues,
        exposureValues,
        setExposureValues,
        redundancyValues,
        setRedundancyValues,
        dependencyMin,
        setDependencyMin,
        dependencyMax,
        setDependencyMax,
        handleCheckboxChange,
        buildFilterPayload,
        resetToDefaults,
        isDefaultFilter: checkIsDefaultFilter,
        isValidRange,
    };
}

export default useScoreFilterState;
