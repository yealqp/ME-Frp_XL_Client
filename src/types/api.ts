/**
 * API Response Types
 * 
 * This file defines the standard API response formats used throughout the application.
 */

/**
 * Standard API response format
 * @template T - The type of data returned in the response
 */
export interface ApiResponse<T = any> {
  /** Response status code (200 for success) */
  code: number;
  /** Response data payload */
  data: T;
  /** Response message */
  message: string;
}


