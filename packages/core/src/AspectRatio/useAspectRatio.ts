import type { ComputedRef, MaybeRefOrGetter } from 'vue'
import type { PartSurface } from '@/shared'
import { computed, toValue } from 'vue'
import { createPartSurface } from '@/shared'

export interface UseAspectRatioProps {
  /** The desired ratio, e.g. `16 / 9`. Defaults to `1`. */
  ratio?: MaybeRefOrGetter<number | undefined>
}

export interface UseAspectRatioReturn {
  /** The ratio as a bottom padding percentage (`1 / ratio * 100`). */
  aspect: ComputedRef<number>
  /** The sizing wrapper (`position: relative` + bottom padding). */
  wrapper: PartSurface
  /** The element filling the wrapper (`position: absolute; inset: 0`). */
  root: PartSurface
}

/**
 * Headless AspectRatio logic: bind `wrapper.attrs` on an outer element and
 * `root.attrs` on the element inside it.
 *
 * @experimental Signatures may change in 3.x minors.
 * @lifecycle pure
 */
export function useAspectRatio(props: UseAspectRatioProps = {}): UseAspectRatioReturn {
  const aspect = computed(() => (1 / (toValue(props.ratio) ?? 1)) * 100)
  return {
    aspect,
    wrapper: createPartSurface(() => ({
      'style': `position: relative; width: 100%; padding-bottom: ${aspect.value}%`,
      'data-reka-aspect-ratio-wrapper': '',
    }), () => ({})),
    root: createPartSurface(() => ({ style: 'position: absolute; inset: 0px' }), () => ({})),
  }
}
