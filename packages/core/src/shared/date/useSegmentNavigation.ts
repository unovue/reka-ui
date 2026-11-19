import type { Ref } from 'vue'
import type { Direction } from '@/shared/types'
import { computed } from 'vue'

export interface UseSegmentNavigationProps {
  /** The editable segment elements of the field, in DOM order */
  segmentElements: Ref<Set<HTMLElement>>
  /** The segment element that currently holds focus, if any */
  currentFocusedElement: Ref<HTMLElement | null>
  /** The writing direction of the field */
  dir: Ref<Direction>
  /** The data attributes that together identify a segment element within the field */
  segmentAttributes: string[]
}

export function useSegmentNavigation({ segmentElements, currentFocusedElement, dir, segmentAttributes }: UseSegmentNavigationProps) {
  const currentSegmentIndex = computed(() =>
    Array.from(segmentElements.value).findIndex(el =>
      segmentAttributes.every(attribute =>
        el.getAttribute(attribute) === currentFocusedElement.value?.getAttribute(attribute))))

  const nextFocusableSegment = computed(() => {
    const sign = dir.value === 'rtl' ? -1 : 1
    const nextCondition = sign < 0 ? currentSegmentIndex.value < 0 : currentSegmentIndex.value > segmentElements.value.size - 1
    if (nextCondition)
      return null
    const segmentToFocus = Array.from(segmentElements.value)[currentSegmentIndex.value + sign]
    return segmentToFocus
  })

  const prevFocusableSegment = computed(() => {
    const sign = dir.value === 'rtl' ? -1 : 1
    const prevCondition = sign > 0 ? currentSegmentIndex.value < 0 : currentSegmentIndex.value > segmentElements.value.size - 1
    if (prevCondition)
      return null

    const segmentToFocus = Array.from(segmentElements.value)[currentSegmentIndex.value - sign]
    return segmentToFocus
  })

  function focusNext() {
    // Auto-advance follows the segments' DOM order (the locale's format
    // order) regardless of writing direction; only arrow-key navigation is
    // direction-aware via nextFocusableSegment/prevFocusableSegment.
    Array.from(segmentElements.value)[currentSegmentIndex.value + 1]?.focus()
  }

  return {
    currentSegmentIndex,
    nextFocusableSegment,
    prevFocusableSegment,
    focusNext,
  }
}
