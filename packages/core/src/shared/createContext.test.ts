import { describe, expect, it } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createContext } from './createContext'

describe('createContext', () => {
  // Two independent `createContext()` calls with the same name simulate the
  // library being installed twice (e.g. a version mismatch duplicated by npm).
  // With a module-local `Symbol()` the two keys differ and injection fails
  // (`Injection Symbol(...) not found`, #229); with the global registry
  // (`Symbol.for`) they share identity and provide/inject keeps working.
  it('resolves provide/inject across separate instances with the same name', async () => {
    const [, provideFoo] = createContext<{ value: number }>('Foo') // "copy A"
    const [injectFoo] = createContext<{ value: number }>('Foo') // "copy B"

    const Child = defineComponent({
      setup() {
        const ctx = injectFoo()
        return () => h('div', String(ctx.value))
      },
    })
    const App = defineComponent({
      setup() {
        provideFoo({ value: 42 })
        return () => h(Child)
      },
    })

    const html = await renderToString(createSSRApp(App))
    expect(html).toContain('42')
  })

  it('keeps distinct contexts isolated (different names do not collide)', async () => {
    const [, provideA] = createContext<{ n: number }>('Alpha')
    const [injectB] = createContext<{ n: number }>('Beta')

    const Child = defineComponent({
      setup() {
        // Beta was never provided -> injecting it must throw, not pick up Alpha.
        expect(() => injectB()).toThrow(/not found/)
        return () => h('div', 'ok')
      },
    })
    const App = defineComponent({
      setup() {
        provideA({ n: 1 })
        return () => h(Child)
      },
    })

    const html = await renderToString(createSSRApp(App))
    expect(html).toContain('ok')
  })
})
