/** Set on an element while its part is not rendered (closed content, inactive tab, …). */
export const UNMOUNTED_ATTR = 'data-reka-unmounted'

const BASE_CSS = `[${UNMOUNTED_ATTR}]{display:none!important}`

const sheets = new WeakMap<Document, CSSStyleSheet>()
const styled = new WeakSet<Document | ShadowRoot>()

function supportsAdoptedSheets(root: Document | ShadowRoot) {
  return 'adoptedStyleSheets' in root && typeof CSSStyleSheet === 'function' && 'replaceSync' in CSSStyleSheet.prototype
}

/**
 * Adds the one rule elements need, hiding a part that is not rendered, to the
 * document or shadow root the element lives in. `!important` wins over a consumer's
 * `display` on the element, which a plain `hidden` attribute would not.
 */
export function ensureBaseStyles(node: Node) {
  const root = node.getRootNode()
  if (!(root instanceof Document) && !(root instanceof ShadowRoot))
    return
  if (styled.has(root))
    return
  styled.add(root)
  const doc = root instanceof Document ? root : root.ownerDocument
  if (supportsAdoptedSheets(root)) {
    let sheet = sheets.get(doc)
    if (!sheet) {
      sheet = new CSSStyleSheet()
      sheet.replaceSync(BASE_CSS)
      sheets.set(doc, sheet)
    }
    root.adoptedStyleSheets = [...root.adoptedStyleSheets, sheet]
    return
  }
  const style = doc.createElement('style')
  style.textContent = BASE_CSS
  if (root instanceof Document)
    root.head.append(style)
  else
    root.append(style)
}
