import { ref, Ref } from 'vue';

/**
 * Options for creating an async action
 */
export interface AsyncActionOptions<T, R> {
  /** The async action to execute */
  action: (params: T) => Promise<R>;
  /** Callback on successful completion */
  onSuccess?: (result: R) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Optimistic update function (called before action) */
  optimisticUpdate?: (params: T) => void;
  /** Rollback function (called on error if optimistic update was used) */
  rollback?: (params: T) => void;
}

/**
 * Result of creating an async action
 */
export interface AsyncActionResult<T, R> {
  /** Loading state */
  loading: Ref<boolean>;
  /** Error state */
  error: Ref<Error | null>;
  /** Execute the action */
  execute: (params: T) => Promise<R>;
}

/**
 * Create an async action with automatic loading and error state management
 * 
 * @param options - Configuration options for the async action
 * @returns An object with loading, error states and execute function
 * 
 * @example
 * ```ts
 * const { loading, error, execute } = createAsyncAction({
 *   action: async (userId: number) => {
 *     return await fetchUser(userId);
 *   },
 *   onSuccess: (user) => {
 *     console.log('User loaded:', user);
 *   },
 *   onError: (err) => {
 *     console.error('Failed to load user:', err);
 *   }
 * });
 * 
 * await execute(123);
 * ```
 */
export function createAsyncAction<T = void, R = any>(
  options: AsyncActionOptions<T, R>
): AsyncActionResult<T, R> {
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const execute = async (params: T): Promise<R> => {
    loading.value = true;
    error.value = null;

    // Optimistic update
    if (options.optimisticUpdate) {
      options.optimisticUpdate(params);
    }

    try {
      const result = await options.action(params);
      
      if (options.onSuccess) {
        options.onSuccess(result);
      }

      return result;
    } catch (err) {
      const actionError = err instanceof Error ? err : new Error(String(err));
      error.value = actionError;

      // Rollback on error
      if (options.rollback) {
        options.rollback(params);
      }

      if (options.onError) {
        options.onError(actionError);
      }

      throw actionError;
    } finally {
      loading.value = false;
    }
  };

  return { loading, error, execute };
}

/**
 * Helper for wrapping store actions with automatic loading state management
 * 
 * @param action - The async action to wrap
 * @returns An async action result with loading and error states
 * 
 * @example
 * ```ts
 * const { loading, error, execute } = wrapStoreAction(
 *   async (userId: number) => await fetchUser(userId)
 * );
 * ```
 */
export function wrapStoreAction<T = void, R = any>(
  action: (params: T) => Promise<R>
) {
  return createAsyncAction({ action });
}
