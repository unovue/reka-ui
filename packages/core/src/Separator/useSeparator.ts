import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { PartSurface } from '@/shared'
import type { DataOrientation } from '@/shared/types'
import { computed, toValue } from 'vue'
import { createPartSurface } from '@/shared'

export type SeparatorState = { orientation: DataOrientation }

export interface UseSeparatorProps {
  /** `'horizontal'` (default) or `'vertical'`; any other value falls back to `'horizontal'`. */
  orientation?: MaybeRefOrGetter<DataOrientation | undefined>
  /** When `true`, the separator is purely visual and removed from the accessibility tree. */
  decorative?: MaybeRefOrGetter<boolean | undefined>
}

export interface UseSeparatorReturn {
  orientation: ComputedRef<DataOrientation>
  root: PartSurface<SeparatorState>
}

/**
 * Headless Separator logic: bind `root.attrs` on any element.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useSeparator(props: UseSeparatorProps = {}): UseSeparatorReturn {
  const orientation = computed<DataOrientation>(() =>
    toValue(props.orientation) === 'vertical' ? 'vertical' : 'horizontal',
  )
  const root = createPartSurface<SeparatorState>(
    () => toValue(props.decorative)
      ? { role: 'none' }
      // `aria-orientation` defaults to `horizontal`, so it is only set when vertical.
      : { 'aria-orientation': orientation.value === 'vertical' ? 'vertical' : undefined, 'role': 'separator' },
    () => ({ orientation: orientation.value }),
  )
  return { orientation, root }
}
