// `useBodyScrollLock` and every `DismissableLayer` with
// `disableOutsidePointerEvents` lock `body.style.pointerEvents`. They share
// this ref-counted owner so that the first acquirer saves the page's own value
// and only the last release restores it, in whatever order they come and go
// (#2784, #2867).
interface BodyPointerEventsLock {
  owners: Set<unknown>
  original: string
}

const locks = new WeakMap<Document, BodyPointerEventsLock>()

export function acquireBodyPointerEvents(doc: Document, owner: unknown) {
  let lock = locks.get(doc)
  if (!lock) {
    lock = { owners: new Set(), original: doc.body.style.pointerEvents }
    locks.set(doc, lock)
  }
  lock.owners.add(owner)
  doc.body.style.pointerEvents = 'none'
}

export function releaseBodyPointerEvents(doc: Document, owner: unknown) {
  const lock = locks.get(doc)
  if (!lock?.owners.delete(owner))
    return
  if (lock.owners.size === 0) {
    locks.delete(doc)
    doc.body.style.pointerEvents = lock.original
  }
}
