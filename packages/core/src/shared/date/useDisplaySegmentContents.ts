/*
 * 12-hour display override for segment contents.
 * The shell stores 24h hour; this layers the 12h display form on top.
 */

import type { Ref } from 'vue'
import type { HourCycle, SegmentPart, SegmentValueObj } from './types'
import { computed } from 'vue'

export type DisplaySegment = { part: SegmentPart, value: string }

export type UseDisplaySegmentContentsProps = {
  segmentContents: Ref<DisplaySegment[]>
  segmentValues: Ref<SegmentValueObj>
  hourCycle: HourCycle
}

export function useDisplaySegmentContents(props: UseDisplaySegmentContentsProps): Ref<DisplaySegment[]> {
  return computed(() => {
    if (props.hourCycle !== 12)
      return props.segmentContents.value

    return props.segmentContents.value.map((segment) => {
      if (segment.part === 'hour' && 'hour' in props.segmentValues.value) {
        const hour = props.segmentValues.value.hour
        if (hour !== null) {
          const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
          return { ...segment, value: displayHour.toString() }
        }
      }
      return segment
    })
  })
}
