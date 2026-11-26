/**
 * One `MutationObserver` for every element a component family observes with the same options,
 * instead of one per instance. Each observed element keeps its own callback, called once per
 * batch of records under it (or under an observed ancestor of it).
 *
 * A `MutationObserver` can't stop observing a single element: `unobserve` drops its callback, and
 * a removed element is released with it, as observers hold their targets weakly.
 *
 * @internal
 */
export class SharedMutationObserver {
  private observer: MutationObserver | undefined
  private readonly callbacks = new WeakMap<Node, () => void>()

  constructor(private readonly init: MutationObserverInit) {}

  observe(element: Node, callback: () => void): void {
    if (typeof MutationObserver === 'undefined')
      return
    this.callbacks.set(element, callback)
    ;(this.observer ??= new MutationObserver(records => this.notify(records))).observe(element, this.init)
  }

  unobserve(element: Node): void {
    this.callbacks.delete(element)
  }

  private notify(records: MutationRecord[]): void {
    const pending = new Set<() => void>()
    for (const record of records) {
      for (let node: Node | null = record.target; node; node = node.parentNode) {
        const callback = this.callbacks.get(node)
        if (callback)
          pending.add(callback)
      }
    }
    pending.forEach(callback => callback())
  }
}

/** The element a vnode rendered (`vnode.el`), when it is one: for a vnode hook (`@vue:mounted`). @internal */
export function vnodeElement(vnode: { el: unknown }): HTMLElement | undefined {
  const el = vnode.el as Node | null
  return el && el.nodeType === 1 ? el as HTMLElement : undefined
}
