/**
 * Whether a change came from code rather than from the user: the setters a
 * control exposes (`setModelValue`, `onAddValue`, a context's writable
 * `modelValue`, …) default to `'imperative-action'`, and `'none'` is a
 * model's initial state. Every reason a control's own parts report is the
 * user's.
 *
 * This is the one rule every Field control follows: a change it commits is
 * reported as input (dirty, on-change validation, a server error cleared)
 * unless its reason is programmatic, decided when the change commits. A
 * parent-driven `v-model` change never commits through the control, so its
 * model watcher only reports `filled`.
 * @internal
 */
export function isProgrammaticChange(reason: string) {
  return reason === 'imperative-action' || reason === 'none'
}

/**
 * A user change a control committed (typing, a step, a calendar pick),
 * waiting to arrive through its model: for a control whose validity is read
 * from an element rendered from the model (a hidden native input), so it is
 * reported once that element is current. A controlled parent applies the
 * change on its next render, or never, when it rejects it: an entry that
 * hasn't arrived once the current task's renders have run is dropped, so a
 * later parent-driven change to the same value isn't mistaken for it.
 * @internal
 */
export function createPendingFieldInput<T>() {
  let pending: { value: T } | undefined
  return {
    /**
     * Records a change the control committed, from its `onUpdate`. A
     * programmatic one (see `isProgrammaticChange`) isn't recorded: it
     * arrives as any parent-driven change does.
     */
    record(value: T, details: { reason: string }) {
      if (isProgrammaticChange(details.reason))
        return
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
