import { afterEach, describe, expect, it } from 'vitest'
import { _setAdoptedSupportForTests, injectStyle } from './injectStyle'

afterEach(() => _setAdoptedSupportForTests(undefined))

describe('injectStyle — <style> fallback (no adoptedStyleSheets)', () => {
  it('injects a <style> into the document head and disposes it', () => {
    _setAdoptedSupportForTests(false)
    const handle = injectStyle(document, '*{cursor:grabbing!important}')
    const style = document.head.querySelector('style')
    expect(style?.textContent).toContain('grabbing')
    handle.dispose()
    expect(document.head.querySelector('style')).toBeNull()
  })

  it('injects into a shadow root (not the document) and threads nonce', () => {
    _setAdoptedSupportForTests(false)
    const host = document.createElement('div')
    document.body.appendChild(host)
    const sr = host.attachShadow({ mode: 'open' })
    const handle = injectStyle(sr, '*{cursor:col-resize!important}', { nonce: 'n1' })
    const style = sr.querySelector('style')
    expect(style?.textContent).toContain('col-resize')
    expect(style?.getAttribute('nonce')).toBe('n1')
    expect(document.head.querySelector('style')).toBeNull()
    handle.dispose()
    host.remove()
  })

  it('update() replaces the css', () => {
    _setAdoptedSupportForTests(false)
    const handle = injectStyle(document, 'a{}')
    handle.update('b{}')
    expect(document.head.querySelector('style')?.textContent).toBe('b{}')
    handle.dispose()
  })
})

describe('injectStyle — adoptedStyleSheets path (polyfilled)', () => {
  // Minimal per-suite polyfill (accessor + per-instance WeakMap), so the adopted
  // path's bookkeeping is assertable. Real cascade behavior needs a browser.
  const sheets = new WeakMap<object, string>()
  let installed = false
  function installPolyfill() {
    if (installed)
      return
    installed = true
    // @ts-expect-error test polyfill
    globalThis.CSSStyleSheet ??= class {}
    if (!('replaceSync' in CSSStyleSheet.prototype)) {
      // @ts-expect-error test polyfill
      CSSStyleSheet.prototype.replaceSync = function (css: string) { sheets.set(this, css) }
    }
    for (const proto of [Document.prototype, ShadowRoot.prototype]) {
      if (!Object.getOwnPropertyDescriptor(proto, 'adoptedStyleSheets')) {
        const store = new WeakMap<object, any[]>()
        Object.defineProperty(proto, 'adoptedStyleSheets', {
          configurable: true,
          get() { return store.get(this) ?? [] },
          set(v) { store.set(this, v) },
        })
      }
    }
  }

  it('adopts a constructed sheet and disposes it', () => {
    installPolyfill()
    _setAdoptedSupportForTests(true)
    const handle = injectStyle(document, '*{cursor:grabbing}')
    expect(document.adoptedStyleSheets.length).toBe(1)
    handle.dispose()
    expect(document.adoptedStyleSheets.length).toBe(0)
  })
})
