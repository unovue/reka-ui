import type { MaybeRefOrGetter } from 'vue'
import type { PartSurface } from '@/shared'
import { toValue } from 'vue'
import { createPartSurface } from '@/shared'

export interface UseLabelProps {
  /** The id of the element the label is associated with. */
  for?: MaybeRefOrGetter<string | undefined>
}

export interface UseLabelReturn {
  /** The label surface: `for` plus the double-click text-selection guard. */
  root: PartSurface
}

function onMousedown(event: MouseEvent) {
  // prevent text selection when double clicking label
  if (!event.defaultPrevented && event.detail > 1)
    event.preventDefault()
}

/**
 * Headless Label logic: bind `root.attrs` on a `<label>` (or any element).
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useLabel(props: UseLabelProps = {}): UseLabelReturn {
  return {
    root: createPartSurface(() => ({ for: toValue(props.for), onMousedown }), () => ({})),
  }
}
