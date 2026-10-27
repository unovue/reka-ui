import type { Color } from './types'
import { nextTick } from 'vue'
import { isEqualColor } from './isEqualColor'

export interface ChangeEndTracker {
  /** Record an accepted change from `previous` to `next` within the current interaction. */
  record: (previous: Color, next: Color) => void
  /** Drop the current interaction without reporting it. */
  discard: () => void
  /** End the current interaction; reports it through `onChangeEnd` when it changed the model. */
  commit: () => void
}

/**
 * Shared `changeEnd` bookkeeping for the color family. An interaction reports its last
 * color only when the model holds that color and it differs from the color the
 * interaction started from, so a drag back to the start and a change a controlled
 * parent rejected report nothing. A controlled parent applies an update when it
 * re-renders, so the check waits a tick when the model has not caught up yet.
 * @internal
 */
export function createChangeEndTracker(options: {
  current: () => Color
  isControlled: () => boolean
  onChangeEnd: (color: Color) => void
}): ChangeEndTracker {
  let pending: { start: Color, last: Color } | undefined

  function finish(start: Color, last: Color) {
    const current = options.current()
    if (isEqualColor(current, last) && !isEqualColor(current, start))
      options.onChangeEnd(last)
  }

  return {
    record(previous, next) {
      if (pending)
        pending.last = next
      else
        pending = { start: previous, last: next }
    },
    discard() {
      pending = undefined
    },
    commit() {
      if (!pending)
        return
      const { start, last } = pending
      pending = undefined
      if (options.isControlled() && !isEqualColor(options.current(), last))
        nextTick(() => finish(start, last))
      else
        finish(start, last)
    },
  }
}
