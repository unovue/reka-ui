import type { AcceptableValue } from '@/shared/types'

export const OPEN_KEYS = [' ', 'Enter', 'ArrowUp', 'ArrowDown']
export const SELECTION_KEYS = [' ', 'Enter']
export const CONTENT_MARGIN = 10

export function shouldShowPlaceholder(value?: AcceptableValue | AcceptableValue[]): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)
}
