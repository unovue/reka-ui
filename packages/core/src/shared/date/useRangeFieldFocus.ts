/*
 * Range field focus traversal across two shells.
 * The start/end type attribute disambiguates the same part on both sides.
 */

import type { Ref } from 'vue'
import type { Direction } from '@/shared/types'
import { computed, ref } from 'vue'
import { useKbd } from '@/shared'
import { isSegmentNavigationKey } from '@/shared/date'

export type UseRangeFieldFocusProps = {
  segmentElements: Ref<Set<HTMLElement>>
  segmentAttribute: string
  rangeSegmentTypeAttribute: string
  dir: Ref<Direction>
}

export type RangeFieldFocusReturn = {
  setFocusedElement: (el: HTMLElement) => void
  focusNext: () => void
  handleKeydown: (e: KeyboardEvent) => void
}

export function useRangeFieldFocus(props: UseRangeFieldFocusProps): RangeFieldFocusReturn {
  const currentFocusedElement = ref<HTMLElement | null>(null)

  const currentSegmentIndex = computed(() => Array.from(props.segmentElements.value).findIndex(el =>
    el.getAttribute(props.segmentAttribute) === currentFocusedElement.value?.getAttribute(props.segmentAttribute)
    && el.getAttribute(props.rangeSegmentTypeAttribute) === currentFocusedElement.value?.getAttribute(props.rangeSegmentTypeAttribute)))

  const nextFocusableSegment = computed(() => {
    const sign = props.dir.value === 'rtl' ? -1 : 1
    const nextCondition = sign < 0 ? currentSegmentIndex.value < 0 : currentSegmentIndex.value > props.segmentElements.value.size - 1
    if (nextCondition)
      return null
    return Array.from(props.segmentElements.value)[currentSegmentIndex.value + sign] ?? null
  })

  const prevFocusableSegment = computed(() => {
    const sign = props.dir.value === 'rtl' ? -1 : 1
    const prevCondition = sign > 0 ? currentSegmentIndex.value < 0 : currentSegmentIndex.value > props.segmentElements.value.size - 1
    if (prevCondition)
      return null
    return Array.from(props.segmentElements.value)[currentSegmentIndex.value - sign] ?? null
  })

  const kbd = useKbd()

  function handleKeydown(e: KeyboardEvent) {
    // IME owns arrow keys for candidate navigation mid-composition
    if (e.isComposing)
      return
    if (!isSegmentNavigationKey(e.key))
      return
    if (e.key === kbd.ARROW_LEFT)
      prevFocusableSegment.value?.focus()
    if (e.key === kbd.ARROW_RIGHT)
      nextFocusableSegment.value?.focus()
  }

  function setFocusedElement(el: HTMLElement) {
    currentFocusedElement.value = el
  }

  function focusNext() {
    // Auto-advance follows DOM (locale format) order; arrow navigation is directional.
    Array.from(props.segmentElements.value)[currentSegmentIndex.value + 1]?.focus()
  }

  return { setFocusedElement, focusNext, handleKeydown }
}
