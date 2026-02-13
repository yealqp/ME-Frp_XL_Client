/**
 * User Information Types
 * 
 * This file defines the user information data structures used throughout the application.
 */

/**
 * User information interface
 */
export interface UserInfo {
  /** Username */
  username: string;
  /** User ID */
  userId: number;
  /** Whether the user has completed real-name verification */
  isRealname: boolean;
  /** User group name (friendly display) */
  friendlyGroup: string;
  /** Registration timestamp (Unix timestamp in seconds) */
  regTime: number;
  /** User email address */
  email: string;
  /** Number of proxies/tunnels currently in use */
  usedProxies: number;
  /** Maximum number of proxies/tunnels allowed */
  maxProxies: number;
  /** Remaining traffic in MB */
  traffic: number;
  /** Inbound bandwidth limit (in KB/s, multiply by 128 to get Mbps) */
  inBound: number;
  /** Outbound bandwidth limit (in KB/s, multiply by 128 to get Mbps) */
  outBound: number;
  /** Whether the user has signed in today (optional) */
  todaySigned?: boolean;
  /** Additional user properties */
  [key: string]: any;
}
