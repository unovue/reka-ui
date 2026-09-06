// `compare` / `valueComparator` moved to `@/shared/compare` (#2824); re-exported so existing imports keep working.
export { compare, valueComparator } from '@/shared'

export function queryCheckedElement(parentEl: HTMLElement | null) {
  return parentEl?.querySelector('[data-state=checked]') as HTMLElement | null
}
