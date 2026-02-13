import { ref, Ref } from 'vue';

/**
 * Loading state interface
 * @template T - The type of data being loaded
 */
interface LoadingState<T> {
  /** Reactive reference to the loaded data */
  data: Ref<T | null>;
  /** Reactive reference to the loading state */
  loading: Ref<boolean>;
  /** Reactive reference to any error that occurred */
  error: Ref<Error | null>;
  /** Execute an async function and manage loading state */
  execute: (fn: () => Promise<T>) => Promise<T>;
  /** Reset all state to initial values */
  reset: () => void;
}

/**
 * Composable for managing loading state of async operations
 * 
 * Provides automatic loading state management, error handling, and data storage
 * for async operations. Supports multiple concurrent operations when used with
 * multiple instances.
 * 
 * @template T - The type of data being loaded
 * @param initialData - Optional initial value for data (defaults to null)
 * @returns LoadingState object with data, loading, error refs and execute/reset methods
 * 
 * @example
 * ```ts
 * const { data, loading, error, execute } = useLoading<UserInfo>();
 * 
 * // Execute an async operation
 * await execute(async () => {
 *   const response = await fetch('/api/user');
 *   return response.json();
 * });
 * 
 * // Access the results
 * if (error.value) {
 *   console.error('Failed to load:', error.value);
 * } else {
 *   console.log('User data:', data.value);
 * }
 * ```
 * 
 * **Validates: Requirements 2.1, 2.2, 2.4**
 */
export function useLoading<T = any>(initialData: T | null = null): LoadingState<T> {
  const data = ref<T | null>(initialData) as Ref<T | null>;
  const loading = ref(false);
  const error = ref<Error | null>(null);

  /**
   * Execute an async function with automatic loading state management
   * 
   * - Sets loading to true before execution
   * - Clears any previous errors
   * - Stores the result in data on success
   * - Stores any error in error on failure
   * - Always sets loading to false when complete
   * - Re-throws errors for caller handling
   * 
   * @param fn - Async function to execute
   * @returns Promise resolving to the function result
   * @throws Re-throws any error from the async function
   */
  const execute = async (fn: () => Promise<T>): Promise<T> => {
    loading.value = true;
    error.value = null;

    try {
      const result = await fn();
      data.value = result;
      return result;
    } catch (err) {
      const loadingError = err instanceof Error ? err : new Error(String(err));
      error.value = loadingError;
      throw loadingError;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Reset all state to initial values
   * 
   * - Resets data to initialData
   * - Sets loading to false
   * - Clears any error
   */
  const reset = () => {
    data.value = initialData;
    loading.value = false;
    error.value = null;
  };

  return { data, loading, error, execute, reset };
}
