/*
 * Temporal API integration for reka-ui
 *
 * This module provides the Temporal API polyfill and re-exports
 * commonly used types and utilities for date handling.
 *
 * Users can either:
 * 1. Import 'temporal-polyfill/global' in their app entry point for global availability
 * 2. Import { Temporal } from 'temporal-polyfill' for tree-shaking
 * 3. Import from this module for convenience
 */

import { Temporal } from 'temporal-polyfill'

export { Temporal }
