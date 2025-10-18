import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useLocalStorage from './useLocalStorage';

describe('useLocalStorage', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    afterEach(() => {
        localStorage.clear();
    });

    describe('Initial value', () => {
        it('returns default value when localStorage is empty', () => {
            const { result } = renderHook(() => useLocalStorage('test-key', 'default-value'));

            expect(result.current[0]).toBe('default-value');
        });

        it('returns stored value when localStorage has data', () => {
            localStorage.setItem('test-key', JSON.stringify('stored-value'));

            const { result } = renderHook(() => useLocalStorage('test-key', 'default-value'));

            expect(result.current[0]).toBe('stored-value');
        });

        it('handles objects as default values', () => {
            const defaultObj = { name: 'Test', count: 0 };
            const { result } = renderHook(() => useLocalStorage('test-key', defaultObj));

            expect(result.current[0]).toEqual(defaultObj);
        });

        it('handles arrays as default values', () => {
            const defaultArray = [1, 2, 3];
            const { result } = renderHook(() => useLocalStorage('test-key', defaultArray));

            expect(result.current[0]).toEqual(defaultArray);
        });

        it('handles boolean default values', () => {
            const { result } = renderHook(() => useLocalStorage('test-key', true));

            expect(result.current[0]).toBe(true);
        });

        it('handles number default values', () => {
            const { result } = renderHook(() => useLocalStorage('test-key', 42));

            expect(result.current[0]).toBe(42);
        });

        it('handles null as default value', () => {
            const { result } = renderHook(() => useLocalStorage('test-key', null));

            expect(result.current[0]).toBeNull();
        });
    });

    describe('Storing values', () => {
        it('stores string value in localStorage', () => {
            const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

            act(() => {
                result.current[1]('new-value');
            });

            expect(result.current[0]).toBe('new-value');
            expect(localStorage.getItem('test-key')).toBe(JSON.stringify('new-value'));
        });

        it('stores object value in localStorage', () => {
            const { result } = renderHook(() => useLocalStorage('test-key', { count: 0 }));

            act(() => {
                result.current[1]({ count: 5, name: 'Test' });
            });

            expect(result.current[0]).toEqual({ count: 5, name: 'Test' });
            expect(localStorage.getItem('test-key')).toBe(JSON.stringify({ count: 5, name: 'Test' }));
        });

        it('stores array value in localStorage', () => {
            const { result } = renderHook(() => useLocalStorage<number[]>('test-key', []));

            act(() => {
                result.current[1]([1, 2, 3]);
            });

            expect(result.current[0]).toEqual([1, 2, 3]);
            expect(localStorage.getItem('test-key')).toBe(JSON.stringify([1, 2, 3]));
        });

        it('updates localStorage when value changes', () => {
            const { result } = renderHook(() => useLocalStorage('test-key', 0));

            act(() => {
                result.current[1](1);
            });

            expect(localStorage.getItem('test-key')).toBe('1');

            act(() => {
                result.current[1](2);
            });

            expect(localStorage.getItem('test-key')).toBe('2');
        });
    });

    describe('Functional updates', () => {
        it('supports functional updates', () => {
            const { result } = renderHook(() => useLocalStorage('counter', 0));
            const increment = (prev: number) => prev + 1;

            act(() => {
                result.current[1](increment);
            });
            expect(result.current[0]).toBe(1);

            act(() => {
                result.current[1](increment);
            });
            expect(result.current[0]).toBe(2);
        });

        it('functional update with objects', () => {
            const { result } = renderHook(() => useLocalStorage('user', { name: 'John', age: 30 }));
            const updateAge = (prev: { name: string; age: number }) => ({ ...prev, age: 31 });

            act(() => {
                result.current[1](updateAge);
            });
            expect(result.current[0]).toEqual({ name: 'John', age: 31 });
        });
    });

    describe('Error handling', () => {
        it('handles corrupted localStorage data', () => {
            localStorage.setItem('test-key', 'invalid-json{]');

            const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

            expect(result.current[0]).toBe('default');
        });

        it('handles non-JSON localStorage data', () => {
            localStorage.setItem('test-key', 'plain-text-not-json');

            const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

            expect(result.current[0]).toBe('default');
        });

        it('handles localStorage getItem throwing error', () => {
            const getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
                throw new Error('Storage error');
            });

            const { result } = renderHook(() => useLocalStorage('test-key', 'default'));

            expect(result.current[0]).toBe('default');

            getItemSpy.mockRestore();
        });
    });

    describe('Multiple instances', () => {
        it('different keys maintain separate state', () => {
            const { result: result1 } = renderHook(() => useLocalStorage('key1', 'value1'));
            const { result: result2 } = renderHook(() => useLocalStorage('key2', 'value2'));

            act(() => {
                result1.current[1]('updated1');
                result2.current[1]('updated2');
            });

            expect(result1.current[0]).toBe('updated1');
            expect(result2.current[0]).toBe('updated2');
            expect(localStorage.getItem('key1')).toBe(JSON.stringify('updated1'));
            expect(localStorage.getItem('key2')).toBe(JSON.stringify('updated2'));
        });

        it('same key shares state across instances', () => {
            localStorage.setItem('shared-key', JSON.stringify('initial'));

            const { result: result1 } = renderHook(() => useLocalStorage('shared-key', 'default'));
            const { result: result2 } = renderHook(() => useLocalStorage('shared-key', 'default'));

            expect(result1.current[0]).toBe('initial');
            expect(result2.current[0]).toBe('initial');
        });
    });

    describe('Type safety', () => {
        it('maintains type for string', () => {
            const { result } = renderHook(() => useLocalStorage('test', 'string'));

            act(() => {
                result.current[1]('new string');
            });

            expect(typeof result.current[0]).toBe('string');
        });

        it('maintains type for number', () => {
            const { result } = renderHook(() => useLocalStorage('test', 100));

            act(() => {
                result.current[1](200);
            });

            expect(typeof result.current[0]).toBe('number');
        });

        it('maintains type for complex objects', () => {
            interface User {
                name: string;
                age: number;
                active: boolean;
            }

            const defaultUser: User = { name: 'Test', age: 25, active: true };
            const { result } = renderHook(() => useLocalStorage('user', defaultUser));

            act(() => {
                result.current[1]({ name: 'Updated', age: 30, active: false });
            });

            expect(result.current[0]).toHaveProperty('name');
            expect(result.current[0]).toHaveProperty('age');
            expect(result.current[0]).toHaveProperty('active');
        });
    });

    describe('Edge cases', () => {
        it('handles empty string as value', () => {
            const { result } = renderHook(() => useLocalStorage('test', 'default'));

            act(() => {
                result.current[1]('');
            });

            expect(result.current[0]).toBe('');
            expect(localStorage.getItem('test')).toBe('""');
        });

        it('handles zero as value', () => {
            const { result } = renderHook(() => useLocalStorage('test', 10));

            act(() => {
                result.current[1](0);
            });

            expect(result.current[0]).toBe(0);
            expect(localStorage.getItem('test')).toBe('0');
        });

        it('handles false as value', () => {
            const { result } = renderHook(() => useLocalStorage('test', true));

            act(() => {
                result.current[1](false);
            });

            expect(result.current[0]).toBe(false);
            expect(localStorage.getItem('test')).toBe('false');
        });

        it('handles empty array', () => {
            const { result } = renderHook(() => useLocalStorage<number[]>('test', [1, 2, 3]));

            act(() => {
                result.current[1]([]);
            });

            expect(result.current[0]).toEqual([]);
            expect(localStorage.getItem('test')).toBe('[]');
        });

        it('handles empty object', () => {
            const { result } = renderHook(() => useLocalStorage('test', { a: 1 }));

            act(() => {
                result.current[1]({});
            });

            expect(result.current[0]).toEqual({});
            expect(localStorage.getItem('test')).toBe('{}');
        });
    });
});
