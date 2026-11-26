// Loads the packed reka-ui the way a Node consumer does. `run.mjs` unpacks the tarball into
// ./node_modules/reka-ui first, so every import below goes through the published `exports` and
// only reaches files that are really in the package. Run it through `pnpm package:check`.
/* eslint-disable no-console, node/prefer-global/process, antfu/no-top-level-await */
import { existsSync, readFileSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, resolve } from 'node:path'

const here = import.meta.dirname
const core = resolve(here, '..')
const packed = resolve(here, 'node_modules/reka-ui')
const require = createRequire(import.meta.url)
const pkg = JSON.parse(readFileSync(resolve(packed, 'package.json'), 'utf8'))

let failed = 0
function check(ok, what) {
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${what}`)
  if (!ok)
    failed++
}
function diff(actual, expected) {
  const missing = expected.filter(name => !actual.includes(name))
  const extra = actual.filter(name => !expected.includes(name))
  return { same: !missing.length && !extra.length, text: [missing.length && `missing ${missing.join(', ')}`, extra.length && `unexpected ${extra.join(', ')}`].filter(Boolean).join('; ') }
}
async function message(load) {
  try {
    await load()
    return 'loaded without an error'
  }
  catch (e) {
    return e.message
  }
}

// --- Runtime export names of a source entry, read from the repo's TypeScript ---
function sourceFile(from, specifier) {
  const base = resolve(dirname(from), specifier)
  return [base, `${base}.ts`, resolve(base, 'index.ts')].find(file => existsSync(file) && statSync(file).isFile())
}
const COMMENTS = /\/\*[\s\S]*?\*\/|^\s*\/\/.*$/gm
const EXPORT_ALL = /^export \* from '([^']+)'/gm
const EXPORT_LIST = /^export \{([^}]*)\}/gm
const EXPORT_DECLARATION = /^export (?:declare )?(?:async )?(?:const|let|function\*?|class|enum) (\w+)/gm
const EXPORT_DEFAULT = /^export default /m
const AS = /\s+as\s+/
function sourceExports(file, top = true) {
  const code = readFileSync(file, 'utf8').replace(COMMENTS, '')
  const names = new Set()
  for (const [, specifier] of code.matchAll(EXPORT_ALL)) {
    const target = sourceFile(file, specifier)
    if (!target)
      throw new Error(`${file}: cannot follow export * from '${specifier}'`)
    sourceExports(target, false).forEach(name => names.add(name))
  }
  for (const [, list] of code.matchAll(EXPORT_LIST)) {
    for (const item of list.split(',').map(s => s.trim()).filter(Boolean)) {
      if (!item.startsWith('type '))
        names.add(item.split(AS).pop())
    }
  }
  for (const [, name] of code.matchAll(EXPORT_DECLARATION))
    names.add(name)
  if (top && EXPORT_DEFAULT.test(code))
    names.add('default')
  // `export *` does not pass a default export on
  if (!top)
    names.delete('default')
  return [...names]
}
// What `require()` adds on top of the named exports, depending on the Node version
const keys = mod => Object.keys(mod).filter(key => key !== '__esModule' && key !== 'module.exports')

// --- Everything package.json points to is in the package ---
const targets = new Set([pkg.main, pkg.module, pkg.types])
for (const [entry, conditions] of Object.entries(pkg.exports)) {
  for (const [condition, file] of Object.entries(typeof conditions === 'string' ? { default: conditions } : conditions)) {
    targets.add(file)
    // No `types` condition on these: TypeScript reads the declaration next to the file it resolved
    if (entry !== './vapor' && condition !== 'types' && /\.[cm]?js$/.test(file))
      targets.add(file.replace(/\.([cm]?)js$/, '.d.$1ts'))
  }
}
for (const files of Object.values(pkg.typesVersions['*']))
  files.forEach(file => targets.add(file))
const absent = [...targets].filter(file => !existsSync(resolve(packed, file)))
check(!absent.length, `the ${targets.size} files that main, module, types, typesVersions and exports name (and their declarations) are packed${absent.length ? ` (missing ${absent.join(', ')})` : ''}`)

// --- Named exports of every entry, through import() and require() ---
const SOURCES = {
  '.': 'src/index.ts',
  './internal': 'src/internal.ts',
  './date': 'src/date/index.ts',
  './agent': 'src/agent/index.ts',
  './constant': 'constant/index.ts',
}
const loaded = {}
for (const [entry, source] of Object.entries(SOURCES)) {
  const id = `reka-ui${entry.slice(1)}`
  const expected = sourceExports(resolve(core, source))
  const esm = await import(id)
  const cjs = require(id)
  loaded[entry] = { esm, cjs }
  for (const [kind, mod] of [['import()', esm], ['require()', cjs]]) {
    const result = diff(keys(mod), expected)
    check(result.same, `${id}: ${kind} has the ${expected.length} exports of ${source}${result.same ? '' : ` (${result.text})`}`)
  }
}

// Every name the resolver, the Nuxt module and the namespaced entry hand out has to exist in `reka-ui`
const { components, utilities } = loaded['./constant'].esm
const listed = [...Object.values(components), ...Object.values(utilities)].flat()
for (const [kind, mod] of [['import()', loaded['.'].esm], ['require()', loaded['.'].cjs]]) {
  const unknown = listed.filter(name => mod[name] === undefined)
  check(listed.length > 300 && !unknown.length, `reka-ui: ${kind} exports all ${listed.length} names listed in reka-ui/constant${unknown.length ? ` (missing ${unknown.join(', ')})` : ''}`)
}

// --- reka-ui/namespaced: same grouping as packages/plugins/src/namespaced/generate.ts ---
const excluded = ['configProvider', 'primitive', 'visuallyHidden']
const groups = Object.keys(components).filter(group => !excluded.includes(group))
const pascal = group => group.charAt(0).toUpperCase() + group.slice(1)
for (const [kind, namespaced, root] of [['import()', await import('reka-ui/namespaced'), loaded['.'].esm], ['require()', require('reka-ui/namespaced'), loaded['.'].cjs]]) {
  const result = diff(keys(namespaced), groups.map(pascal))
  check(result.same, `reka-ui/namespaced: ${kind} has the ${groups.length} component groups${result.same ? '' : ` (${result.text})`}`)
  const wrong = []
  for (const group of groups) {
    const key = pascal(group)
    const parts = components[group].map(name => [name.replace(key, ''), name]).filter(([part]) => part)
    if (!parts.length && namespaced[key] !== root[key])
      wrong.push(key)
    for (const [part, name] of parts) {
      if (!namespaced[key]?.[part] || namespaced[key][part] !== root[name])
        wrong.push(`${key}.${part}`)
    }
  }
  check(!wrong.length, `reka-ui/namespaced: ${kind} members are the components of reka-ui${wrong.length ? ` (wrong: ${wrong.join(', ')})` : ''}`)
}

// --- reka-ui/resolver and reka-ui/nuxt ---
for (const [kind, mod] of [['import()', (await import('reka-ui/resolver')).default], ['require()', require('reka-ui/resolver')]]) {
  const resolver = typeof mod === 'function' ? mod : mod?.default
  check(typeof resolver === 'function', `reka-ui/resolver: ${kind} gives the resolver function`)
  const plain = resolver?.().resolve('AccordionRoot')
  const prefixed = resolver?.({ prefix: 'Reka' })
  check(plain?.name === 'AccordionRoot' && plain?.from === 'reka-ui', `reka-ui/resolver: ${kind} resolves AccordionRoot from reka-ui`)
  check(prefixed?.resolve('RekaDialogRoot')?.name === 'DialogRoot' && prefixed?.resolve('NotAComponent') === undefined, `reka-ui/resolver: ${kind} applies the prefix and skips unknown names`)
}
for (const [kind, mod] of [['import()', (await import('reka-ui/nuxt')).default], ['require()', require('reka-ui/nuxt')]]) {
  const nuxtModule = typeof mod === 'function' ? mod : mod?.default
  check(typeof nuxtModule === 'function', `reka-ui/nuxt: ${kind} gives a Nuxt module function`)
  const meta = await nuxtModule?.getMeta?.()
  check(meta?.configKey === 'reka', `reka-ui/nuxt: ${kind} module has the "reka" config key`)
}

// --- reka-ui/vapor needs a DOM: in Node both ways throw the documented error ---
const SSR = 'reka-ui/vapor does not support server-side rendering'
check((await message(() => import('reka-ui/vapor'))).startsWith(SSR), 'reka-ui/vapor: import() in Node throws the SSR error')
check((await message(() => require('reka-ui/vapor'))).startsWith(SSR), 'reka-ui/vapor: require() in Node throws the SSR error')

check(require('reka-ui/package.json').name === 'reka-ui', 'reka-ui/package.json: require() gives the manifest')

// --- Lazy parts render through require() ---
// PopoverContent, TooltipContent and HoverCardContent load their implementation with
// `defineAsyncComponent(() => import(...))`. In the CJS files that import becomes a `require()`
// whose result Vue does not recognise as a module, so a loader that hands it over as is renders
// nothing: each loader has to end with `.then(m => m.default)`.
const { createSSRApp, h } = require('vue')
const { renderToString } = require('vue/server-renderer')

const cases = {
  'PopoverContent (modal)': root => h(root.PopoverRoot, { open: true, modal: true }, () => [h(root.PopoverTrigger, () => 'open'), h(root.PopoverContent, () => 'lazy part')]),
  'PopoverContent (non-modal)': root => h(root.PopoverRoot, { open: true }, () => [h(root.PopoverTrigger, () => 'open'), h(root.PopoverContent, () => 'lazy part')]),
  'TooltipContent': root => h(root.TooltipProvider, () => h(root.TooltipRoot, { open: true }, () => [h(root.TooltipTrigger, () => 'open'), h(root.TooltipContent, () => 'lazy part')])),
  'HoverCardContent': root => h(root.HoverCardRoot, { open: true }, () => [h(root.HoverCardTrigger, () => 'open'), h(root.HoverCardContent, () => 'lazy part')]),
}
for (const [name, render] of Object.entries(cases)) {
  for (const [kind, root, vue, renderer] of [
    ['require()', loaded['.'].cjs, { createSSRApp }, renderToString],
    ['import()', loaded['.'].esm, await import('vue'), (await import('vue/server-renderer')).renderToString],
  ]) {
    const html = await renderer(vue.createSSRApp({ render: () => render(root) })).catch(e => `threw: ${e.message}`)
    check(html.includes('lazy part'), `${name}: ${kind} build renders its lazily loaded content on the server`)
  }
}

console.log(failed ? `\n${failed} check(s) failed` : '\nAll package smoke checks passed')
process.exit(failed ? 1 : 0)
