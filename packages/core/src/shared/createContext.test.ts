import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { createSSRApp, defineComponent, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { version } from '../../package.json'

type ContextModule = typeof import('./createContext')

/**
 * Load a fresh, independent copy of the context module, the way a second
 * install of reka-ui would be loaded next to the first one.
 */
async function loadCopy(): Promise<ContextModule> {
  vi.resetModules()
  return import('./createContext')
}

// v3's inject is typed `ContextValue | null` for an `any` fallback.
type ContextPair = readonly [(fallback?: any) => { value: number } | null, (value: { value: number }) => unknown]

/** Render a provider from one context pair with a child injecting from another. */
async function renderAcross(provider: ContextPair, injector: ContextPair) {
  let injected: { value: number } | null | undefined
  let error: unknown
  const Child = defineComponent({
    setup() {
      try {
        injected = injector[0]()
      }
      catch (e) {
        error = e
      }
      return () => h('div')
    },
  })
  const App = defineComponent({
    setup() {
      provider[1]({ value: 42 })
      return () => h(Child)
    },
  })
  await renderToString(createSSRApp(App))
  return { injected, error }
}

describe('createRekaContext', () => {
  it('shares contexts across two copies of the same version', async () => {
    const copyA = await loadCopy()
    const copyB = await loadCopy()
    expect(copyA).not.toBe(copyB)

    const { injected, error } = await renderAcross(
      copyA.createRekaContext<{ value: number }>('DialogRoot'),
      copyB.createRekaContext<{ value: number }>('DialogRoot'),
    )
    expect(error).toBeUndefined()
    expect(injected).toEqual({ value: 42 })
  })

  it('keys contexts by the exact package version', async () => {
    const { createRekaContext } = await loadCopy()
    const [injectFoo] = createRekaContext('Foo')
    expect(() => injectFoo()).toThrow(`Symbol(reka-ui@${version}:FooContext)`)
  })

  it('keeps contexts of different versions isolated', async () => {
    const copyA = await loadCopy()
    const copyB = await loadCopy()

    const { injected, error } = await renderAcross(
      copyA.createVersionedContext<{ value: number }>('2.10.0', 'DialogRoot'),
      copyB.createVersionedContext<{ value: number }>('2.11.0', 'DialogRoot'),
    )
    expect(injected).toBeUndefined()
    expect(String(error)).toContain('Symbol(reka-ui@2.11.0:DialogRootContext)')
  })

  it('keeps differently named contexts isolated', async () => {
    const { createRekaContext } = await loadCopy()
    const { error } = await renderAcross(
      createRekaContext<{ value: number }>('Alpha'),
      createRekaContext<{ value: number }>('Beta'),
    )
    expect(String(error)).toMatch(/not found/)
  })
})

describe('createContext (public)', () => {
  it('creates a unique key per call, even with the same name', async () => {
    const { createContext } = await loadCopy()
    const { injected, error } = await renderAcross(
      createContext<{ value: number }>('Foo'),
      createContext<{ value: number }>('Foo'),
    )
    expect(injected).toBeUndefined()
    expect(String(error)).toContain('Symbol(FooContext)')
  })

  it('does not collide with reka-ui internal contexts of the same name', async () => {
    const { createContext, createRekaContext } = await loadCopy()
    const { injected, error } = await renderAcross(
      createRekaContext<{ value: number }>('DialogRoot'),
      createContext<{ value: number }>('DialogRoot'),
    )
    expect(injected).toBeUndefined()
    expect(String(error)).toMatch(/not found/)
  })

  it('still provides and injects within one context', async () => {
    const { createContext } = await loadCopy()
    const pair = createContext<{ value: number }>('Foo')
    const { injected } = await renderAcross(pair, pair)
    expect(injected).toEqual({ value: 42 })
  })
})

describe('internal call sites', () => {
  const srcDir = join(__dirname, '..')
  const sources = readdirSync(srcDir, { recursive: true, encoding: 'utf8' })
    .filter(file => /\.(?:ts|vue)$/.test(file) && !/\.(?:test|story)\./.test(file) && !file.includes('createContext.ts'))
    .map(file => ({ file: relative(srcDir, join(srcDir, file)), text: readFileSync(join(srcDir, file), 'utf8') }))

  it('use createRekaContext, never the public createContext', () => {
    const offenders = sources.filter(({ text }) => /\bcreateContext\s*[<(]/.test(text)).map(({ file }) => file)
    expect(offenders).toEqual([])
  })

  // `createRekaContext` keys a context by its name alone (`Symbol.for`), so two call sites with the
  // same name would provide and inject each other's values.
  it('give every context its own key', () => {
    const keys = new Map<string, string[]>()
    for (const { file, text } of sources) {
      // The arguments of each call, after the (possibly nested, multi-line) type argument
      for (const match of text.matchAll(/\bcreateRekaContext\b/g)) {
        let i = match.index + match[0].length
        if (text[i] === '<') {
          for (let depth = 1, j = i + 1; j < text.length; j++) {
            if (text[j] === '<')
              depth++
            else if (text[j] === '>' && text[j - 1] !== '=' && --depth === 0) {
              i = j + 1
              break
            }
          }
        }
        if (text[i] !== '(')
          continue
        const args = text.slice(i + 1, text.indexOf(')', i))
        // A name built at runtime (Popper's scoped contexts) is keyed by its scope
        if (args.includes('`'))
          continue
        const [, names, contextName] = args.match(/^\s*\[([^\]]*)\]\s*(?:,\s*'([^']*)')?/) ?? []
        const strings = [...args.matchAll(/'([^']*)'/g)].map(m => m[1])
        const key = names !== undefined
          ? contextName ?? [...names.matchAll(/'([^']*)'/g)].map(m => m[1]).join('/')
          : strings[1] ?? `${strings[0]}Context`
        keys.set(key, [...keys.get(key) ?? [], file])
      }
    }
    expect(keys.size).toBeGreaterThan(100)
    expect([...keys].filter(([, files]) => files.length > 1)).toEqual([])
  })
})
