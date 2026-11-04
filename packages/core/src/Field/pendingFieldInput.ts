/**
 * A value change a control made itself (typing, a step, a calendar pick),
 * waiting to arrive through its model so the field can report it as user
 * input rather than programmatic. A controlled parent applies it on its next
 * render, or never, when it rejects the change: an entry that hasn't arrived
 * once the current task's renders have run is dropped, so a later
 * parent-driven change to the same value isn't mistaken for it.
 * @internal
 */
export function createPendingFieldInput<T>() {
  let pending: { value: T } | undefined
  return {
    /** Records a change the control made, whose model update is on its way. */
    set(value: T) {
      const entry = { value }
      pending = entry
      setTimeout(() => {
        if (pending === entry)
          pending = undefined
      })
    },
    /** The recorded change, if any, cleared. */
    take() {
      const entry = pending
      pending = undefined
      return entry
    },
  }
}

/**
 * Whether a change came from code (`setModelValue` and the like default to
 * `'imperative-action'`) rather than from the control's own parts, so a
 * segmented field records only its segment edits as pending input.
 * @internal
 */
export function isProgrammaticChange(reason: string) {
  return reason === 'imperative-action' || reason === 'none'
}
