/**
 * Pinia Stores Export Entry
 * 
 * This file exports all store modules for easy importing in components.
 * 
 * @example
 * ```typescript
 * // Import stores
 * import { useAuthStore, useUserStore, useNodeStore } from '@/stores';
 * 
 * // Use in component
 * const authStore = useAuthStore();
 * const { isLoggedIn } = storeToRefs(authStore);
 * ```
 * 
 * ## Store Architecture
 * 
 * ### Auth Store (auth.ts)
 * - Manages user authentication state and basic information
 * - Core store that coordinates with User and Tunnel stores during logout
 * - Implements retry logic for authentication checks
 * 
 * ### User Store (user.ts)
 * - Manages detailed user information (UserDetailInfo)
 * - Provides formatted getters for bandwidth, traffic, and registration time
 * - Handles user info loading and refreshing (after sign-in, CDK redemption)
 * 
 * ### Tunnel Store (tunnel.ts)
 * - Manages tunnel list and running status
 * - Maintains node name mappings for display
 * - Provides actions for starting, stopping, and refreshing tunnels
 * 
 * ### Node Store (node.ts)
 * - Manages node status and statistics
 * - Provides filtering and search capabilities
 * - Tracks node online status, load, and traffic
 * 
 * ### Settings Store (settings.ts)
 * - Manages application settings (AppSettings)
 * - Validates auto-start tunnel IDs against Tunnel Store
 * 
 * ### CreateTunnel Store (createTunnel.ts)
 * - Manages multi-step tunnel creation flow
 * - Tracks current page (node-selection | tunnel-config)
 * - Stores selected node for tunnel configuration
 * 
 * ### UI Store (ui.ts)
 * - Manages global UI state (theme, sidebar)
 * - Handles theme switching and persistence
 * 
 * ## Store Communication
 * 
 * - Auth Store → User Store: Clears user info on logout
 * - Auth Store → Tunnel Store: Clears tunnel data on logout
 * - Auth Store → Node Store: Clears node data on logout
 * - Settings Store → Tunnel Store: Validates auto-start tunnel IDs
 * 
 * ## Best Practices
 * 
 * 1. Use `storeToRefs()` when destructuring state/getters to maintain reactivity
 * 2. Actions can be destructured directly (already bound to store instance)
 * 3. Call stores at the top level in Setup Stores to avoid circular dependencies
 * 4. Use dynamic imports in actions when calling other stores (SSR compatibility)
 * 
 * @see {@link https://pinia.vuejs.org/core-concepts/ | Pinia Core Concepts}
 */

// Export all stores
export { useAuthStore } from './auth';
export { useUserStore } from './user';
export { useTunnelStore } from './tunnel';
export { useNodeStore } from './node';
export { useSettingsStore } from './settings';
export { useCreateTunnelStore } from './createTunnel';
export { useUIStore } from './ui';
export { useThemeStore } from './theme';
export { useWebuiStore } from './webui';
