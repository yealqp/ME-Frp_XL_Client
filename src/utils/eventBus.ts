/**
 * Event Bus
 * 
 * Global reactive state for cross-component communication.
 * Used for syncing state between stores and components.
 */

import { ref } from 'vue';

/**
 * Global reactive reference for ad display state
 * Synced with Settings Store and UI Store
 */
export const showAdGlobal = ref<boolean>(true);
