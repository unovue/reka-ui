// `useBodyScrollLock` and every `DismissableLayer` with
// `disableOutsidePointerEvents` lock `body.style.pointerEvents` through this
// shared, ref-counted owner, in whatever order they come and go (#2784, #2867).
interface BodyPointerEventsLock {
  owners: Set<unknown>
  original: string
}

const locks = new WeakMap<Document, BodyPointerEventsLock>()

/**
 * Adds `owner` to the body `pointer-events` lock of `doc` and sets it to `none`.
 * The first owner saves the body's current inline value.
 */
export function acquireBodyPointerEvents(doc: Document, owner: unknown) {
  let lock = locks.get(doc)
  if (!lock) {
    lock = { owners: new Set(), original: doc.body.style.pointerEvents }
    locks.set(doc, lock)
  }
  lock.owners.add(owner)
  doc.body.style.pointerEvents = 'none'
}

/**
 * Removes `owner` from the lock of `doc`; the last owner out restores the saved
 * value. Releasing an owner that never acquired is a no-op.
 */
export function releaseBodyPointerEvents(doc: Document, owner: unknown) {
  const lock = locks.get(doc)
  if (!lock?.owners.delete(owner))
    return
  if (lock.owners.size === 0) {
    locks.delete(doc)
    doc.body.style.pointerEvents = lock.original
  }
}
