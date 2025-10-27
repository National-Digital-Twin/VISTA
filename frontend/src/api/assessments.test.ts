import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAssessments, fetchAssessmentDependencies } from './assessments';

vi.mock('./utils', () => ({
    createParalogEndpoint: (path: string) => `/mock-api/${path}`,
    fetchOptions: {
        headers: {
            'Content-Type': 'application/json',
        },
    },
}));

describe('assessments API', () => {
    let fetchMock: ReturnType<typeof vi.fn>;
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        fetchMock = vi.fn();
        globalThis.fetch = fetchMock as any;
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('fetchAssessments', () => {
        it('successfully fetches assessments', async () => {
            const mockAssessments = [
                {
                    name: 'Assessment 1',
                    numberOfAssessedItems: 150,
                    uri: 'http://example.com/assessment#1',
                },
                {
                    name: 'Assessment 2',
                    numberOfAssessedItems: 200,
                    uri: 'http://example.com/assessment#2',
                },
            ];

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockAssessments),
            });

            const result = await fetchAssessments();

            expect(result).toEqual(mockAssessments);
            expect(fetchMock).toHaveBeenCalledWith('/mock-api/assessments', {
                headers: { 'Content-Type': 'application/json' },
            });
        });

        it('returns empty array when no assessments', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([]),
            });

            const result = await fetchAssessments();

            expect(result).toEqual([]);
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                statusText: 'Internal Server Error',
            });

            await expect(fetchAssessments()).rejects.toThrow('Failed to retrieve assessments: Internal Server Error');
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Network error'));

            await expect(fetchAssessments()).rejects.toThrow('Network error');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching assessments:', expect.any(Error));
        });

        it('preserves all assessment properties', async () => {
            const mockAssessment = [
                {
                    name: 'Critical Infrastructure Assessment',
                    numberOfAssessedItems: 542,
                    uri: 'http://example.com/assessment#critical',
                },
            ];

            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockAssessment),
            });

            const result = await fetchAssessments();

            expect(result[0]).toHaveProperty('name');
            expect(result[0]).toHaveProperty('numberOfAssessedItems');
            expect(result[0]).toHaveProperty('uri');
            expect(result[0].numberOfAssessedItems).toBe(542);
        });

        it('handles single assessment', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([
                    {
                        name: 'Single Assessment',
                        numberOfAssessedItems: 100,
                        uri: 'http://example.com/assessment#single',
                    },
                ]),
            });

            const result = await fetchAssessments();

            expect(result).toHaveLength(1);
        });
    });

    describe('fetchAssessmentDependencies', () => {
        const mockDependencies = [
            {
                dependencyUri: 'http://example.com/dependency#1',
                dependentName: 'Dependent 1',
                dependentNode: 'http://example.com/node#1',
                dependentNodeType: 'http://example.com/type#building',
                providerName: 'Provider 1',
                providerNode: 'http://example.com/node#2',
                providerNodeType: 'http://example.com/type#utility',
                osmID: 'osm-123',
                criticalityRating: 8,
            },
            {
                dependencyUri: 'http://example.com/dependency#2',
                dependentName: null,
                dependentNode: 'http://example.com/node#3',
                dependentNodeType: 'http://example.com/type#service',
                providerName: null,
                providerNode: 'http://example.com/node#4',
                providerNodeType: 'http://example.com/type#infrastructure',
                osmID: null,
                criticalityRating: 5,
            },
        ];

        it('successfully fetches dependencies with types and assessment', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockDependencies),
            });

            const types = ['Building', 'Utility'];
            const result = await fetchAssessmentDependencies(types, 'CUSTOM_ASSESSMENT');

            expect(result).toEqual(mockDependencies);
            expect(fetchMock).toHaveBeenCalledWith('/mock-api/assessments/dependencies', {
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
                body: JSON.stringify({ assessment: 'CUSTOM_ASSESSMENT', types }),
            });
        });

        it('uses default assessment when not provided', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([]),
            });

            const types = ['Building'];
            await fetchAssessmentDependencies(types);

            expect(fetchMock).toHaveBeenCalledWith(
                '/mock-api/assessments/dependencies',
                expect.objectContaining({
                    body: JSON.stringify({ assessment: 'DEFAULT_ASSESSMENT', types }),
                }),
            );
        });

        it('handles empty types array', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([]),
            });

            const result = await fetchAssessmentDependencies([]);

            expect(result).toEqual([]);
            expect(fetchMock).toHaveBeenCalled();
        });

        it('handles multiple types', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockDependencies),
            });

            const types = ['Type1', 'Type2', 'Type3', 'Type4'];
            await fetchAssessmentDependencies(types, 'TEST_ASSESSMENT');

            const callBody = JSON.parse(fetchMock.mock.calls[0][1].body);
            expect(callBody.types).toEqual(types);
            expect(callBody.assessment).toBe('TEST_ASSESSMENT');
        });

        it('throws error when response is not ok', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 400,
            });

            const types = ['Building'];
            await expect(fetchAssessmentDependencies(types, 'TEST')).rejects.toThrow(
                'Failed to retrieve dependencies for assessment "TEST" with types: Building',
            );
            expect(consoleErrorSpy).toHaveBeenCalled();
        });

        it('throws error with multiple types in error message', async () => {
            fetchMock.mockResolvedValue({
                ok: false,
                status: 500,
            });

            const types = ['Type1', 'Type2', 'Type3'];
            await expect(fetchAssessmentDependencies(types)).rejects.toThrow(
                'Failed to retrieve dependencies for assessment "DEFAULT_ASSESSMENT" with types: Type1, Type2, Type3',
            );
        });

        it('throws error on network failure', async () => {
            fetchMock.mockRejectedValue(new Error('Connection refused'));

            await expect(fetchAssessmentDependencies(['Building'])).rejects.toThrow('Connection refused');
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching dependencies for assessment "DEFAULT_ASSESSMENT":', expect.any(Error));
        });

        it('preserves all dependency properties', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockDependencies),
            });

            const result = await fetchAssessmentDependencies(['Building']);

            expect(result[0]).toMatchObject({
                dependencyUri: expect.any(String),
                dependentName: expect.anything(),
                dependentNode: expect.any(String),
                dependentNodeType: expect.any(String),
                providerName: expect.anything(),
                providerNode: expect.any(String),
                providerNodeType: expect.any(String),
                osmID: expect.anything(),
                criticalityRating: expect.any(Number),
            });
        });

        it('handles null values in dependency data', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue(mockDependencies),
            });

            const result = await fetchAssessmentDependencies(['Building']);

            expect(result[1].dependentName).toBeNull();
            expect(result[1].providerName).toBeNull();
            expect(result[1].osmID).toBeNull();
        });

        it('sends POST request with correct content type', async () => {
            fetchMock.mockResolvedValue({
                ok: true,
                json: vi.fn().mockResolvedValue([]),
            });

            await fetchAssessmentDependencies(['Test']);

            expect(fetchMock).toHaveBeenCalledWith(
                expect.any(String),
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json',
                    }),
                }),
            );
        });
    });
});
