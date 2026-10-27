import type { AcceptableValue } from '@/shared/types'

// `compare` / `valueComparator` moved to `@/shared/compare` (#2824); re-exported so existing imports keep working.
export { compare, valueComparator } from '@/shared'

export const OPEN_KEYS = [' ', 'Enter', 'ArrowUp', 'ArrowDown']
export const SELECTION_KEYS = [' ', 'Enter']
export const CONTENT_MARGIN = 10

export function shouldShowPlaceholder(value?: AcceptableValue | AcceptableValue[]): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
}
