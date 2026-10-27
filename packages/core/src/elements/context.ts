/**
 * Parent lookup between Reka elements, over the Context Community Protocol
 * (https://github.com/webcomponents-cg/community-protocols/blob/main/proposals/context.md).
 *
 * - An element asks for its parent with a `context-request` event (bubbling,
 *   composed, so it crosses shadow roots). The nearest Reka element above it
 *   answers and stops the event.
 * - An element upgraded after elements below it already resolved a parent (or found
 *   none) announces itself with a `context-provider` event; the providers above it
 *   and the document-level registry of orphans make those elements ask again.
 *
 * Nothing here depends on `instanceof` or on tag names, so two copies of the
 * library on one page (and elements under any prefix) find each other, and an
 * undefined ancestor is simply skipped instead of waited for.
 */

/** The context key: shared between copies of the library through the global symbol registry. */
export const PARENT_CONTEXT = Symbol.for('reka-ui.elements.parent')

export type ContextCallback<T> = (value: T, unsubscribe?: () => void) => void

export class ContextRequestEvent<T> extends Event {
  constructor(
    readonly context: unknown,
    readonly contextTarget: Element,
    readonly callback: ContextCallback<T>,
    readonly subscribe?: boolean,
  ) {
    super('context-request', { bubbles: true, composed: true })
  }
}

export class ContextProviderEvent extends Event {
  constructor(readonly context: unknown, readonly contextTarget: Element) {
    super('context-provider', { bubbles: true, composed: true })
  }
}

declare global {
  interface HTMLElementEventMap {
    'context-request': ContextRequestEvent<unknown>
    'context-provider': ContextProviderEvent
  }
}

/** State shared by every copy of `reka-ui/elements` loaded in the page. */
interface ElementsRegistry {
  /** Element app counter: each app gets its own `useId` prefix. */
  appUid: number
  /** Elements no provider answered, with how to make them ask again. */
  orphans: Map<Element, () => void>
  /** Elements whose app is mounted or waiting for its parent. */
  live: WeakSet<Element>
  /** Documents with the `context-provider` listener for orphans. */
  documents: WeakSet<Document>
}

const REGISTRY = Symbol.for('reka-ui.elements.registry')

export function getRegistry(): ElementsRegistry {
  const global = globalThis as { [REGISTRY]?: ElementsRegistry }
  return global[REGISTRY] ??= {
    appUid: 0,
    orphans: new Map(),
    live: new WeakSet(),
    documents: new WeakSet(),
  }
}

/** `ancestor` contains `node`, looking through shadow roots. */
export function composedContains(ancestor: Node, node: Node): boolean {
  let current: Node | null = node
  while (current) {
    if (current === ancestor)
      return true
    current = current.parentNode ?? (current instanceof ShadowRoot ? current.host : null)
  }
  return false
}

function onProviderAtRoot(event: ContextProviderEvent) {
  if (event.context !== PARENT_CONTEXT)
    return
  const provider = event.contextTarget
  for (const [orphan, retry] of [...getRegistry().orphans]) {
    if (orphan !== provider && composedContains(provider, orphan))
      retry()
  }
}

/** Installs the document-level listener that hands orphans to a late provider. */
export function ensureContextRoot(doc: Document) {
  const registry = getRegistry()
  if (registry.documents.has(doc))
    return
  registry.documents.add(doc)
  doc.addEventListener('context-provider', onProviderAtRoot as EventListener)
}

/**
 * Asks for the parent of `el`. Returns the answer, or `null` when no provider
 * answered (the request reached the document).
 */
export function requestParent<T>(el: Element): T | null {
  let parent: T | null = null
  el.dispatchEvent(new ContextRequestEvent<T>(PARENT_CONTEXT, el, (value) => {
    parent = value
  }))
  return parent
}

/**
 * Whether `el` should announce itself as a late provider: some Reka element below
 * it is already live, so it resolved its parent (or found none) before `el` was
 * upgraded. Elements upgrade in tree order, so this is false on the common path.
 */
export function hasLiveDescendants(el: Element): boolean {
  const registry = getRegistry()
  for (const node of el.querySelectorAll('*')) {
    if (registry.live.has(node))
      return true
  }
  return false
}
