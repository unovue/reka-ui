import type { RootNode } from './getRootNode'

let testOverride: boolean | undefined
/** Test-only: force/relax adopted-stylesheet support to exercise both branches. */
export function _setAdoptedSupportForTests(value: boolean | undefined): void {
  testOverride = value
}

/** Lazy (not a module const) so tests can drive both code paths. */
export function supportsAdoptedStyleSheets(): boolean {
  if (testOverride !== undefined)
    return testOverride
  return typeof CSSStyleSheet !== 'undefined'
    && typeof CSSStyleSheet.prototype.replaceSync === 'function'
    && typeof document !== 'undefined'
    && 'adoptedStyleSheets' in document
}

/**
 * Injects `css` into a `Document` or `ShadowRoot`. Uses `adoptedStyleSheets`
 * where supported (pierces the shadow boundary correctly), else a `<style>`
 * fallback (older Safari; also the branch jsdom exercises). Returns
 * `update`/`dispose`.
 */
export function injectStyle(root: RootNode, css: string, options: { nonce?: string } = {}) {
  if (supportsAdoptedStyleSheets()) {
    const sheet = new CSSStyleSheet()
    sheet.replaceSync(css)
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet]
    return {
      update: (next: string) => sheet.replaceSync(next),
      dispose: () => { root.adoptedStyleSheets = root.adoptedStyleSheets.filter(s => s !== sheet) },
    }
  }
  const isDoc = root.nodeType === Node.DOCUMENT_NODE
  const doc = isDoc ? root as Document : (root as ShadowRoot).ownerDocument
  const el = doc.createElement('style')
  if (options.nonce)
    el.nonce = options.nonce
  el.textContent = css
  const mount = isDoc ? (root as Document).head : root as ShadowRoot
  mount.appendChild(el)
  return { update: (next: string) => { el.textContent = next }, dispose: () => el.remove() }
}
