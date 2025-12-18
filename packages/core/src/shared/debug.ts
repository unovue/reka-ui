/* Lightweight debug logger for development diagnostics.
 * Enable logs by setting one of:
 * - window.localStorage.setItem('reka:debug', 'true')            // enable all
 * - window.localStorage.setItem('reka:debug', 'dl')              // enable DismissableLayer
 * - window.localStorage.setItem('reka:debug', 'dl,focus')        // enable multiple namespaces
 * You can also set (for SSR-less envs):
 *   (window as any).REKA_DEBUG = 'true' | 'dl,focus'
 */

function readDebugNamespaces(): string[] {
  try {
    // Prefer explicit global if present
    const anyWindow = globalThis as any
    const fromGlobal = typeof anyWindow?.REKA_DEBUG === 'string' ? anyWindow.REKA_DEBUG : undefined
    const raw: string = String(fromGlobal ?? (typeof window !== 'undefined' ? window.localStorage?.getItem('reka:debug') ?? '' : ''))
    if (!raw)
      return []
    if (raw === 'true' || raw === '*')
      return ['*']
    return raw
      .split(',')
      .map((s: string) => s.trim())
      .filter(Boolean)
  }
  catch {
    return []
  }
}

const cachedNs = readDebugNamespaces()

export function debugEnabled(ns: string): boolean {
  if (cachedNs.length === 0)
    return false
  if (cachedNs.includes('*'))
    return true
  return cachedNs.includes(ns)
}

export function elSummary(node: Node | null | undefined): string {
  if (!node)
    return 'null'
  if (node instanceof HTMLElement) {
    const id = node.id ? `#${node.id}` : ''
    const cls = node.className && typeof node.className === 'string'
      ? `.${node.className.split(/\s+/).filter(Boolean).join('.')}`
      : ''
    return `${node.tagName.toLowerCase()}${id}${cls}`
  }
  if (node instanceof Document)
    return 'Document'
  if (node instanceof ShadowRoot)
    return 'ShadowRoot'
  if (node instanceof DocumentFragment)
    return 'DocumentFragment'
  return String(node)
}

export function rootKind(root: Node | null | undefined): 'document' | 'shadow' | 'fragment' | 'unknown' {
  if (root instanceof Document)
    return 'document'
  // Treat true ShadowRoot and shadow-like fragments as shadow
  // Some environments may expose ShadowRoot as a DocumentFragment with a `host` property.
  if ((typeof ShadowRoot !== 'undefined' && root instanceof ShadowRoot) || (root instanceof DocumentFragment && (root as any).host))
    return 'shadow'
  if (root instanceof DocumentFragment)
    return 'fragment'
  return 'unknown'
}

export function debugLog(ns: string, message: string, details?: Record<string, unknown>): void {
  // Always log, per user request (no gating)
  // eslint-disable-next-line no-console
  console.log(`%c[reka][${ns}] ${message}`, 'color:#7c3aed', details ?? '')
}
