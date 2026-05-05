/**
 * Interval management composable
 * Unified lifecycle-safe interval management with auto-cleanup
 */
import { onUnmounted, ref } from "vue";

export interface UseIntervalOptions {
  /** Whether to fire immediately on start (default: false) */
  immediate?: boolean;
}

/**
 * Lifecycle-safe interval composable
 * Automatically clears the interval on component unmount
 * 
 * @param fn - The function to call on each interval tick
 * @param delay - Interval delay in milliseconds (pass 0 or null to pause)
 * @param options - Additional options
 * @returns Object with start/stop/isRunning controls
 */
export function useInterval(
  fn: () => void,
  delay: number | null = 1000,
  options: UseIntervalOptions = {},
) {
  const { immediate = false } = options;
  const isRunning = ref(false);
  let timer: ReturnType<typeof setInterval> | null = null;

  function start(): void {
    stop();
    if (delay === null || delay <= 0) return;
    isRunning.value = true;
    if (immediate) fn();
    timer = setInterval(fn, delay);
  }

  function stop(): void {
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
    isRunning.value = false;
  }

  function restart(): void {
    stop();
    start();
  }

  onUnmounted(stop);

  return { isRunning, start, stop, restart };
}
