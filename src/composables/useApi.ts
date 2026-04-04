/**
 * API Handler Composable
 * 
 * Provides a unified interface for handling Tauri invoke calls with:
 * - Automatic JSON parsing
 * - Unified error handling
 * - TypeScript type safety
 * - Standard API response format handling { code, data, message }
 * 
 * @example
 * ```ts
 * const { data, error, loading, execute } = useApi<UserInfo>({
 *   command: 'api_get_user_info',
 *   onSuccess: (data) => console.log('User loaded:', data),
 *   onError: (error) => console.error('Failed:', error)
 * });
 * 
 * await execute();
 * ```
 */

import { ref, type Ref } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import type { ApiResponse } from '@/types/api';
import { parseTauriResponse } from '@/utils/tauriResponse';
import { startLoading, finishLoading, errorLoading } from './useLoadingBar';

/**
 * Options for configuring the API call
 * @template T - The expected type of the response data
 */
export interface ApiOptions<T> {
  /** The Tauri command to invoke */
  command: string;
  /** Parameters to pass to the command */
  params?: Record<string, any>;
  /** Whether to automatically parse JSON responses (default: true) */
  parseResponse?: boolean;
  /** Whether to show loading bar (default: true) */
  showLoadingBar?: boolean;
  /** Callback function called on successful response */
  onSuccess?: (data: T) => void;
  /** Callback function called on error */
  onError?: (error: Error) => void;
}

/**
 * Result object returned by useApi
 * @template T - The expected type of the response data
 */
export interface ApiResult<T> {
  /** The response data (null if not yet loaded or on error) */
  data: Ref<T | null>;
  /** Error object if the request failed */
  error: Ref<Error | null>;
  /** Loading state indicator */
  loading: Ref<boolean>;
  /** Function to execute the API call */
  execute: () => Promise<T>;
}

/**
 * Composable for handling Tauri API calls with automatic JSON parsing and error handling
 * 
 * @template T - The expected type of the response data
 * @param options - Configuration options for the API call
 * @returns Object containing data, error, loading state, and execute function
 * 
 * @example
 * ```ts
 * // Simple usage
 * const { data, loading, execute } = useApi<string>({
 *   command: 'api_get_version'
 * });
 * await execute();
 * 
 * // With parameters and callbacks
 * const { data, error, loading, execute } = useApi<UserInfo>({
 *   command: 'api_get_user_info',
 *   params: { userId: 123 },
 *   onSuccess: (data) => console.log('Success:', data),
 *   onError: (error) => console.error('Error:', error)
 * });
 * ```
 */
export function useApi<T = any>(options: ApiOptions<T>): ApiResult<T> {
  const data = ref<T | null>(null) as Ref<T | null>;
  const error = ref<Error | null>(null);
  const loading = ref(false);

  /**
   * Execute the API call
   * @returns Promise resolving to the response data
   * @throws Error if the API call fails
   */
  const execute = async (): Promise<T> => {
    loading.value = true;
    error.value = null;

    // Show loading bar by default unless explicitly disabled
    const shouldShowLoadingBar = options.showLoadingBar !== false;
    if (shouldShowLoadingBar) {
      startLoading();
    }

    try {
      // Invoke the Tauri command
      const response = await invoke(options.command, options.params);
      
      // Auto parse JSON if response is string and parseResponse is not explicitly false
      const parsedData = options.parseResponse !== false && typeof response === 'string'
        ? parseTauriResponse<T>(response)
        : response;

      // Handle standard API response format { code, data, message }
      if (parsedData && typeof parsedData === 'object' && 'code' in parsedData) {
        const apiResponse = parsedData as ApiResponse<T>;
        
        if (apiResponse.code === 200) {
          data.value = apiResponse.data;
          options.onSuccess?.(apiResponse.data);
          if (shouldShowLoadingBar) {
            finishLoading();
          }
          return apiResponse.data;
        } else {
          throw new Error(apiResponse.message || 'API request failed');
        }
      }

      // If not standard format, return parsed data directly
      data.value = parsedData as T;
      options.onSuccess?.(parsedData as T);
      if (shouldShowLoadingBar) {
        finishLoading();
      }
      return parsedData as T;
    } catch (err) {
      // Normalize error to Error object
      const apiError = err instanceof Error ? err : new Error(String(err));
      error.value = apiError;
      options.onError?.(apiError);
      if (shouldShowLoadingBar) {
        errorLoading();
      }
      throw apiError;
    } finally {
      loading.value = false;
    }
  };

  return { data, error, loading, execute };
}
